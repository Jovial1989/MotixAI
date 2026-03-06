import bcrypt from "npm:bcryptjs@2";
import * as jose from "npm:jose@5";
import { errorResponse, json } from "../_lib/cors.ts";
import { getDb, newId } from "../_lib/db.ts";
import { issueTokens, signAccess, TokenPayload, verifyRefresh } from "../_lib/jwt.ts";

async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export async function handleAuth(
  req: Request,
  method: string,
  subpath: string,
): Promise<Response> {
  const sql = getDb();

  // POST /auth/signup
  if (subpath === "/signup" && method === "POST") {
    const { email, password } = await body(req);
    if (typeof email !== "string" || !email.includes("@"))
      return errorResponse("email must be a valid email", 400);
    if (typeof password !== "string" || password.length < 8)
      return errorResponse("password must be at least 8 characters", 400);

    const existing =
      await sql`SELECT id FROM "User" WHERE email = ${email.toLowerCase()} LIMIT 1`;
    if (existing.length > 0) return errorResponse("Email already registered", 409);

    const passwordHash = await bcrypt.hash(password, 10);
    const id = newId();
    const now = new Date().toISOString();

    await sql`
      INSERT INTO "User" (id, email, "passwordHash", "fullName", role, "createdAt", "updatedAt")
      VALUES (${id}, ${email.toLowerCase()}, ${passwordHash}, ${""}, ${"USER"}, ${now}, ${now})
    `;

    const payload: TokenPayload = {
      sub: id,
      email: email.toLowerCase(),
      role: "USER",
      tenantId: null,
    };
    return json(await issueTokens(payload), 201);
  }

  // POST /auth/login
  if (subpath === "/login" && method === "POST") {
    const { email, password } = await body(req);
    if (typeof email !== "string" || typeof password !== "string")
      return errorResponse("email and password are required", 400);

    const rows =
      await sql`SELECT id, email, "passwordHash", role, "tenantId" FROM "User" WHERE email = ${email.toLowerCase()} LIMIT 1`;
    if (rows.length === 0) return errorResponse("Invalid credentials", 401);

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return errorResponse("Invalid credentials", 401);

    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as TokenPayload["role"],
      tenantId: user.tenantId ?? null,
    };
    return json(await issueTokens(payload));
  }

  // POST /auth/refresh
  if (subpath === "/refresh" && method === "POST") {
    const { refreshToken } = await body(req);
    if (typeof refreshToken !== "string" || refreshToken.length < 10)
      return errorResponse("refreshToken is required", 400);

    try {
      const decoded = await verifyRefresh(refreshToken);
      return json(await issueTokens(decoded));
    } catch {
      return errorResponse("Invalid refresh token", 401);
    }
  }

  // POST /auth/guest
  if (subpath === "/guest" && method === "POST") {
    const payload: TokenPayload = {
      sub: "guest",
      email: "guest@motixai.dev",
      role: "GUEST",
      tenantId: null,
    };
    const accessSecret = new TextEncoder().encode(
      Deno.env.get("JWT_ACCESS_SECRET") ?? "change-me-access",
    );
    const accessToken = await new jose.SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(accessSecret);

    return json({
      accessToken,
      refreshToken: null,
      user: { id: "guest", email: "guest@motixai.dev", role: "GUEST", tenantId: null },
    });
  }

  // POST /auth/forgot-password
  if (subpath === "/forgot-password" && method === "POST") {
    const { email } = await body(req);
    if (typeof email !== "string" || !email.includes("@"))
      return errorResponse("email must be a valid email", 400);

    const rows = await sql`SELECT id FROM "User" WHERE email = ${email.toLowerCase()} LIMIT 1`;
    if (rows.length === 0) {
      return json({ resetToken: null, message: "If that email exists, a reset token has been generated." });
    }

    const accessSecret = new TextEncoder().encode(
      Deno.env.get("JWT_ACCESS_SECRET") ?? "change-me-access",
    );
    const resetToken = await new jose.SignJWT({
      sub: rows[0].id,
      purpose: "password-reset",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("15m")
      .sign(accessSecret);

    return json({ resetToken, message: "Use the reset token within 15 minutes." });
  }

  // POST /auth/reset-password
  if (subpath === "/reset-password" && method === "POST") {
    const { resetToken, newPassword } = await body(req);
    if (typeof resetToken !== "string" || resetToken.length < 10)
      return errorResponse("resetToken is required", 400);
    if (typeof newPassword !== "string" || newPassword.length < 8)
      return errorResponse("newPassword must be at least 8 characters", 400);

    const accessSecret = new TextEncoder().encode(
      Deno.env.get("JWT_ACCESS_SECRET") ?? "change-me-access",
    );
    let decoded: { sub: string; purpose: string };
    try {
      const { payload } = await jose.jwtVerify(resetToken, accessSecret);
      decoded = payload as unknown as { sub: string; purpose: string };
    } catch {
      return errorResponse("Reset token is invalid or has expired", 401);
    }

    if (decoded.purpose !== "password-reset")
      return errorResponse("Reset token is invalid or has expired", 401);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE "User" SET "passwordHash" = ${passwordHash}, "updatedAt" = ${new Date().toISOString()} WHERE id = ${decoded.sub}`;

    return json({ message: "Password updated successfully" });
  }

  return errorResponse("Not Found", 404);
}
