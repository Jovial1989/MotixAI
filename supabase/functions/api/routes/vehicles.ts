import { json } from "../_lib/cors.ts";
import { getDb } from "../_lib/db.ts";
import type { TokenPayload } from "../_lib/jwt.ts";

function normalizeLanguage(raw: string | null | undefined): string {
  if (!raw) return "en";
  const lc = raw.trim().toLowerCase();
  if (lc === "uk" || lc === "ua") return "uk";
  if (lc === "bg") return "bg";
  return "en";
}

export async function handleVehicles(
  req: Request,
  method: string,
  subpath: string,
  user: TokenPayload,
): Promise<Response> {
  if (subpath !== "" || method !== "GET") {
    return new Response(null, { status: 404 });
  }

  const url = new URL(req.url);
  const language = normalizeLanguage(url.searchParams.get("language"));

  const sql = getDb();
  const guideWhere = user.tenantId
    ? sql`g."tenantId" = ${user.tenantId}`
    : sql`g."userId" = ${user.sub}`;

  // Only return vehicles that have guides in the requested language
  const vehicles = await sql`
    SELECT DISTINCT v.*
    FROM "Vehicle" v
    JOIN "RepairGuide" g ON g."vehicleId" = v.id
    WHERE ${guideWhere}
      AND (g."language" = ${language} OR g."language" IS NULL)
    ORDER BY v."createdAt" DESC
  `;

  const result = await Promise.all(
    vehicles.map(async (v) => {
      const [guides, jobs] = await Promise.all([
        sql`
          SELECT g.id, g.title, g."createdAt", g."language", p.name as part_name
          FROM "RepairGuide" g
          JOIN "Part" p ON p.id = g."partId"
          WHERE g."vehicleId" = ${v.id} AND ${guideWhere}
            AND (g."language" = ${language} OR g."language" IS NULL)
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
