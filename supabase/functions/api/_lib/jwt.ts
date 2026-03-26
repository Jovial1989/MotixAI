import * as jose from "npm:jose@5";

export type TokenRole = "USER" | "ENTERPRISE_ADMIN" | "GUEST";

export interface TokenPayload {
  sub: string;
  email: string;
  role: TokenRole;
  tenantId: string | null;
}

export interface UserRecord {
  id: string;
  email: string;
  role: string;
  tenantId: string | null;
  hasCompletedOnboarding: boolean;
  planType: string;
  trialEndsAt: string | null;
  subscriptionStatus: string;
}

const ACCESS_SECRET = new TextEncoder().encode(
  Deno.env.get("JWT_ACCESS_SECRET") ?? "change-me-access",
);
const REFRESH_SECRET = new TextEncoder().encode(
  Deno.env.get("JWT_REFRESH_SECRET") ?? "change-me-refresh",
);

const ACCESS_EXPIRES_IN = Deno.env.get("JWT_ACCESS_EXPIRES_IN") ?? "15m";
const REFRESH_EXPIRES_IN = Deno.env.get("JWT_REFRESH_EXPIRES_IN") ?? "7d";

export async function signAccess(payload: TokenPayload): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(ACCESS_EXPIRES_IN)
    .sign(ACCESS_SECRET);
}

export async function signRefresh(payload: TokenPayload): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(REFRESH_EXPIRES_IN)
    .sign(REFRESH_SECRET);
}

export async function verifyAccess(token: string): Promise<TokenPayload> {
  const { payload } = await jose.jwtVerify(token, ACCESS_SECRET);
  return payload as unknown as TokenPayload;
}

export async function verifyRefresh(token: string): Promise<TokenPayload> {
  const { payload } = await jose.jwtVerify(token, REFRESH_SECRET);
  return payload as unknown as TokenPayload;
}

/** Issue tokens + build the full user response including subscription fields. */
export function issueTokensForUser(user: UserRecord) {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role as TokenRole,
    tenantId: user.tenantId,
  };
  return Promise.all([signAccess(payload), signRefresh(payload)]).then(
    ([accessToken, refreshToken]) => ({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        planType: user.planType,
        trialEndsAt: user.trialEndsAt,
        subscriptionStatus: user.subscriptionStatus,
      },
    }),
  );
}

/** @deprecated Use issueTokensForUser with a DB-fetched user for subscription fields. */
export function issueTokens(payload: TokenPayload) {
  return Promise.all([signAccess(payload), signRefresh(payload)]).then(
    ([accessToken, refreshToken]) => ({
      accessToken,
      refreshToken,
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId,
        hasCompletedOnboarding: false,
        planType: "demo",
        trialEndsAt: null,
        subscriptionStatus: "none",
      },
    }),
  );
}

export async function extractUser(req: Request): Promise<TokenPayload | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return await verifyAccess(auth.slice(7));
  } catch {
    return null;
  }
}
