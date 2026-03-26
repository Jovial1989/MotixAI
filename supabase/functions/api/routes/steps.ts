import { errorResponse, json } from "../_lib/cors.ts";
import { getDb } from "../_lib/db.ts";
import { buildDrawingSpec, generateIllustrationFromSpec, specToImagePrompt } from "../_lib/gemini.ts";
import { getInstructionImageCache, syncRepairStepImage, upsertInstructionImageCache } from "../_lib/image-cache.ts";
import type { TokenPayload } from "../_lib/jwt.ts";
import { uploadGuideImage } from "../_lib/storage.ts";

const LEGACY_PLACEHOLDER_IMAGE_MARKERS = ["/demo-guides/", "placehold.co", "Fallback%20illustration", "fallback-illustration"];
const ACTIVE_IMAGE_STATUSES = ["queued", "searching_refs", "analyzing_refs", "generating"];
const STALE_IMAGE_MS = 5 * 60 * 1000;

function imageType(url: string | null): "ai" | "fallback" | null {
  if (!url) return null;
  return "ai";
}

function isLegacyPlaceholderImageUrl(url: unknown): boolean {
  if (typeof url !== "string" || !url) return false;
  return LEGACY_PLACEHOLDER_IMAGE_MARKERS.some((marker) => url.includes(marker));
}

function cacheUpdatedAt(step: Record<string, unknown>) {
  return new Date(String(step.cached_updated_at ?? step.updatedAt ?? 0)).getTime();
}

