import Stripe from "npm:stripe@17";
import { errorResponse, json } from "../_lib/cors.ts";
import { getDb } from "../_lib/db.ts";
import type { TokenPayload } from "../_lib/jwt.ts";

function getStripe(): Stripe {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function normalizeCurrency(code: string | null | undefined): string {
  return (code ?? "usd").toUpperCase();
}

function stripePeriodEnd(subscription: Stripe.Subscription): string | null {
  const value = (subscription as unknown as { current_period_end?: number }).current_period_end;
  if (!value) return null;
  return new Date(value * 1000).toISOString();
}

function stripeTrialEnd(subscription: Stripe.Subscription): string | null {
  const value = (subscription as unknown as { trial_end?: number | null }).trial_end;
  if (!value) return null;
  return new Date(value * 1000).toISOString();
}

function priceSummaryFromPrice(price: Stripe.Price | Stripe.DeletedPrice | null | undefined) {
  if (!price || (price as Stripe.DeletedPrice).deleted) return null;
  const recurring = price.recurring;
  return {
    amount: price.unit_amount ?? null,
    currency: normalizeCurrency(price.currency),
    interval: recurring?.interval ?? "month",
  };
}

export async function handleBilling(
  req: Request,
  method: string,
  subpath: string,
  user: TokenPayload,
): Promise<Response> {
  if (user.sub === "guest") {
    return errorResponse("Guests cannot access billing", 403);
  }

  const sql = getDb();

  // POST /billing/create-checkout-session
  if (subpath === "/create-checkout-session" && method === "POST") {
    const { successUrl, cancelUrl, trial } = await body(req);
    const stripe = getStripe();
    const priceId = Deno.env.get("STRIPE_PRO_PRICE_ID");
    if (!priceId) return errorResponse("Stripe price not configured", 500);

    // Find or create Stripe customer
    const rows = await sql`
      SELECT id, email, "stripeCustomerId" FROM "User" WHERE id = ${user.sub} LIMIT 1
    `;
    if (!rows.length) return errorResponse("User not found", 404);
    const dbUser = rows[0];

    let customerId = dbUser.stripeCustomerId as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email as string,
        metadata: { userId: user.sub },
      });
      customerId = customer.id;
      const now = new Date().toISOString();
      await sql`
        UPDATE "User" SET "stripeCustomerId" = ${customerId}, "updatedAt" = ${now}
        WHERE id = ${user.sub}
      `;
    }

    // Build subscription data
    const subscriptionData: Stripe.Checkout.SessionCreateParams["subscription_data"] = {
      metadata: { userId: user.sub },
    };
    if (trial) {
      subscriptionData.trial_period_days = 7;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: (successUrl as string) || "https://www.motixi.com/dashboard?billing=trial-started",
      cancel_url: (cancelUrl as string) || "https://www.motixi.com/dashboard?billing=cancelled",
      metadata: { userId: user.sub, trial: trial ? "true" : "false" },
      subscription_data: subscriptionData,
    });

    return json({ sessionId: session.id, url: session.url });
  }

  // POST /billing/portal-session
  if (subpath === "/portal-session" && method === "POST") {
    const { returnUrl } = await body(req);
    const stripe = getStripe();

    const rows = await sql`
      SELECT "stripeCustomerId" FROM "User" WHERE id = ${user.sub} LIMIT 1
    `;
    if (!rows.length) return errorResponse("User not found", 404);
    const customerId = rows[0].stripeCustomerId as string | null;
    if (!customerId) return errorResponse("No billing account found", 400);

    try {
      // Ensure a portal configuration exists (idempotent — Stripe allows multiple)
      const configs = await stripe.billingPortal.configurations.list({ limit: 1 });
      if (configs.data.length === 0) {
        await stripe.billingPortal.configurations.create({
          business_profile: {
            headline: "Motixi — Manage your subscription",
          },
          features: {
            subscription_cancel: { enabled: true },
            payment_method_update: { enabled: true },
            invoice_history: { list: { enabled: true } },
          },
        });
        console.log("[billing] created Stripe billing portal configuration");
      }
    } catch (configErr) {
      console.warn("[billing] portal config check failed (non-fatal):", configErr);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: (returnUrl as string) || "https://www.motixi.com/dashboard",
    });

    return json({ url: session.url });
  }

  // GET /billing/summary
  if (subpath === "/summary" && method === "GET") {
    const rows = await sql`
      SELECT "planType", "subscriptionStatus", "trialEndsAt", "currentPeriodEnd",
             "stripeCustomerId", "stripeSubscriptionId"
      FROM "User"
      WHERE id = ${user.sub}
      LIMIT 1
    `;
    if (!rows.length) return errorResponse("User not found", 404);

    const dbUser = rows[0];
    const customerId = dbUser.stripeCustomerId as string | null;
    const subscriptionId = dbUser.stripeSubscriptionId as string | null;
    const priceId = Deno.env.get("STRIPE_PRO_PRICE_ID");

    let trialEndsAt = dbUser.trialEndsAt ? new Date(dbUser.trialEndsAt as string).toISOString() : null;
    let currentPeriodEnd = dbUser.currentPeriodEnd ? new Date(dbUser.currentPeriodEnd as string).toISOString() : null;
    let paymentMethodBrand: string | null = null;
    let paymentMethodLast4: string | null = null;
    let priceAmount: number | null = 3900;
    let priceCurrency = "USD";
    let priceInterval = "month";

    try {
      const stripe = getStripe();

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ["default_payment_method", "items.data.price"],
        });

        currentPeriodEnd = stripePeriodEnd(subscription) ?? currentPeriodEnd;
        trialEndsAt = stripeTrialEnd(subscription) ?? trialEndsAt;

        const subscriptionPrice = priceSummaryFromPrice(subscription.items.data[0]?.price);
        if (subscriptionPrice) {
          priceAmount = subscriptionPrice.amount;
          priceCurrency = subscriptionPrice.currency;
          priceInterval = subscriptionPrice.interval;
        }

        const defaultMethod = subscription.default_payment_method;
        if (defaultMethod && typeof defaultMethod !== "string" && defaultMethod.type === "card") {
          paymentMethodBrand = defaultMethod.card?.brand ?? null;
          paymentMethodLast4 = defaultMethod.card?.last4 ?? null;
        }
      }

      if (customerId && !paymentMethodLast4) {
        const customer = await stripe.customers.retrieve(customerId, {
          expand: ["invoice_settings.default_payment_method"],
        });
        if (!("deleted" in customer)) {
          const defaultMethod = customer.invoice_settings?.default_payment_method;
          if (defaultMethod && typeof defaultMethod !== "string" && defaultMethod.type === "card") {
            paymentMethodBrand = defaultMethod.card?.brand ?? null;
            paymentMethodLast4 = defaultMethod.card?.last4 ?? null;
          }
        }
      }

      if ((!priceAmount || !priceCurrency) && priceId) {
        const price = await stripe.prices.retrieve(priceId);
        const priceSummary = priceSummaryFromPrice(price);
        if (priceSummary) {
          priceAmount = priceSummary.amount;
          priceCurrency = priceSummary.currency;
          priceInterval = priceSummary.interval;
        }
      }
    } catch (err) {
      console.warn("[billing] summary fallback:", err);
    }

    return json({
      planType: dbUser.planType ?? "free",
      subscriptionStatus: dbUser.subscriptionStatus ?? "none",
      trialEndsAt,
      currentPeriodEnd,
      hasBillingAccount: Boolean(customerId),
      canManageSubscription: Boolean(customerId),
      priceAmount,
      priceCurrency,
      priceInterval,
      paymentMethodBrand,
      paymentMethodLast4,
    });
  }

  // POST /billing/webhook — called without auth (Stripe signature verification)
  // Note: this route is handled separately in index.ts (no JWT required)

  return errorResponse("Not Found", 404);
}

