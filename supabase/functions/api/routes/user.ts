import { errorResponse, json } from "../_lib/cors.ts";
import { getDb } from "../_lib/db.ts";
import type { TokenPayload } from "../_lib/jwt.ts";

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
    if (!["trial", "premium"].includes(planType as string)) {
      return errorResponse("planType must be trial or premium", 400);
    }

    const normalizedPlan = planType as string;
    const subscriptionStatus = "pending";
    const now = new Date().toISOString();

    await sql`
      UPDATE "User"
      SET "planType" = ${normalizedPlan},
          "subscriptionStatus" = ${subscriptionStatus},
          "trialEndsAt" = NULL,
          "hasCompletedOnboarding" = false,
          "updatedAt" = ${now}
      WHERE id = ${user.sub}
    `;

    return json({ planType: normalizedPlan, subscriptionStatus, trialEndsAt: null });
  }

  // POST /user/onboarding-complete
  if (subpath === "/onboarding-complete" && method === "POST") {
    const current = await sql`
      SELECT "planType", "subscriptionStatus", "promoCodeUsed"
      FROM "User"
      WHERE id = ${user.sub}
      LIMIT 1
    `;
    const state = current[0];
    if (!state) return errorResponse("User not found", 404);
    const isActivated =
      state.subscriptionStatus === "active" ||
      (typeof state.promoCodeUsed === "string" && state.promoCodeUsed.length > 0);
    if (!isActivated) {
      return errorResponse("Payment or promo activation is required before account setup can finish", 409);
    }

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
          "hasCompletedOnboarding" = true,
          "promoCodeUsed" = ${promoCode},
          "updatedAt" = ${now}
      WHERE id = ${user.sub}
    `;

    return json({ planType, subscriptionStatus: "active", promoCodeUsed: promoCode });
  }

  return errorResponse("Not Found", 404);
}