export async function handleSteps(
  req: Request,
  method: string,
  subpath: string,
  _user: TokenPayload,
): Promise<Response> {
  const sql = getDb();

  const imgMatch = subpath.match(/^\/([a-zA-Z0-9_-]+)\/generate-image$/);
  if (imgMatch && method === "POST") {
    const stepId = imgMatch[1];

    const steps = await sql`
      SELECT
        s.*,
        g.tools,
        COALESCE(g."canonicalGuideId", g.id) as instruction_id,
        v.model as vehicle_model,
        p.name as part_name,
        ii.image_url as cached_image_url,
        ii.status as cached_status,
        ii.prompt as cached_prompt,
        ii.error as cached_error,
        ii.updated_at as cached_updated_at
      FROM "RepairStep" s
      JOIN "RepairGuide" g ON g.id = s."guideId"
      JOIN "Vehicle" v ON v.id = g."vehicleId"
      JOIN "Part" p ON p.id = g."partId"
      LEFT JOIN instruction_images ii
        ON ii.instruction_id = COALESCE(g."canonicalGuideId", g.id)
       AND ii.step_number = s."stepOrder"
      WHERE s.id = ${stepId}
      LIMIT 1
    `;
    if (steps.length === 0) return errorResponse("Step not found", 404);

    const step = steps[0];
    const instructionId = String(step.instruction_id);

    let force = false;
    try {
      const body = await req.clone().json();
      force = Boolean(body?.force);
    } catch {
      // ignore invalid/empty body
    }

    console.log(`[steps] generate-image stepId=${stepId} status=${step.imageStatus} force=${force}`);

    if (isLegacyPlaceholderImageUrl(step.imageUrl) && !step.cached_image_url) {
      await syncRepairStepImage(sql, stepId, { status: "none", imageUrl: null, prompt: step.imagePrompt as string | null, error: null });
      step.imageStatus = "none";
      step.imageUrl = null;
    }

    if (typeof step.cached_image_url === "string" && step.cached_image_url && !String(step.cached_image_url).startsWith("data:") && !force) {
      await syncRepairStepImage(sql, stepId, {
        status: typeof step.cached_status === "string" ? step.cached_status : "ready",
        imageUrl: step.cached_image_url,
        prompt: typeof step.cached_prompt === "string" ? step.cached_prompt : (step.imagePrompt as string | null),
        error: null,
      });
      return json({
        imageStatus: typeof step.cached_status === "string" ? step.cached_status : "ready",
        imageUrl: step.cached_image_url,
        type: imageType(step.cached_image_url),
      });
    }

    if (step.imageStatus === "ready" && step.imageUrl && !force) {
      let storedUrl = String(step.imageUrl);
      if (storedUrl.startsWith("data:")) {
        storedUrl = await uploadGuideImage(storedUrl, instructionId, `step-${step.stepOrder}`);
      }
      await upsertInstructionImageCache(sql, {
        instructionId,
        stepNumber: Number(step.stepOrder),
        imageUrl: storedUrl,
        status: "ready",
        prompt: typeof step.imagePrompt === "string" ? step.imagePrompt : (typeof step.cached_prompt === "string" ? step.cached_prompt : null),
        error: null,
      });
      await syncRepairStepImage(sql, stepId, {
        status: "ready",
        imageUrl: storedUrl,
        prompt: typeof step.imagePrompt === "string" ? step.imagePrompt : (typeof step.cached_prompt === "string" ? step.cached_prompt : null),
        error: null,
      });
      return json({ imageStatus: "ready", imageUrl: storedUrl, type: "ai" });
    }

    const existingCache = await getInstructionImageCache(sql, instructionId, Number(step.stepOrder));
    const currentStatus = String(existingCache?.status ?? step.cached_status ?? step.imageStatus ?? "none");
    const currentUrl = (existingCache?.image_url as string | null) ?? (typeof step.cached_image_url === "string" ? step.cached_image_url : step.imageUrl ?? null);

    if (ACTIVE_IMAGE_STATUSES.includes(currentStatus) && !force) {
      const updatedAt = existingCache?.updated_at ? new Date(String(existingCache.updated_at)).getTime() : cacheUpdatedAt(step);
      const isStale = Date.now() - updatedAt > STALE_IMAGE_MS;
      if (!isStale) {
        return json({ imageStatus: currentStatus, imageUrl: currentUrl, type: imageType(currentUrl) });
      }
      console.log(`[steps] stale cached status stepId=${stepId} status=${currentStatus} — restarting pipeline`);
    }

    const basePrompt = typeof existingCache?.prompt === "string"
      ? existingCache.prompt
      : typeof step.cached_prompt === "string"
        ? step.cached_prompt
        : typeof step.imagePrompt === "string"
          ? step.imagePrompt
          : null;

    await upsertInstructionImageCache(sql, {
      instructionId,
      stepNumber: Number(step.stepOrder),
      imageUrl: currentUrl,
      status: "queued",
      prompt: basePrompt,
      error: null,
    });
    await syncRepairStepImage(sql, stepId, {
      status: "queued",
      imageUrl: currentUrl,
      prompt: basePrompt,
      error: null,
    });

    const stepContext = {
      stepOrder: Number(step.stepOrder),
      title: String(step.title),
      instruction: String(step.instruction),
      torqueValue: typeof step.torqueValue === "string" ? step.torqueValue : null,
      warningNote: typeof step.warningNote === "string" ? step.warningNote : null,
      tools: Array.isArray(step.tools) ? step.tools as string[] : [],
      vehicleModel: String(step.vehicle_model),
      partName: String(step.part_name),
    };

    try {
      await upsertInstructionImageCache(sql, {
        instructionId,
        stepNumber: Number(step.stepOrder),
        imageUrl: currentUrl,
        status: "analyzing_refs",
        prompt: basePrompt,
        error: null,
      });
      await syncRepairStepImage(sql, stepId, {
        status: "analyzing_refs",
        imageUrl: currentUrl,
        prompt: basePrompt,
        error: null,
      });

      const spec = await buildDrawingSpec(stepContext);
      const imagePrompt = specToImagePrompt(spec);

      await upsertInstructionImageCache(sql, {
        instructionId,
        stepNumber: Number(step.stepOrder),
        imageUrl: currentUrl,
        status: "generating",
        prompt: imagePrompt,
        error: null,
      });
      await syncRepairStepImage(sql, stepId, {
        status: "generating",
        imageUrl: currentUrl,
        prompt: imagePrompt,
        error: null,
      });

      let imageUrl = await generateIllustrationFromSpec(spec);
      imageUrl = await uploadGuideImage(imageUrl, instructionId, `step-${step.stepOrder}`);

      await upsertInstructionImageCache(sql, {
        instructionId,
        stepNumber: Number(step.stepOrder),
        imageUrl,
        status: "ready",
        prompt: imagePrompt,
        error: null,
      });
      await syncRepairStepImage(sql, stepId, {
        status: "ready",
        imageUrl,
        prompt: imagePrompt,
        error: null,
      });

      return json({ imageStatus: "ready", imageUrl, type: "ai" });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[steps] pipeline failed stepId=${stepId} error=${errMsg}`);

      await upsertInstructionImageCache(sql, {
        instructionId,
        stepNumber: Number(step.stepOrder),
        imageUrl: null,
        status: "failed",
        prompt: basePrompt,
        error: errMsg,
      });
      await syncRepairStepImage(sql, stepId, {
        status: "failed",
        imageUrl: null,
        prompt: basePrompt,
        error: errMsg,
      });

      return json({ imageStatus: "failed", imageUrl: null, type: null });
    }
  }

  return errorResponse("Not Found", 404);
}
