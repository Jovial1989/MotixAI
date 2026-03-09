import * as jose from "npm:jose@5";

export type TokenRole = "USER" | "ENTERPRISE_ADMIN" | "GUEST";

export interface TokenPayload {
  sub: string;
  email: string;
  role: TokenRole;
  tenantId: string | null;
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
