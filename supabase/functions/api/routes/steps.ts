import { errorResponse, json } from "../_lib/cors.ts";
import { getDb } from "../_lib/db.ts";
import { generateStepImage } from "../_lib/gemini.ts";
import type { TokenPayload } from "../_lib/jwt.ts";

function buildPrompt(step: {
  stepOrder: number;
  title: string;
  instruction: string;
  torqueValue?: string | null;
  warningNote?: string | null;
  guideTitle: string;
  tools: string[];
  safetyNotes: string[];
  vehicleModel: string;
  partName: string;
}): string {
  const toolsStr = step.tools.join(", ");
  const torqueNote = step.torqueValue ? `Torque specification: ${step.torqueValue}` : "";
  const warningNote = step.warningNote ? `Safety callout: ${step.warningNote}` : "";
  return `Black-and-white technical service manual illustration. White background. OEM workshop manual style.

Subject: ${step.vehicleModel} — ${step.partName}
Action depicted: ${step.title}
Tools shown: ${toolsStr || "standard hand tools"}
${torqueNote}
${warningNote}

Drawing requirements:
- Show the ${step.partName} as a clean engineering line drawing
- Include the relevant tool(s) positioned correctly relative to the component
- Use numbered callout arrows (1, 2, 3) pointing to key parts — numbers only, no words
- Directional arrows where the action involves movement, rotation, or applied force
- Exploded-view or cross-section if needed to show internal parts clearly

STRICT RULES — the finished image MUST NOT contain:
- Sentences, paragraphs, or instruction text of any kind
- Any words other than very short part names (2 words maximum per label)
- Watermarks, photo frames, or decorative borders
- Photorealistic rendering, gradients, or colour fills
- AI generation artefacts or random characters

Reference style: Haynes / Chilton automotive workshop manual line diagram.`;
}

export async function handleSteps(
  req: Request,
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
      const b = await req.clone().json();
      force = Boolean(b?.force);
    } catch { /* ignore */ }

    console.log(`[steps] generate-image stepId=${stepId} currentStatus=${step.imageStatus} force=${force}`);

    // Return cached if already ready and not forced
    if (step.imageStatus === "ready" && step.imageUrl && !force) {
      console.log(`[steps] cache hit stepId=${stepId}`);
      return json({ imageStatus: "ready", imageUrl: step.imageUrl });
    }

    // Skip if in progress
    if ((step.imageStatus === "queued" || step.imageStatus === "generating") && !force) {
      console.log(`[steps] in-progress stepId=${stepId} status=${step.imageStatus}`);
      return json({ imageStatus: step.imageStatus, imageUrl: step.imageUrl ?? null });
    }

    const prompt = buildPrompt({
      stepOrder: step.stepOrder,
      title: step.title,
      instruction: step.instruction,
      torqueValue: step.torqueValue,
      warningNote: step.warningNote,
      guideTitle: step.guide_title,
      tools: step.tools ?? [],
      safetyNotes: step.safetyNotes ?? [],
      vehicleModel: step.vehicle_model,
      partName: step.part_name,
    });

    // Mark as queued immediately and return — generation runs in background.
    await sql`
      UPDATE "RepairStep"
      SET "imageStatus" = 'queued', "imagePrompt" = ${prompt}, "imageError" = null,
          "imageAttempts" = 0, "updatedAt" = ${new Date().toISOString()}
      WHERE id = ${stepId}
    `;
    console.log(`[steps] queued stepId=${stepId}`);

    // Background generation with retry (up to 3 attempts, exponential backoff)
    const MAX_ATTEMPTS = 3;
    const bgWork = (async () => {
      let lastErr = "Unknown error";
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          await sql`
            UPDATE "RepairStep"
            SET "imageStatus" = 'generating',
                "imageAttempts" = ${attempt},
                "updatedAt" = ${new Date().toISOString()}
            WHERE id = ${stepId}
          `;
          console.log(`[steps] generating stepId=${stepId} attempt=${attempt}`);

          const imageUrl = await generateStepImage(prompt);
          console.log(`[steps] image ready stepId=${stepId} urlLen=${imageUrl.length}`);

          await sql`
            UPDATE "RepairStep"
            SET "imageStatus" = 'ready', "imageUrl" = ${imageUrl},
                "imageError" = null, "updatedAt" = ${new Date().toISOString()}
            WHERE id = ${stepId}
          `;
          console.log(`[steps] DB updated ready stepId=${stepId}`);
          return; // success — exit retry loop
        } catch (err) {
          lastErr = err instanceof Error ? err.message : String(err);
          console.error(`[steps] attempt ${attempt} failed stepId=${stepId} error=${lastErr}`);
          if (attempt < MAX_ATTEMPTS) {
            // Exponential backoff: 2s, 4s
            await new Promise((r) => setTimeout(r, 2000 * attempt));
          }
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

    // Keep the Edge Function alive while the background job runs.
    // EdgeRuntime.waitUntil is a Supabase/Deno Deploy API.
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
