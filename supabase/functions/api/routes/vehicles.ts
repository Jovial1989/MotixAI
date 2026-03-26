import { errorResponse, json } from "../_lib/cors.ts";
import { getDb, newId } from "../_lib/db.ts";
import { generateVehicleImage, localizeTextList } from "../_lib/gemini.ts";
import type { TokenPayload } from "../_lib/jwt.ts";
import { uploadVehicleImage } from "../_lib/storage.ts";
import { resolveVehicleIdentity } from "../_lib/vehicle-identity.ts";

function normalizeLanguage(raw: string | null | undefined): string {
  if (!raw) return "en";
  const lc = raw.trim().toLowerCase();
  if (lc === "uk" || lc === "ua") return "uk";
  if (lc === "bg") return "bg";
  return "en";
}

async function persistVehicleCache(
  sql: ReturnType<typeof getDb>,
  vehicleId: string,
  input: {
    model: string;
    manufacturer?: string | null;
    year?: number | null;
    generation?: string | null;
    imageCacheKey: string;
    imageUrl?: string | null;
  },
) {
  const now = new Date().toISOString();

  await sql`
    UPDATE "Vehicle"
    SET
      model = ${input.model},
      manufacturer = ${input.manufacturer ?? null},
      year = ${input.year ?? null},
      generation = ${input.generation ?? null},
      "imageCacheKey" = ${input.imageCacheKey},
      "imageUrl" = COALESCE(${input.imageUrl ?? null}, "imageUrl"),
      "updatedAt" = ${now}
    WHERE id = ${vehicleId}
  `;
}

async function upsertVehicleImageCache(
  sql: ReturnType<typeof getDb>,
  input: {
    cacheKey: string;
    manufacturer?: string | null;
    modelName: string;
    year?: number | null;
    generation?: string | null;
    displayName: string;
    imageUrl: string;
  },
) {
  const now = new Date().toISOString();
  await sql`
    INSERT INTO vehicle_image_cache (
      id,
      cache_key,
      manufacturer,
      model_name,
      year,
      generation,
      display_name,
      image_url,
      created_at,
      updated_at
    ) VALUES (
      ${newId()},
      ${input.cacheKey},
      ${input.manufacturer ?? null},
      ${input.modelName},
      ${input.year ?? null},
      ${input.generation ?? null},
      ${input.displayName},
      ${input.imageUrl},
      ${now},
      ${now}
    )
    ON CONFLICT (cache_key) DO UPDATE SET
      manufacturer = COALESCE(EXCLUDED.manufacturer, vehicle_image_cache.manufacturer),
      model_name = COALESCE(EXCLUDED.model_name, vehicle_image_cache.model_name),
      year = COALESCE(EXCLUDED.year, vehicle_image_cache.year),
      generation = COALESCE(EXCLUDED.generation, vehicle_image_cache.generation),
      display_name = COALESCE(EXCLUDED.display_name, vehicle_image_cache.display_name),
      image_url = EXCLUDED.image_url,
      updated_at = EXCLUDED.updated_at
  `;
}

