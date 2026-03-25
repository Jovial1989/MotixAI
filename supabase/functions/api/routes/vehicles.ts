import { errorResponse, json } from "../_lib/cors.ts";
import { getDb } from "../_lib/db.ts";
import { generateVehicleImage } from "../_lib/gemini.ts";
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
  const sql = getDb();

  // POST /vehicles/:id/generate-image — generate and store a vehicle illustration
  const imgMatch = subpath.match(/^\/([a-zA-Z0-9_-]+)\/generate-image$/);
  if (imgMatch && method === "POST") {
    const vehicleId = imgMatch[1];

    const rows = await sql`
      SELECT id, model, "imageUrl" FROM "Vehicle" WHERE id = ${vehicleId} LIMIT 1
    `;
    if (rows.length === 0) return errorResponse("Vehicle not found", 404);

    const vehicle = rows[0];
    // Return cached image if already generated
    if (vehicle.imageUrl) {
      return json({ imageUrl: vehicle.imageUrl });
    }

    try {
      const imageData = await generateVehicleImage(vehicle.model as string);
      const now = new Date().toISOString();
      await sql`
        UPDATE "Vehicle" SET "imageUrl" = ${imageData}, "updatedAt" = ${now}
        WHERE id = ${vehicleId}
      `;
      return json({ imageUrl: imageData });
    } catch (err) {
      console.error("[vehicles] image generation failed:", err instanceof Error ? err.message : err);
      return errorResponse("Image generation failed", 500);
    }
  }

  // GET /vehicles — list vehicles with guides
  if (subpath === "" && method === "GET") {
    const url = new URL(req.url);
    const language = normalizeLanguage(url.searchParams.get("language"));

    const guideWhere = user.tenantId
      ? sql`g."tenantId" = ${user.tenantId}`
      : sql`g."userId" = ${user.sub}`;

    // Only return vehicles that have guides in the requested language
    // Fall back to showing all guides if none match the requested language
    const vehicles = await sql`
      SELECT DISTINCT v.*
      FROM "Vehicle" v
      JOIN "RepairGuide" g ON g."vehicleId" = v.id
      WHERE ${guideWhere}
        AND (g."language" = ${language} OR g."language" IS NULL OR g."language" = 'en')
      ORDER BY v."createdAt" DESC
    `;

    const result = await Promise.all(
      vehicles.map(async (v) => {
        const [guides, jobs] = await Promise.all([
          // Prefer guides in the requested language, fallback to English
          sql`
            SELECT g.id, g.title, g."createdAt", g."language", p.name as part_name
            FROM "RepairGuide" g
            JOIN "Part" p ON p.id = g."partId"
            WHERE g."vehicleId" = ${v.id} AND ${guideWhere}
              AND (g."language" = ${language} OR g."language" IS NULL OR g."language" = 'en')
            ORDER BY
              CASE WHEN g."language" = ${language} THEN 0
                   WHEN g."language" IS NULL THEN 1
                   ELSE 2 END,
              g."createdAt" DESC
            LIMIT 5
          `,
          sql`
            SELECT id, status, "problemDescription", "createdAt"
            FROM "RepairJob"
            WHERE "vehicleId" = ${v.id}
              AND ${user.tenantId ? sql`"tenantId" = ${user.tenantId}` : sql`"userId" = ${user.sub}`}
            ORDER BY "createdAt" DESC LIMIT 5
          `,
        ]);

        // Deduplicate: if we have a localized version AND an English version of the
        // same canonical guide, only show the localized one
        const seen = new Set<string>();
        const deduped = guides.filter((g) => {
          const canonicalId = (g.canonicalGuideId as string) || (g.id as string);
          if (seen.has(canonicalId)) return false;
          seen.add(canonicalId);
          return true;
        });

        return {
          ...v,
          guides: deduped.map((g) => ({
            id: g.id,
            title: g.title,
            createdAt: g.createdAt,
            part: { name: g.part_name },
          })),
          repairJobs: jobs,
        };
      }),
    );

    return json(result);
  }

  return errorResponse("Not Found", 404);
}
