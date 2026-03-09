import { json } from "../_lib/cors.ts";
import { getDb } from "../_lib/db.ts";
import type { TokenPayload } from "../_lib/jwt.ts";

export async function handleVehicles(
  _req: Request,
  method: string,
  subpath: string,
  user: TokenPayload,
): Promise<Response> {
  if (subpath !== "" || method !== "GET") {
    return new Response(null, { status: 404 });
  }

  const sql = getDb();
  const guideWhere = user.tenantId
    ? sql`g."tenantId" = ${user.tenantId}`
    : sql`g."userId" = ${user.sub}`;

  const vehicles = await sql`
    SELECT DISTINCT v.*
    FROM "Vehicle" v
    JOIN "RepairGuide" g ON g."vehicleId" = v.id
    WHERE ${guideWhere}
    ORDER BY v."createdAt" DESC
  `;

  const result = await Promise.all(
    vehicles.map(async (v) => {
      const [guides, jobs] = await Promise.all([
        sql`
          SELECT g.id, g.title, g."createdAt", p.name as part_name
          FROM "RepairGuide" g
          JOIN "Part" p ON p.id = g."partId"
          WHERE g."vehicleId" = ${v.id} AND ${guideWhere}
          ORDER BY g."createdAt" DESC LIMIT 5
        `,
        sql`
          SELECT id, status, "problemDescription", "createdAt"
          FROM "RepairJob"
          WHERE "vehicleId" = ${v.id}
            AND ${user.tenantId ? sql`"tenantId" = ${user.tenantId}` : sql`"userId" = ${user.sub}`}
          ORDER BY "createdAt" DESC LIMIT 5
        `,
      ]);
      return {
        ...v,
        guides: guides.map((g) => ({ id: g.id, title: g.title, createdAt: g.createdAt, part: { name: g.part_name } })),
        repairJobs: jobs,
      };
    }),
  );

  return json(result);
}
