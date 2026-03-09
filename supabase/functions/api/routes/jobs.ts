import { errorResponse, json } from "../_lib/cors.ts";
import { getDb, newId } from "../_lib/db.ts";
import type { TokenPayload } from "../_lib/jwt.ts";

async function body(req: Request): Promise<Record<string, unknown>> {
  try { return await req.json(); } catch { return {}; }
}

export async function handleJobs(
  req: Request,
  method: string,
  subpath: string,
  user: TokenPayload,
): Promise<Response> {
  const sql = getDb();
  const where = user.tenantId
    ? sql`"tenantId" = ${user.tenantId}`
    : sql`"userId" = ${user.sub}`;

  // POST /jobs — create job
  if (subpath === "" && method === "POST") {
    const b = await body(req);
    const vehicleId = typeof b.vehicleId === "string" ? b.vehicleId : null;
    const problemDescription = typeof b.problemDescription === "string" ? b.problemDescription : null;
    if (!vehicleId || !problemDescription) return errorResponse("vehicleId and problemDescription required", 400);

    const id = newId();
    const now = new Date().toISOString();
    await sql`
      INSERT INTO "RepairJob" (id, "tenantId", "userId", "vehicleId", "guideId",
        "problemDescription", "notes", status, "createdAt", "updatedAt")
      VALUES (${id}, ${user.tenantId}, ${user.sub}, ${vehicleId},
        ${typeof b.guideId === "string" ? b.guideId : null},
        ${problemDescription}, ${typeof b.notes === "string" ? b.notes : null},
        'pending', ${now}, ${now})
    `;
    const rows = await sql`
      SELECT j.*, v.model as vehicle_model, v.vin as vehicle_vin
      FROM "RepairJob" j
      JOIN "Vehicle" v ON v.id = j."vehicleId"
      WHERE j.id = ${id} LIMIT 1
    `;
    const r = rows[0];
    return json({ ...r, vehicle: { id: r.vehicleId, model: r.vehicle_model, vin: r.vehicle_vin } }, 201);
  }

  // GET /jobs
  if (subpath === "" && method === "GET") {
    const rows = await sql`
      SELECT j.*, v.model as vehicle_model, v.vin as vehicle_vin
      FROM "RepairJob" j
      JOIN "Vehicle" v ON v.id = j."vehicleId"
      WHERE ${where}
      ORDER BY j."createdAt" DESC
    `;
    return json(rows.map((r) => ({ ...r, vehicle: { id: r.vehicleId, model: r.vehicle_model, vin: r.vehicle_vin } })));
  }

  const idMatch = subpath.match(/^\/([a-zA-Z0-9]+)$/);

  // PATCH /jobs/:id — update status
  if (idMatch && method === "PATCH") {
    const jobId = idMatch[1];
    const b = await body(req);
    const status = typeof b.status === "string" ? b.status : null;
    if (!status) return errorResponse("status required", 400);

    const existing = await sql`SELECT id FROM "RepairJob" WHERE id = ${jobId} AND ${where} LIMIT 1`;
    if (existing.length === 0) return errorResponse("Job not found", 404);

    await sql`
      UPDATE "RepairJob"
      SET status = ${status},
          ${typeof b.notes === "string" ? sql`notes = ${b.notes},` : sql``}
          "updatedAt" = ${new Date().toISOString()}
      WHERE id = ${jobId}
    `;
    const rows = await sql`
      SELECT j.*, v.model as vehicle_model FROM "RepairJob" j
      JOIN "Vehicle" v ON v.id = j."vehicleId"
      WHERE j.id = ${jobId} LIMIT 1
    `;
    const r = rows[0];
    return json({ ...r, vehicle: { id: r.vehicleId, model: r.vehicle_model } });
  }

  // DELETE /jobs/:id
  if (idMatch && method === "DELETE") {
    const jobId = idMatch[1];
    const existing = await sql`SELECT id FROM "RepairJob" WHERE id = ${jobId} AND ${where} LIMIT 1`;
    if (existing.length === 0) return errorResponse("Job not found", 404);
    await sql`DELETE FROM "RepairJob" WHERE id = ${jobId}`;
    return new Response(null, { status: 204 });
  }

  return errorResponse("Not Found", 404);
}
