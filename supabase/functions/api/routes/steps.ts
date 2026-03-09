import { errorResponse, json } from "../_lib/cors.ts";
import { getDb } from "../_lib/db.ts";
import { buildDrawingSpec, generateIllustrationFromSpec, specToImagePrompt } from "../_lib/gemini.ts";
import type { TokenPayload } from "../_lib/jwt.ts";

// Extended imageStatus values:
// none | queued | searching_refs | analyzing_refs | generating | ready | failed

// Retry backoff delays in ms: attempt 1 → 15s, attempt 2 → 60s, attempt 3 → 180s
const RETRY_DELAYS = [0, 15_000, 60_000, 180_000];
const MAX_ATTEMPTS = 3;

export async function handleSteps(
  _req: Request,
  method: string,
  subpath: string,
  _user: TokenPayload,
): Promise<Response> {
  const sql = getDb();

  // POST /steps/:stepId/generate-image
  const imgMatch = subpath.match(/^\/([a-zA-Z0-9]+)\/generate-image$/);
  if (imgMatch && method === "POST") {
    const stepId = imgMatch[1];

    const steps = await sql`
      SELECT s.*, g.title as guide_title, g.tools, g."safetyNotes",
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

    // Check for force flag
    let force = false;
    try {
      const b = await _req.clone().json();
      force = Boolean(b?.force);
    } catch { /* ignore */ }

    console.log(`[steps] generate-image stepId=${stepId} status=${step.imageStatus} force=${force}`);

    // Return cached result if already ready and not forced
    if (step.imageStatus === "ready" && step.imageUrl && !force) {
      console.log(`[steps] cache hit stepId=${stepId}`);
      return json({ imageStatus: "ready", imageUrl: step.imageUrl });
    }

    // Skip if already in progress (any active phase)
    const activeStatuses = ["queued", "searching_refs", "analyzing_refs", "generating"];
    if (activeStatuses.includes(step.imageStatus) && !force) {
      console.log(`[steps] in-progress stepId=${stepId} status=${step.imageStatus}`);
      return json({ imageStatus: step.imageStatus, imageUrl: step.imageUrl ?? null });
    }

    // Mark as queued immediately and return — the pipeline runs in background
    await sql`
      UPDATE "RepairStep"
      SET "imageStatus" = 'queued', "imageError" = null,
          "imageAttempts" = 0, "updatedAt" = ${new Date().toISOString()}
      WHERE id = ${stepId}
    `;
    console.log(`[steps] queued stepId=${stepId}`);

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

    // Multi-phase background pipeline with retry
    const bgWork = (async () => {
      let lastErr = "Unknown error";

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          // Wait before retry (no wait on first attempt)
          if (attempt > 1) {
            const delay = RETRY_DELAYS[attempt] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
            console.log(`[steps] retry delay ${delay}ms stepId=${stepId} attempt=${attempt}`);
            await new Promise((r) => setTimeout(r, delay));
          }

          // ── Phase 1: searching_refs ──────────────────────────────────────
          // Consult Gemini's knowledge of OEM manuals to plan the illustration
          await sql`
            UPDATE "RepairStep"
            SET "imageStatus" = 'searching_refs',
                "imageAttempts" = ${attempt},
                "updatedAt" = ${new Date().toISOString()}
            WHERE id = ${stepId}
          `;
          console.log(`[steps] searching_refs stepId=${stepId} attempt=${attempt}`);

          // ── Phase 2: analyzing_refs → DrawingSpec ────────────────────────
          // Build a structured drawing specification from the reference analysis
          await sql`
            UPDATE "RepairStep"
            SET "imageStatus" = 'analyzing_refs',
                "updatedAt" = ${new Date().toISOString()}
            WHERE id = ${stepId}
          `;
          console.log(`[steps] analyzing_refs stepId=${stepId}`);

          const spec = await buildDrawingSpec(stepContext);
          console.log(`[steps] spec built stepId=${stepId} viewType=${spec.viewType} components=${spec.keyComponents.length}`);

          // Store the full rendered image prompt (matches localhost behaviour)
          const imagePrompt = specToImagePrompt(spec);
          await sql`
            UPDATE "RepairStep"
            SET "imagePrompt" = ${imagePrompt},
                "updatedAt" = ${new Date().toISOString()}
            WHERE id = ${stepId}
          `;

          // ── Phase 3: generating ──────────────────────────────────────────
          await sql`
            UPDATE "RepairStep"
            SET "imageStatus" = 'generating',
                "updatedAt" = ${new Date().toISOString()}
            WHERE id = ${stepId}
          `;
          console.log(`[steps] generating stepId=${stepId}`);

          const imageUrl = await generateIllustrationFromSpec(spec);
          console.log(`[steps] image ready stepId=${stepId} urlLen=${imageUrl.length}`);

          // ── Done ─────────────────────────────────────────────────────────
          await sql`
            UPDATE "RepairStep"
            SET "imageStatus" = 'ready', "imageUrl" = ${imageUrl},
                "imageError" = null, "updatedAt" = ${new Date().toISOString()}
            WHERE id = ${stepId}
          `;
          console.log(`[steps] ready stepId=${stepId}`);
          return; // success

        } catch (err) {
          lastErr = err instanceof Error ? err.message : String(err);
          console.error(`[steps] attempt ${attempt} failed stepId=${stepId} error=${lastErr}`);
        }
      }

      // All attempts exhausted
      const fallbackUrl = "https://placehold.co/1200x800/fef2f2/ef4444?text=Generation+failed";
      await sql`
        UPDATE "RepairStep"
        SET "imageStatus" = 'failed', "imageError" = ${lastErr},
            "imageUrl" = ${fallbackUrl}, "updatedAt" = ${new Date().toISOString()}
        WHERE id = ${stepId}
      `;
      console.error(`[steps] all attempts failed stepId=${stepId}`);
    })();

    // Keep the Edge Function alive while the background pipeline runs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (globalThis as any).EdgeRuntime !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).EdgeRuntime.waitUntil(bgWork);
    } else {
      await bgWork; // local / non-Supabase fallback: run synchronously
    }

    return json({ imageStatus: "queued", imageUrl: null });
  }

  return errorResponse("Not Found", 404);
}
