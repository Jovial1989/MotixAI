import { json } from "../_lib/cors.ts";
import { getDb } from "../_lib/db.ts";
import type { TokenPayload } from "../_lib/jwt.ts";

const TIME_SAVED_PER_GUIDE_MIN = 45;

export async function handleAnalytics(
  _req: Request,
  method: string,
  subpath: string,
  user: TokenPayload,
): Promise<Response> {
  if (subpath !== "" || method !== "GET") {
    return new Response(null, { status: 404 });
  }

  const sql = getDb();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const where = user.tenantId
    ? sql`"tenantId" = ${user.tenantId}`
    : sql`"userId" = ${user.sub}`;

  const [thisMonth, allGuides, recentGuides, recentJobs, topParts, vehicleCount] =
    await Promise.all([
      sql`SELECT COUNT(*)::int as count FROM "RepairGuide" WHERE ${where} AND "createdAt" >= ${monthStart}`,
      sql`SELECT COUNT(*)::int as count FROM "RepairGuide" WHERE ${where}`,
      sql`SELECT id, title, "createdAt" FROM "RepairGuide" WHERE ${where} ORDER BY "createdAt" DESC LIMIT 5`,
      sql`SELECT id, "problemDescription", "createdAt" FROM "RepairJob" WHERE ${where} ORDER BY "createdAt" DESC LIMIT 5`,
      sql`
        SELECT p.name, COUNT(g.id)::int as count
        FROM "Part" p
        JOIN "RepairGuide" g ON g."partId" = p.id
        WHERE ${user.tenantId ? sql`g."tenantId" = ${user.tenantId}` : sql`g."userId" = ${user.sub}`}
        GROUP BY p.name ORDER BY count DESC LIMIT 5
      `,
      sql`
        SELECT COUNT(DISTINCT v.id)::int as count
        FROM "Vehicle" v
        JOIN "RepairGuide" g ON g."vehicleId" = v.id
        WHERE ${user.tenantId ? sql`g."tenantId" = ${user.tenantId}` : sql`g."userId" = ${user.sub}`}
      `,
    ]);

  const recentActivity = [
    ...recentGuides.map((g) => ({ id: g.id, type: "guide", title: g.title, createdAt: g.createdAt })),
    ...recentJobs.map((j) => ({ id: j.id, type: "job", title: j.problemDescription, createdAt: j.createdAt })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return json({
    guidesThisMonth: thisMonth[0]?.count ?? 0,
    timeSavedMinutes: (allGuides[0]?.count ?? 0) * TIME_SAVED_PER_GUIDE_MIN,
    activeVehicles: vehicleCount[0]?.count ?? 0,
    mostCommonRepairs: topParts.map((p) => ({ partName: p.name, count: p.count })),
    recentActivity,
  });
}
