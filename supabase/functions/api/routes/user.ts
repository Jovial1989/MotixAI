import { errorResponse, json } from "../_lib/cors.ts";
import { getDb } from "../_lib/db.ts";
import type { TokenPayload } from "../_lib/jwt.ts";

const TRIAL_DAYS = 7;
const PROMO_CODES: Record<string, 'premium'> = {
  'motixfree26': 'premium',
};

async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export async function handleUser(
  req: Request,
  method: string,
  subpath: string,
  user: TokenPayload,
): Promise<Response> {
  if (user.sub === "guest") return errorResponse("Guests cannot update subscription", 403);

  const sql = getDb();

  // POST /user/select-plan
  if (subpath === "/select-plan" && method === "POST") {
    const { planType } = await body(req);
    if (!["free", "trial", "premium"].includes(planType as string)) {
      return errorResponse("planType must be free, trial, or premium", 400);
    }

    let subscriptionStatus = "none";
    let trialEndsAt: string | null = null;

    if (planType === "trial") {
      subscriptionStatus = "active";
      const d = new Date();
      d.setDate(d.getDate() + TRIAL_DAYS);
      trialEndsAt = d.toISOString();
    } else if (planType === "premium") {
      subscriptionStatus = "active";
    }

    const now = new Date().toISOString();

    if (trialEndsAt) {
      await sql`
        UPDATE "User"
        SET "planType" = ${planType as string},
            "subscriptionStatus" = ${subscriptionStatus},
            "trialEndsAt" = ${trialEndsAt},
            "updatedAt" = ${now}
        WHERE id = ${user.sub}
      `;
    } else {
      await sql`
        UPDATE "User"
        SET "planType" = ${planType as string},
            "subscriptionStatus" = ${subscriptionStatus},
            "trialEndsAt" = NULL,
            "updatedAt" = ${now}
        WHERE id = ${user.sub}
      `;
    }

    return json({ planType, subscriptionStatus, trialEndsAt });
  }

  // POST /user/onboarding-complete
  if (subpath === "/onboarding-complete" && method === "POST") {
    const now = new Date().toISOString();
    await sql`
      UPDATE "User"
      SET "hasCompletedOnboarding" = true, "updatedAt" = ${now}
      WHERE id = ${user.sub}
    `;
    return json({ success: true });
  }

  // POST /user/redeem-promo
  if (subpath === "/redeem-promo" && method === "POST") {
    const { promoCode } = await body(req);
    if (typeof promoCode !== "string" || !PROMO_CODES[promoCode]) {
      return errorResponse("Invalid promo code", 400);
    }

    // Check if already redeemed
    const existing = await sql`SELECT "promoCodeUsed" FROM "User" WHERE id = ${user.sub} LIMIT 1`;
    if (existing[0]?.promoCodeUsed) {
      return errorResponse("Promo code already redeemed", 409);
    }

    const planType = PROMO_CODES[promoCode];
    const now = new Date().toISOString();
    await sql`
      UPDATE "User"
      SET "planType" = ${planType},
          "subscriptionStatus" = 'active',
          "trialEndsAt" = NULL,
          "promoCodeUsed" = ${promoCode},
          "updatedAt" = ${now}
      WHERE id = ${user.sub}
    `;

    return json({ planType, subscriptionStatus: "active", promoCodeUsed: promoCode });
  }

  return errorResponse("Not Found", 404);
}
