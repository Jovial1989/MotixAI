import { errorResponse, json } from "../_lib/cors.ts";
import { getDb } from "../_lib/db.ts";
import { buildDrawingSpec, generateIllustrationFromSpec, specToImagePrompt } from "../_lib/gemini.ts";
import type { TokenPayload } from "../_lib/jwt.ts";
import { uploadGuideImage } from "../_lib/storage.ts";

const LEGACY_PLACEHOLDER_IMAGE_MARKERS = ["/demo-guides/", "placehold.co", "Fallback%20illustration", "fallback-illustration"];

// buildDrawingSpec has a 10s internal timeout with mock fallback (always succeeds).
// generateIllustrationFromSpec has a 35s internal timeout (throws on failure).
// Both timeouts are inside gemini.ts — steps.ts just awaits the result.

function imageType(url: string | null): "ai" | "fallback" | null {
  if (!url) return null;
  return "ai";
}

function isLegacyPlaceholderImageUrl(url: unknown): boolean {
  if (typeof url !== "string" || !url) return false;
  return LEGACY_PLACEHOLDER_IMAGE_MARKERS.some((marker) => url.includes(marker));
}

export async function handleSteps(
  _req: Request,
  method: string,
  subpath: string,
  _user: TokenPayload,
): Promise<Response> {
  const sql = getDb();

  // POST /steps/:stepId/generate-image
  const imgMatch = subpath.match(/^\/([a-zA-Z0-9_-]+)\/generate-image$/);
  if (imgMatch && method === "POST") {
    const stepId = imgMatch[1];

    const steps = await sql`
      SELECT s.*, g.tools,
             v.model as vehicle_model, p.name as part_name
      FROM "RepairStep" s
      JOIN "RepairGuide" g ON g.id = s."guideId"
      JOIN "Vehicle" v ON v.id = g."vehicleId"
      JOIN "Part" p ON p.id = g."partId"
      WHERE s.id = ${stepId}
      LIMIT 1
    `;
    if (steps.length === 0) return errorResponse("Step not found", 404);

    const step = steps[0];

    let force = false;
    try {
      const b = await _req.clone().json();
      force = Boolean(b?.force);
    } catch { /* ignore */ }

    console.log(`[steps] generate-image stepId=${stepId} status=${step.imageStatus} force=${force}`);

    if (isLegacyPlaceholderImageUrl(step.imageUrl)) {
      await sql`
        UPDATE "RepairStep"
        SET "imageStatus" = 'none', "imageUrl" = null, "updatedAt" = ${new Date().toISOString()}
        WHERE id = ${stepId}
      `;
      step.imageStatus = "none";
      step.imageUrl = null;
    }

    // Cache hit — return immediately
    if (step.imageStatus === "ready" && step.imageUrl && !force && !String(step.imageUrl).startsWith("data:")) {
      console.log(`[steps] cache hit stepId=${stepId}`);
      return json({ imageStatus: "ready", imageUrl: step.imageUrl, type: imageType(step.imageUrl) });
    }

    // Legacy inline image — persist it to storage once, then reuse the public URL forever.
    if (step.imageStatus === "ready" && step.imageUrl && String(step.imageUrl).startsWith("data:") && !force) {
      try {
        const storedUrl = await uploadGuideImage(step.imageUrl, step.guideId, stepId);
        await sql`
          UPDATE "RepairStep"
          SET "imageUrl" = ${storedUrl}, "updatedAt" = ${new Date().toISOString()}
          WHERE id = ${stepId}
        `;
        return json({ imageStatus: "ready", imageUrl: storedUrl, type: "ai" });
      } catch (err) {
        console.error(`[steps] failed to migrate inline image stepId=${stepId}:`, err);
      }
    }

    // Another request is already running — return current in-progress state,
    // UNLESS the status is stale (>5 min since last update), which indicates
    // the old async pipeline timed out without cleaning up.
    const activeStatuses = ["queued", "searching_refs", "analyzing_refs", "generating"];
    if (activeStatuses.includes(step.imageStatus) && !force) {
      const updatedAt = step.updatedAt ? new Date(step.updatedAt).getTime() : 0;
      const staleMs = 5 * 60 * 1000; // 5 minutes
      const isStale = Date.now() - updatedAt > staleMs;
      if (!isStale) {
        console.log(`[steps] in-progress stepId=${stepId} status=${step.imageStatus}`);
        return json({ imageStatus: step.imageStatus, imageUrl: step.imageUrl ?? null, type: null });
      }
      console.log(`[steps] stale active status stepId=${stepId} status=${step.imageStatus} updatedAt=${step.updatedAt} — restarting pipeline`);
      // Fall through to restart the pipeline
    }

    const now = () => new Date().toISOString();

    await sql`
      UPDATE "RepairStep"
      SET "imageStatus" = 'queued', "imageError" = null,
          "updatedAt" = ${now()}
      WHERE id = ${stepId}
    `;

    const stepContext = {
      stepOrder: step.stepOrder,
      title: step.title,
      instruction: step.instruction,
      torqueValue: step.torqueValue ?? null,
      warningNote: step.warningNote ?? null,
      tools: step.tools ?? [],
      vehicleModel: step.vehicle_model,
      partName: step.part_name,
    };

    // ── Synchronous pipeline — runs within the Edge Function lifetime ──────────
    // buildDrawingSpec: 10s timeout internally, falls back to mock spec on failure
    //   → always returns a DrawingSpec (never throws)
    // generateIllustrationFromSpec: 35s timeout internally, throws on failure
    //   → outer catch writes 'failed' + fallback placeholder to DB
    // Total budget: ~45s — within Supabase Edge Function limits.
    // The frontend gets the FINAL state in the response (no polling required).

    try {
      // Phase 1+2: spec (10s timeout inside buildDrawingSpec, mock fallback on timeout)
      await sql`
        UPDATE "RepairStep"
        SET "imageStatus" = 'analyzing_refs', "updatedAt" = ${now()}
        WHERE id = ${stepId}
      `;
      console.log(`[steps] analyzing_refs stepId=${stepId}`);

      const spec = await buildDrawingSpec(stepContext);
      console.log(`[steps] spec ready stepId=${stepId} viewType=${spec.viewType}`);

      const imagePrompt = specToImagePrompt(spec);
      await sql`
        UPDATE "RepairStep"
        SET "imagePrompt" = ${imagePrompt}, "imageStatus" = 'generating',
            "updatedAt" = ${now()}
        WHERE id = ${stepId}
      `;
      console.log(`[steps] generating stepId=${stepId}`);

      // Phase 3: image (35s timeout inside generateIllustrationFromSpec, throws on timeout)
      let imageUrl = await generateIllustrationFromSpec(spec);
      imageUrl = await uploadGuideImage(imageUrl, step.guideId, stepId);
      console.log(`[steps] ready stepId=${stepId} type=ai`);

      await sql`
        UPDATE "RepairStep"
        SET "imageStatus" = 'ready', "imageUrl" = ${imageUrl},
            "imageError" = null, "updatedAt" = ${now()}
        WHERE id = ${stepId}
      `;

      return json({ imageStatus: "ready", imageUrl, type: "ai" });

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[steps] pipeline failed stepId=${stepId} error=${errMsg}`);

      try {
        await sql`
          UPDATE "RepairStep"
          SET "imageStatus" = 'failed', "imageError" = ${errMsg},
              "imageUrl" = null, "updatedAt" = ${now()}
          WHERE id = ${stepId}
        `;
      } catch (dbErr) {
        console.error(`[steps] failed to persist failed status stepId=${stepId}: ${dbErr}`);
      }

      return json({ imageStatus: "failed", imageUrl: null, type: null });
    }
  }

  return errorResponse("Not Found", 404);
}