/**
 * Handle Stripe webhook — no JWT, uses signature verification.
 * Called from index.ts before the JWT guard.
 */
export async function handleBillingWebhook(req: Request): Promise<Response> {
  const stripe = getStripe();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) return errorResponse("Webhook secret not configured", 500);

  const signature = req.headers.get("stripe-signature");
  if (!signature) return errorResponse("Missing stripe-signature header", 400);

  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[billing] webhook signature failed:", err);
    return errorResponse("Invalid signature", 400);
  }

  console.log(`[billing] webhook: ${event.type}`);

  const sql = getDb();
  const now = new Date().toISOString();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    if (!userId) {
      console.warn("[billing] checkout.session.completed missing userId");
      return json({ received: true });
    }

    const isTrial = session.metadata?.trial === "true";
    const subscriptionId = session.subscription as string | null;

    if (isTrial) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);
      await sql`
        UPDATE "User"
        SET "planType" = 'trial',
            "subscriptionStatus" = 'active',
            "stripeSubscriptionId" = ${subscriptionId},
            "stripeCustomerId" = ${session.customer as string},
            "trialEndsAt" = ${trialEndsAt.toISOString()},
            "updatedAt" = ${now}
        WHERE id = ${userId}
      `;
      console.log(`[billing] user ${userId} started Pro trial via Stripe`);
    } else {
      await sql`
        UPDATE "User"
        SET "planType" = 'premium',
            "subscriptionStatus" = 'active',
            "stripeSubscriptionId" = ${subscriptionId},
            "stripeCustomerId" = ${session.customer as string},
            "updatedAt" = ${now}
        WHERE id = ${userId}
      `;
      console.log(`[billing] user ${userId} upgraded to Pro`);
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    if (!userId) return json({ received: true });

    const status = subscription.status;
    const periodEnd = new Date(
      (subscription as unknown as { current_period_end: number }).current_period_end * 1000,
    ).toISOString();

    if (status === "trialing") {
      const trialEnd = (subscription as unknown as { trial_end: number | null }).trial_end;
      const trialEndsAt = trialEnd ? new Date(trialEnd * 1000).toISOString() : null;
      if (trialEndsAt) {
        await sql`
          UPDATE "User"
          SET "planType" = 'trial', "subscriptionStatus" = 'active',
              "stripeSubscriptionId" = ${subscription.id},
              "currentPeriodEnd" = ${periodEnd},
              "trialEndsAt" = ${trialEndsAt},
              "updatedAt" = ${now}
          WHERE id = ${userId}
        `;
      } else {
        await sql`
          UPDATE "User"
          SET "planType" = 'trial', "subscriptionStatus" = 'active',
              "stripeSubscriptionId" = ${subscription.id},
              "currentPeriodEnd" = ${periodEnd},
              "updatedAt" = ${now}
          WHERE id = ${userId}
        `;
      }
    } else if (status === "active") {
      await sql`
        UPDATE "User"
        SET "planType" = 'premium', "subscriptionStatus" = 'active',
            "stripeSubscriptionId" = ${subscription.id},
            "currentPeriodEnd" = ${periodEnd},
            "trialEndsAt" = NULL,
            "updatedAt" = ${now}
        WHERE id = ${userId}
      `;
    } else if (status === "past_due" || status === "unpaid") {
      await sql`
        UPDATE "User"
        SET "subscriptionStatus" = 'expired', "updatedAt" = ${now}
        WHERE id = ${userId}
      `;
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    if (!userId) return json({ received: true });

    await sql`
      UPDATE "User"
      SET "planType" = 'free', "subscriptionStatus" = 'none',
          "stripeSubscriptionId" = NULL, "currentPeriodEnd" = NULL,
          "updatedAt" = ${now}
      WHERE id = ${userId}
    `;
    console.log(`[billing] user ${userId} subscription cancelled — downgraded to Free`);
  }

  return json({ received: true });
}