export async function handleVehicles(
  req: Request,
  method: string,
  subpath: string,
  user: TokenPayload,
): Promise<Response> {
  const sql = getDb();

  const imgMatch = subpath.match(/^\/([a-zA-Z0-9_-]+)\/generate-image$/);
  if (imgMatch && method === "POST") {
    const vehicleId = imgMatch[1];

    const rows = await sql`
      SELECT
        v.id,
        v.model,
        v.manufacturer,
        v.year,
        v.generation,
        v."imageUrl",
        v."imageCacheKey",
        vic.image_url AS cached_image_url
      FROM "Vehicle" v
      LEFT JOIN vehicle_image_cache vic ON vic.cache_key = v."imageCacheKey"
      WHERE v.id = ${vehicleId}
      LIMIT 1
    `;
    if (rows.length === 0) return errorResponse("Vehicle not found", 404);

    const vehicle = rows[0];
    const identity = resolveVehicleIdentity({
      vehicleModel: String(vehicle.model ?? ""),
      manufacturer: typeof vehicle.manufacturer === "string" ? vehicle.manufacturer : null,
      year: typeof vehicle.year === "number" ? vehicle.year : (typeof vehicle.year === "string" ? vehicle.year : null),
      generation: typeof vehicle.generation === "string" ? vehicle.generation : null,
    });

    const existingUrl = typeof vehicle.imageUrl === "string" && vehicle.imageUrl
      ? vehicle.imageUrl
      : typeof vehicle.cached_image_url === "string" && vehicle.cached_image_url
        ? vehicle.cached_image_url
        : null;

    if (existingUrl && !String(existingUrl).startsWith("data:")) {
      await persistVehicleCache(sql, vehicleId, {
        model: identity.displayName,
        manufacturer: identity.manufacturer,
        year: identity.year,
        generation: identity.generation,
        imageCacheKey: identity.cacheKey,
        imageUrl: existingUrl,
      });
      return json({ imageUrl: existingUrl });
    }

    if (existingUrl && String(existingUrl).startsWith("data:")) {
      const storedUrl = await uploadVehicleImage(existingUrl, identity.cacheKey);
      await upsertVehicleImageCache(sql, {
        cacheKey: identity.cacheKey,
        manufacturer: identity.manufacturer,
        modelName: identity.modelName,
        year: identity.year,
        generation: identity.generation,
        displayName: identity.displayName,
        imageUrl: storedUrl,
      });
      await persistVehicleCache(sql, vehicleId, {
        model: identity.displayName,
        manufacturer: identity.manufacturer,
        year: identity.year,
        generation: identity.generation,
        imageCacheKey: identity.cacheKey,
        imageUrl: storedUrl,
      });
      return json({ imageUrl: storedUrl });
    }

    const cacheRows = await sql`
      SELECT image_url
      FROM vehicle_image_cache
      WHERE cache_key = ${identity.cacheKey}
      LIMIT 1
    `;
    const cachedUrl = typeof cacheRows[0]?.image_url === "string" ? String(cacheRows[0].image_url) : null;
    if (cachedUrl) {
      await persistVehicleCache(sql, vehicleId, {
        model: identity.displayName,
        manufacturer: identity.manufacturer,
        year: identity.year,
        generation: identity.generation,
        imageCacheKey: identity.cacheKey,
        imageUrl: cachedUrl,
      });
      return json({ imageUrl: cachedUrl });
    }

    const peerRows = await sql`
      SELECT "imageUrl"
      FROM "Vehicle"
      WHERE id <> ${vehicleId}
        AND "imageUrl" IS NOT NULL
        AND (
          "imageCacheKey" = ${identity.cacheKey}
          OR (
            model = ${identity.displayName}
            AND COALESCE(manufacturer, '') = ${identity.manufacturer ?? ""}
            AND COALESCE(year, 0) = ${identity.year ?? 0}
            AND COALESCE(generation, '') = ${identity.generation ?? ""}
          )
        )
      ORDER BY "updatedAt" DESC
      LIMIT 1
    `;
    const peerUrl = typeof peerRows[0]?.imageUrl === "string" ? String(peerRows[0].imageUrl) : null;
    if (peerUrl) {
      const storedUrl = peerUrl.startsWith("data:")
        ? await uploadVehicleImage(peerUrl, identity.cacheKey)
        : peerUrl;
      await upsertVehicleImageCache(sql, {
        cacheKey: identity.cacheKey,
        manufacturer: identity.manufacturer,
        modelName: identity.modelName,
        year: identity.year,
        generation: identity.generation,
        displayName: identity.displayName,
        imageUrl: storedUrl,
      });
      await persistVehicleCache(sql, vehicleId, {
        model: identity.displayName,
        manufacturer: identity.manufacturer,
        year: identity.year,
        generation: identity.generation,
        imageCacheKey: identity.cacheKey,
        imageUrl: storedUrl,
      });
      return json({ imageUrl: storedUrl });
    }

    try {
      const imageData = await generateVehicleImage(identity);
      const storedUrl = await uploadVehicleImage(imageData, identity.cacheKey);
      await upsertVehicleImageCache(sql, {
        cacheKey: identity.cacheKey,
        manufacturer: identity.manufacturer,
        modelName: identity.modelName,
        year: identity.year,
        generation: identity.generation,
        displayName: identity.displayName,
        imageUrl: storedUrl,
      });
      await persistVehicleCache(sql, vehicleId, {
        model: identity.displayName,
        manufacturer: identity.manufacturer,
        year: identity.year,
        generation: identity.generation,
        imageCacheKey: identity.cacheKey,
        imageUrl: storedUrl,
      });
      return json({ imageUrl: storedUrl });
    } catch (err) {
      console.error("[vehicles] image generation failed:", err instanceof Error ? err.message : err);
      return errorResponse("Image generation failed", 500);
    }
  }

  if (subpath === "" && method === "GET") {
    const url = new URL(req.url);
    const language = normalizeLanguage(url.searchParams.get("language"));

    const guideWhere = user.tenantId
      ? sql`g."tenantId" = ${user.tenantId}`
      : sql`g."userId" = ${user.sub}`;

    const vehicles = await sql`
      SELECT DISTINCT
        v.id,
        v."tenantId",
        v.vin,
        v.model,
        v.manufacturer,
        v.year,
        v.generation,
        COALESCE(v."imageUrl", vic.image_url) AS "imageUrl",
        v."createdAt",
        v."updatedAt"
      FROM "Vehicle" v
      LEFT JOIN vehicle_image_cache vic ON vic.cache_key = v."imageCacheKey"
      JOIN "RepairGuide" g ON g."vehicleId" = v.id
      WHERE ${guideWhere}
        AND (g."language" = ${language} OR g."language" IS NULL OR g."language" = 'en')
      ORDER BY v."createdAt" DESC
    `;

    const result = await Promise.all(
      vehicles.map(async (v) => {
        const identity = resolveVehicleIdentity({
          vehicleModel: typeof v.model === "string" ? v.model : null,
          manufacturer: typeof v.manufacturer === "string" ? v.manufacturer : null,
          year: typeof v.year === "number" ? v.year : (typeof v.year === "string" ? v.year : null),
          generation: typeof v.generation === "string" ? v.generation : null,
        });
        const [guides, jobs] = await Promise.all([
          sql`
            SELECT g.id, g.title, g."createdAt", g."language",
                   COALESCE(g."canonicalGuideId", g.id) as canonical_id,
                   p.name as part_name
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

        const seen = new Set<string>();
        const deduped = guides.filter((g) => {
          const canonicalId = (g.canonical_id as string) || (g.id as string);
          if (seen.has(canonicalId)) return false;
          seen.add(canonicalId);
          return true;
        });

        const localizedGuideCopy = language === "en"
          ? deduped
          : (() => {
              const sourceValues = deduped.flatMap((g) => [
                String(g.title ?? ""),
                String(g.part_name ?? ""),
              ]);
              return localizeTextList(sourceValues, language).then((localizedValues) =>
                deduped.map((g, index) => ({
                  ...g,
                  title: localizedValues[index * 2] ?? g.title,
                  part_name: localizedValues[index * 2 + 1] ?? g.part_name,
                }))
              );
            })();
        const localizedGuides = await localizedGuideCopy;

        return {
          ...v,
          model: identity.displayName,
          manufacturer: identity.manufacturer ?? v.manufacturer ?? null,
          year: identity.year ?? v.year ?? null,
          generation: identity.generation ?? v.generation ?? null,
          guides: localizedGuides.map((g) => ({
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
