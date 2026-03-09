import { errorResponse, json } from "../_lib/cors.ts";
import { getDb } from "../_lib/db.ts";
import type { TokenPayload } from "../_lib/jwt.ts";

async function body(req: Request): Promise<Record<string, unknown>> {
  try { return await req.json(); } catch { return {}; }
}

export async function handleAdmin(
  req: Request,
  method: string,
  subpath: string,
  user: TokenPayload,
): Promise<Response> {
  // Admin-only
  if (user.role !== "ENTERPRISE_ADMIN") return errorResponse("Forbidden", 403);

  const sql = getDb();

  // GET /admin/requests
  if (subpath === "/requests" && method === "GET") {
    const rows = await sql`
      SELECT r.*, g.title as guide_title
      FROM "GuideRequest" r
      LEFT JOIN "RepairGuide" g ON g.id = r."guideId"
      WHERE r.status = 'pending'
      ORDER BY r."createdAt" ASC
    `;
    return json(rows.map((r) => ({
      ...r,
      guide: r.guideId ? { id: r.guideId, title: r.guide_title } : null,
    })));
  }

  // PATCH /admin/requests/:id
  const reqIdMatch = subpath.match(/^\/requests\/([a-zA-Z0-9]+)$/);
  if (reqIdMatch && method === "PATCH") {
    const id = reqIdMatch[1];
    const b = await body(req);
    const status = typeof b.status === "string" ? b.status : null;
    if (!status) return errorResponse("status required", 400);
    await sql`
      UPDATE "GuideRequest"
      SET status = ${status},
          ${typeof b.guideId === "string" ? sql`"guideId" = ${b.guideId},` : sql``}
          "updatedAt" = ${new Date().toISOString()}
      WHERE id = ${id}
    `;
    const rows = await sql`SELECT * FROM "GuideRequest" WHERE id = ${id} LIMIT 1`;
    return json(rows[0]);
  }

  // GET /admin/guides
  if (subpath === "/guides" && method === "GET") {
    const rows = await sql`
      SELECT g.*, v.model as vehicle_model, p.name as part_name,
             u.email as user_email, u."fullName" as user_name
      FROM "RepairGuide" g
      JOIN "Vehicle" v ON v.id = g."vehicleId"
      JOIN "Part" p ON p.id = g."partId"
      JOIN "User" u ON u.id = g."userId"
      ORDER BY g."createdAt" DESC LIMIT 50
    `;
    return json(rows.map((g) => ({
      ...g,
      vehicle: { id: g.vehicleId, model: g.vehicle_model },
      part: { id: g.partId, name: g.part_name },
      user: { email: g.user_email, fullName: g.user_name },
    })));
  }

  // PATCH /admin/guides/:id
  const guideIdMatch = subpath.match(/^\/guides\/([a-zA-Z0-9]+)$/);
  if (guideIdMatch && method === "PATCH") {
    const id = guideIdMatch[1];
    const b = await body(req);
    await sql`
      UPDATE "RepairGuide"
      SET ${b.title ? sql`title = ${b.title},` : sql``}
          ${b.status ? sql`status = ${b.status},` : sql``}
          "updatedAt" = ${new Date().toISOString()}
      WHERE id = ${id}
    `;
    const rows = await sql`SELECT * FROM "RepairGuide" WHERE id = ${id} LIMIT 1`;
    return json(rows[0]);
  }

  // GET /admin/users
  if (subpath === "/users" && method === "GET") {
    const rows = await sql`
      SELECT id, email, "fullName", role, "tenantId", "createdAt"
      FROM "User"
      ORDER BY "createdAt" DESC LIMIT 100
    `;
    return json(rows);
  }

  return errorResponse("Not Found", 404);
}
