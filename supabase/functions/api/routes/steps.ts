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
  const torque = step.torqueValue ? `Torque: ${step.torqueValue}.` : "";
  const warning = step.warningNote ? `Warning: ${step.warningNote}.` : "";
  return `Technical service-manual illustration, white background, clean instructional diagram, engineering style.
No people, no brand logos, no copyrighted marks. Minimal linework, clear arrows and labels.
Show only the relevant component and tool interaction.

Vehicle: ${step.vehicleModel}
Component: ${step.partName}
Step ${step.stepOrder}: ${step.title}
Procedure: ${step.instruction}
Tools required: ${toolsStr || "standard hand tools"}
${torque}
${warning}

Style: technical exploded-view or cross-section diagram, neutral background, labels in English, service manual aesthetic.`;
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

    // Return cached if already ready and not forced
    if (step.imageStatus === "ready" && step.imageUrl && !force) {
      return json({ imageStatus: "ready", imageUrl: step.imageUrl });
    }

    // Skip if in progress
    if ((step.imageStatus === "queued" || step.imageStatus === "generating") && !force) {
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

    const now = new Date().toISOString();

    // Mark as generating and attempt synchronous generation within Edge Function lifetime
    await sql`
      UPDATE "RepairStep"
      SET "imageStatus" = 'generating', "imagePrompt" = ${prompt}, "imageError" = null, "updatedAt" = ${now}
      WHERE id = ${stepId}
    `;

    try {
      const imageUrl = await generateStepImage(prompt);
      await sql`
        UPDATE "RepairStep"
        SET "imageStatus" = 'ready', "imageUrl" = ${imageUrl}, "imageError" = null, "updatedAt" = ${new Date().toISOString()}
        WHERE id = ${stepId}
      `;
      return json({ imageStatus: "ready", imageUrl });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const fallbackUrl =
        "https://placehold.co/1200x800/fef2f2/ef4444?text=Generation+failed";
      await sql`
        UPDATE "RepairStep"
        SET "imageStatus" = 'failed', "imageError" = ${msg}, "imageUrl" = ${fallbackUrl}, "updatedAt" = ${new Date().toISOString()}
        WHERE id = ${stepId}
      `;
      return json({ imageStatus: "failed", imageUrl: fallbackUrl });
    }
  }

  return errorResponse("Not Found", 404);
}
