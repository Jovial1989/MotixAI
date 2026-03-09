import { errorResponse, json } from "../_lib/cors.ts";
import { getDb, newId } from "../_lib/db.ts";
import type { TokenPayload } from "../_lib/jwt.ts";

async function body(req: Request): Promise<Record<string, unknown>> {
  try { return await req.json(); } catch { return {}; }
}

export async function handleRequests(
  req: Request,
  method: string,
  subpath: string,
  user: TokenPayload,
): Promise<Response> {
  const sql = getDb();
  const where = user.tenantId
    ? sql`"tenantId" = ${user.tenantId}`
    : sql`"userId" = ${user.sub}`;

  // POST /requests — create guide request
  if (subpath === "" && method === "POST") {
    const b = await body(req);
    const vehicleModel = typeof b.vehicleModel === "string" ? b.vehicleModel : null;
    const repairType = typeof b.repairType === "string" ? b.repairType : null;
    if (!vehicleModel || !repairType) return errorResponse("vehicleModel and repairType required", 400);

    const id = newId();
    const now = new Date().toISOString();
    await sql`
      INSERT INTO "GuideRequest" (id, "tenantId", "userId", "vehicleModel", "repairType",
        "partNumber", notes, status, "createdAt", "updatedAt")
      VALUES (${id}, ${user.tenantId}, ${user.sub}, ${vehicleModel}, ${repairType},
        ${typeof b.partNumber === "string" ? b.partNumber : null},
        ${typeof b.notes === "string" ? b.notes : null},
        'pending', ${now}, ${now})
    `;
    const rows = await sql`SELECT * FROM "GuideRequest" WHERE id = ${id} LIMIT 1`;
    return json(rows[0], 201);
  }

  // GET /requests
  if (subpath === "" && method === "GET") {
    const rows = await sql`
      SELECT r.*, g.title as guide_title
      FROM "GuideRequest" r
      LEFT JOIN "RepairGuide" g ON g.id = r."guideId"
      WHERE ${where}
      ORDER BY r."createdAt" DESC
    `;
    return json(rows.map((r) => ({
      ...r,
      guide: r.guideId ? { id: r.guideId, title: r.guide_title } : null,
    })));
  }

  return errorResponse("Not Found", 404);
}
