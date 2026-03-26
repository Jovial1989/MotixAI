import { CORS_HEADERS, errorResponse, json } from "../_lib/cors.ts";
import { getDb, newId } from "../_lib/db.ts";
import { explainStep, generateRepairGuide, localizeGuide, synthesizeFromSource } from "../_lib/gemini.ts";
import { upsertInstructionImageCache } from "../_lib/image-cache.ts";
import type { TokenPayload } from "../_lib/jwt.ts";
import { seedExampleGuides } from "../_lib/seed-guides.ts";
import { uploadGuideImage } from "../_lib/storage.ts";
import { getSourcePackage } from "../_lib/sources/registry.ts";
import type { TaskType } from "../_lib/sources/types.ts";
import { resolveVehicleIdentity } from "../_lib/vehicle-identity.ts";

async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

/** Canonical demo guide IDs — from petrov.epay@gmail.com, used in guest mode. */
const DEMO_GUIDE_IDS = [
  "cmmd40lbh001n10js9vgydyku", // BMW E90 3-Series Oil Change (Beginner)
  "cmmitf5zp000vhs3mgt9zbi5p", // Nissan Qashqai J10 Front Brake Service (Intermediate)
  "cmmd40wtg002f10jsh3jyvkbu", // Toyota Land Cruiser 200 Turbocharger (Advanced)
];

const SUPPORTED_LANGUAGES = new Set(["en", "uk", "bg"]);
const LEGACY_PLACEHOLDER_IMAGE_MARKERS = ["/demo-guides/", "placehold.co", "Fallback%20illustration", "fallback-illustration"];

function normalizeLanguage(language?: string | null): string {
  if (!language) return "en";
  const normalized = language.toLowerCase() === "ua" ? "uk" : language.toLowerCase();
  return SUPPORTED_LANGUAGES.has(normalized) ? normalized : "en";
}

function requestLanguage(req: Request): string {
  const url = new URL(req.url);
  return normalizeLanguage(url.searchParams.get("language"));
}

function parseOptionalYear(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasExpectedScript(text: string, language: string): boolean {
  if (language === "en") return /[A-Za-z]/.test(text);
  if (language === "uk") return /[А-Яа-яІіЇїЄєҐґ]/.test(text);
  if (language === "bg") return /[А-Яа-я]/.test(text);
  return true;
}

function guideLooksLocalized(
  guide: Record<string, unknown>,
  steps: Array<Record<string, unknown>>,
  language: string,
): boolean {
  if (language === "en") return true;
  const sample = [
    typeof guide.title === "string" ? guide.title : "",
    typeof guide.part_name === "string" ? guide.part_name : "",
    typeof steps[0]?.title === "string" ? String(steps[0].title) : "",
    typeof steps[0]?.instruction === "string" ? String(steps[0].instruction) : "",
  ].join(" ");
  return hasExpectedScript(sample, language);
}

function guideCanonicalId(guide: Record<string, unknown>): string {
  return typeof guide.canonicalGuideId === "string" && guide.canonicalGuideId
    ? guide.canonicalGuideId
    : String(guide.id);
}

function isLegacyPlaceholderImageUrl(url: unknown): boolean {
  if (typeof url !== "string" || !url) return false;
  return LEGACY_PLACEHOLDER_IMAGE_MARKERS.some((marker) => url.includes(marker));
}

function needsDemoContentUpgrade(
  guide: Record<string, unknown>,
  steps: Array<Record<string, unknown>>,
): boolean {
  if (!DEMO_GUIDE_IDS.includes(guideCanonicalId(guide))) return false;
  const sampleSteps = steps
    .slice(0, 3)
    .map((step) => typeof step.instruction === "string" ? step.instruction.trim() : "")
    .filter(Boolean);
  const combinedLength = sampleSteps.join("\n").length;
  return combinedLength < 240 || sampleSteps.some((instruction) => !instruction.includes("\n"));
}

function sanitizeGuideSteps(steps: Array<Record<string, unknown>>) {
  return steps.map((step) => {
    if (!isLegacyPlaceholderImageUrl(step.imageUrl)) return step;
    return {
      ...step,
      imageStatus: "none",
      imageUrl: null,
    };
  });
}

async function persistStepImages(
  sql: ReturnType<typeof getDb>,
  instructionId: string,
  steps: Array<Record<string, unknown>>,
) {
  const now = new Date().toISOString();
  const nextSteps: Array<Record<string, unknown>> = [];

  for (const step of steps) {
    let nextImageUrl = typeof step.imageUrl === "string" ? step.imageUrl : null;
    let nextImageStatus = typeof step.imageStatus === "string" ? step.imageStatus : "none";

    if (nextImageUrl && nextImageUrl.startsWith("data:")) {
      try {
        const storedUrl = await uploadGuideImage(nextImageUrl, instructionId, `step-${step.stepOrder}`);
        await sql`
          UPDATE "RepairStep"
          SET "imageUrl" = ${storedUrl}, "imageStatus" = 'ready', "updatedAt" = ${now}
          WHERE id = ${step.id}
        `;
        nextImageUrl = storedUrl;
        nextImageStatus = "ready";
      } catch (err) {
        console.error(`[guides] failed to persist inline step image stepId=${step.id}:`, err);
      }
    }

    if (
      nextImageUrl ||
      step.imagePrompt ||
      step.imageError ||
      nextImageStatus !== "none"
    ) {
      await upsertInstructionImageCache(sql, {
        instructionId,
        stepNumber: Number(step.stepOrder ?? 0),
        imageUrl: nextImageUrl,
        status: nextImageStatus,
        prompt: typeof step.imagePrompt === "string" ? step.imagePrompt : null,
        error: typeof step.imageError === "string" ? step.imageError : null,
      });
    }

    nextSteps.push({
      ...step,
      imageUrl: nextImageUrl,
      imageStatus: nextImageStatus,
    });
  }

  return nextSteps;
}

function formatGuideResponse(
  guide: Record<string, unknown>,
  steps: Array<Record<string, unknown>>,
  images: Array<Record<string, unknown>> = [],
) {
  const canonicalId = guideCanonicalId(guide);
  const isDemoGuide = DEMO_GUIDE_IDS.includes(canonicalId);
  const response = {
    ...guide,
    canonicalGuideId: canonicalId,
    language: normalizeLanguage(typeof guide.language === "string" ? guide.language : "en"),
    ...(isDemoGuide ? { source: "demo" } : {}),
    vehicle: {
      id: guide.vid,
      model: guide.vehicle_model,
      vin: guide.vehicle_vin,
      manufacturer: guide.vehicle_manufacturer ?? null,
      year: guide.vehicle_year ?? null,
      generation: guide.vehicle_generation ?? null,
      imageUrl: guide.vehicle_image_url ?? null,
    },
    part: {
      id: guide.pid,
      name: guide.part_name,
      oemNumber: guide.part_oem,
    },
    steps: sanitizeGuideSteps(steps),
    images,
  };
  return isDemoGuide ? applyCuratedDemoGuideContent(response) : response;
}

async function fetchGuideRows(sql: ReturnType<typeof getDb>, guideId: string) {
  const guides = await sql`
    SELECT g.*, v.id as vid, v.model as vehicle_model, v.vin as vehicle_vin,
           v.manufacturer as vehicle_manufacturer, v.year as vehicle_year, v.generation as vehicle_generation,
           COALESCE(v."imageUrl", vic.image_url) as vehicle_image_url,
           p.id as pid, p.name as part_name, p."oemNumber" as part_oem
    FROM "RepairGuide" g
    JOIN "Vehicle" v ON v.id = g."vehicleId"
    LEFT JOIN vehicle_image_cache vic ON vic.cache_key = v."imageCacheKey"
    JOIN "Part" p ON p.id = g."partId"
    WHERE g.id = ${guideId}
    LIMIT 1
  `;
  if (guides.length === 0) return null;

  const steps = await sql`
    SELECT s.id, s."guideId", s."stepOrder", s.title, s.instruction,
           s."torqueValue", s."warningNote",
           COALESCE(ii.status, s."imageStatus") as "imageStatus",
           COALESCE(ii.image_url, s."imageUrl") as "imageUrl",
           COALESCE(ii.prompt, s."imagePrompt") as "imagePrompt",
           COALESCE(ii.error, s."imageError") as "imageError",
           s."createdAt"
    FROM "RepairStep" s
    JOIN "RepairGuide" g ON g.id = s."guideId"
    LEFT JOIN instruction_images ii
      ON ii.instruction_id = COALESCE(g."canonicalGuideId", g.id)
     AND ii.step_number = s."stepOrder"
    WHERE s."guideId" = ${guideId}
    ORDER BY s."stepOrder" ASC
  `;
  const images = await sql`
    SELECT gi.id, gi."guideId", gi."stepOrder", gi.prompt,
           COALESCE(ii.status, gi.status) as status,
           COALESCE(ii.image_url, gi."imageUrl") as "imageUrl",
           gi."createdAt"
    FROM "GeneratedImage" gi
    JOIN "RepairGuide" g ON g.id = gi."guideId"
    LEFT JOIN instruction_images ii
      ON ii.instruction_id = COALESCE(g."canonicalGuideId", g.id)
     AND ii.step_number = gi."stepOrder"
    WHERE gi."guideId" = ${guideId}
    ORDER BY gi."stepOrder" ASC
  `;
  const instructionId = guideCanonicalId(guides[0]);
  return { guide: guides[0], steps: await persistStepImages(sql, instructionId, steps), images };
}

async function resolveLocalizedGuide(
  sql: ReturnType<typeof getDb>,
  sourceGuideId: string,
  requestedLanguage: string,
) {
  const current = await fetchGuideRows(sql, sourceGuideId);
  if (!current) return null;

  const currentGuide = current.guide;
  const currentLanguage = normalizeLanguage(typeof currentGuide.language === "string" ? currentGuide.language : "en");
  if (currentLanguage === requestedLanguage) return current;

  const canonicalId = guideCanonicalId(currentGuide);
  const sibling = await sql`
    SELECT id
    FROM "RepairGuide"
    WHERE "canonicalGuideId" = ${canonicalId}
      AND "language" = ${requestedLanguage}
    LIMIT 1
  `;
  if (sibling.length > 0) {
    const siblingGuide = await fetchGuideRows(sql, sibling[0].id);
    if (
      siblingGuide &&
      guideLooksLocalized(siblingGuide.guide, siblingGuide.steps, requestedLanguage) &&
      !needsDemoContentUpgrade(siblingGuide.guide, siblingGuide.steps)
    ) {
      return siblingGuide;
    }
    await sql`DELETE FROM "RepairGuide" WHERE id = ${sibling[0].id}`;
  }

  const localizationSeed = buildLocalizationSeed(currentGuide, current.steps);
  const localized = await localizeGuide(localizationSeed, requestedLanguage);

  if (!localized.steps || localized.steps.length !== current.steps.length) {
    return current;
  }
  if (!guideLooksLocalized(
    { title: localized.title, part_name: localized.partName },
    localized.steps.map((step) => ({ title: step.title, instruction: step.instruction })),
    requestedLanguage,
  )) {
    return current;
  }

  const now = new Date().toISOString();
  const localizedPartId = newId();
  await sql`
    INSERT INTO "Part" (id, "tenantId", name, "oemNumber", "createdAt", "updatedAt")
    VALUES (${localizedPartId}, ${currentGuide.tenantId ?? null}, ${localized.partName}, ${currentGuide.part_oem ?? null}, ${now}, ${now})
  `;

  const localizedGuideId = newId();
  await sql`
    INSERT INTO "RepairGuide" (
      id, "tenantId", "userId", "vehicleId", "partId", title, difficulty,
      "timeEstimate", "safetyNotes", tools, "inputVin", "inputModel", "inputPart",
      "sourceType", "source", "confidence", "sourceProvider", "sourceReferences",
      "taskType", "language", "canonicalGuideId", "createdAt", "updatedAt"
    ) VALUES (
      ${localizedGuideId}, ${currentGuide.tenantId ?? null}, ${currentGuide.userId}, ${currentGuide.vehicleId}, ${localizedPartId},
      ${localized.title}, ${localized.difficulty}, ${localized.timeEstimate},
      ${localized.safetyNotes}, ${localized.tools}, ${currentGuide.inputVin ?? null}, ${currentGuide.inputModel ?? null}, ${localized.partName},
      ${currentGuide.sourceType}, ${currentGuide.source ?? null}, ${currentGuide.confidence ?? null}, ${currentGuide.sourceProvider ?? null},
      ${currentGuide.sourceReferences ?? null}, ${currentGuide.taskType ?? null}, ${requestedLanguage}, ${canonicalId}, ${now}, ${now}
    )
  `;

  for (const [index, step] of localized.steps.entries()) {
    const sourceStep = current.steps[index];
    await sql`
      INSERT INTO "RepairStep" (
        id, "guideId", "stepOrder", title, instruction, "torqueValue", "warningNote",
        "imageStatus", "imageUrl", "imagePrompt", "imageError", "createdAt"
      ) VALUES (
        ${newId()}, ${localizedGuideId}, ${step.order}, ${step.title}, ${step.instruction},
        ${step.torqueValue ?? null}, ${step.warningNote ?? null},
        ${isLegacyPlaceholderImageUrl(sourceStep.imageUrl) ? "none" : (sourceStep.imageStatus ?? "none")},
        ${isLegacyPlaceholderImageUrl(sourceStep.imageUrl) ? null : (sourceStep.imageUrl ?? null)},
        ${sourceStep.imagePrompt ?? null},
        ${sourceStep.imageError ?? null},
        ${now}
      )
    `;
  }

  for (const image of current.images) {
    await sql`
      INSERT INTO "GeneratedImage" (id, "guideId", "stepOrder", prompt, status, "createdAt", "updatedAt")
      VALUES (${newId()}, ${localizedGuideId}, ${image.stepOrder}, ${image.prompt}, ${image.status}, ${image.createdAt ?? now}, ${now})
    `;
  }

  return await fetchGuideRows(sql, localizedGuideId);
}

function pickGuidesForLanguage(
  guides: Array<Record<string, unknown>>,
  requestedLanguage: string,
) {
  const grouped = new Map<string, Array<Record<string, unknown>>>();
  for (const guide of guides) {
    const key = guideCanonicalId(guide);
    const existing = grouped.get(key) ?? [];
    existing.push(guide);
    grouped.set(key, existing);
  }

  return Array.from(grouped.values())
    .map((variants) =>
      variants.find((guide) => normalizeLanguage(typeof guide.language === "string" ? guide.language : "en") === requestedLanguage)
      ?? variants.find((guide) => normalizeLanguage(typeof guide.language === "string" ? guide.language : "en") === "en")
      ?? variants[0])
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function handleGuides(
  req: Request,
  method: string,
  subpath: string,
  user: TokenPayload,
): Promise<Response> {
  const sql = getDb();

  // GET /guides/demo — return 3 canonical demo guides.
  // Fetches from DB so step IDs are real (image generation works).
  // Falls back to static data if DB guides don't exist yet.
  if (subpath === "/demo" && method === "GET") {
    const language = requestLanguage(req);
    try {
      const localizedGuides = await Promise.all(
        DEMO_GUIDE_IDS.map((guideId) => resolveLocalizedGuide(sql, guideId, language)),
      );
      const result = localizedGuides
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        .map(({ guide, steps, images }) => formatGuideResponse(guide, steps, images));
      if (result.length > 0) {
        return json(result);
      }
    } catch (err) {
      console.error("[guides] demo DB fetch failed, using static fallback:", err);
    }
    return json(DEMO_GUIDES_RESPONSE.map((guide) => ({
      ...guide,
      language,
      canonicalGuideId: guide.id,
      steps: guide.steps,
    })));
  }

  // POST /guides/source-backed — source-driven guide creation (Nissan/Toyota seeded)
  if (subpath === "/source-backed" && method === "POST") {
    if (user.role === "GUEST")
      return errorResponse("Create an account to generate guides", 403);

    const b = await body(req);
    const make = typeof b.make === "string" ? b.make.trim() : null;
    const model = typeof b.model === "string" ? b.model.trim() : null;
    const year = typeof b.year === "number" ? b.year : (typeof b.year === "string" ? parseInt(b.year, 10) : null);
    const component = typeof b.component === "string" ? b.component.trim() : null;
    const taskType = typeof b.taskType === "string" ? b.taskType.trim() as TaskType : null;
    const language = normalizeLanguage(typeof b.language === "string" ? b.language : "en");

    if (!make || !model || !year || !component || !taskType) {
      return errorResponse("make, model, year, component, taskType are required", 400);
    }

    console.log(`[guides] source-backed make=${make} model=${model} year=${year} taskType=${taskType}`);

    // Try to retrieve seeded source package
    const sourcePkg = getSourcePackage(make, model, year, taskType);
    console.log(`[guides] source package found=${!!sourcePkg} provider=${sourcePkg?.sourceProvider ?? "none"}`);

    const vehicleIdentity = resolveVehicleIdentity({ make, model, year });
    const normalizedVehicle = vehicleIdentity.displayName;
    const normalizedPart = component;
    const sourceType = user.role === "ENTERPRISE_ADMIN" ? "ENTERPRISE" : "B2C";

    // Synthesize guide — from source if available, else freeform AI
    const generated = sourcePkg
      ? await synthesizeFromSource(sourcePkg, language)
      : await generateRepairGuide(normalizedVehicle, normalizedPart, undefined, language);

    const confidence = sourcePkg ? 95 : 75;
    const sourceTag = sourcePkg ? "source-backed" : "web-fallback";
    const sourceProvider = sourcePkg?.sourceProvider ?? null;
    const sourceReferences = sourcePkg?.sourceReferences ?? null;

    const now = new Date().toISOString();

    // Insert Vehicle
    const vehicleId = newId();
    await sql`
      INSERT INTO "Vehicle" (
        id, "tenantId", vin, model, manufacturer, year, generation, "imageCacheKey", "createdAt", "updatedAt"
      )
      VALUES (
        ${vehicleId}, ${user.tenantId}, ${null}, ${normalizedVehicle}, ${vehicleIdentity.manufacturer},
        ${vehicleIdentity.year}, ${vehicleIdentity.generation}, ${vehicleIdentity.cacheKey}, ${now}, ${now}
      )
    `;

    // Insert Part
    const partId = newId();
    await sql`
      INSERT INTO "Part" (id, "tenantId", name, "oemNumber", "createdAt", "updatedAt")
      VALUES (${partId}, ${user.tenantId}, ${normalizedPart}, ${null}, ${now}, ${now})
    `;

    // Insert RepairGuide with source metadata
    const guideId = newId();
    await sql`
      INSERT INTO "RepairGuide" (
        id, "tenantId", "userId", "vehicleId", "partId", title, difficulty,
        "timeEstimate", "safetyNotes", tools, "inputVin", "inputModel", "inputPart",
        "sourceType", "source", "confidence", "sourceProvider", "sourceReferences",
        "taskType", "language", "canonicalGuideId", "createdAt", "updatedAt"
      ) VALUES (
        ${guideId}, ${user.tenantId}, ${user.sub}, ${vehicleId}, ${partId},
        ${generated.title}, ${generated.difficulty}, ${generated.timeEstimate},
        ${generated.safetyNotes}, ${generated.tools},
        ${null}, ${normalizedVehicle}, ${normalizedPart},
        ${sourceType}, ${sourceTag}, ${confidence},
        ${sourceProvider}, ${sourceReferences ? JSON.stringify(sourceReferences) : null},
        ${taskType}, ${language}, ${guideId}, ${now}, ${now}
      )
    `;

    // Insert RepairSteps
    const stepRows = [];
    for (const step of generated.steps) {
      const stepId = newId();
      await sql`
        INSERT INTO "RepairStep" (
          id, "guideId", "stepOrder", title, instruction, "torqueValue", "warningNote", "imageStatus", "createdAt", "updatedAt"
        )
        VALUES (
          ${stepId}, ${guideId}, ${step.order}, ${step.title}, ${step.instruction}, ${step.torqueValue ?? null},
          ${step.warningNote ?? null}, 'none', ${now}, ${now}
        )
      `;
      await upsertInstructionImageCache(sql, {
        instructionId: guideId,
        stepNumber: step.order,
        status: "none",
        prompt: generated.imagePlan[step.order - 1] ?? null,
      });
      stepRows.push({
        id: stepId, guideId, stepOrder: step.order, title: step.title,
        instruction: step.instruction, torqueValue: step.torqueValue ?? null,
        warningNote: step.warningNote ?? null, imageStatus: "none", imageUrl: null, createdAt: now,
      });
    }

    return json({
      id: guideId, tenantId: user.tenantId, userId: user.sub,
      vehicleId, partId, title: generated.title, difficulty: generated.difficulty,
      timeEstimate: generated.timeEstimate, safetyNotes: generated.safetyNotes,
      tools: generated.tools, inputVin: null, inputModel: normalizedVehicle,
      inputPart: normalizedPart, sourceType, source: sourceTag,
      confidence, sourceProvider, sourceReferences,
      taskType, language, canonicalGuideId: guideId, status: "READY", createdAt: now, updatedAt: now,
      vehicle: {
        id: vehicleId,
        model: normalizedVehicle,
        vin: null,
        manufacturer: vehicleIdentity.manufacturer,
        year: vehicleIdentity.year,
        generation: vehicleIdentity.generation,
        imageUrl: null,
      },
      part: { id: partId, name: normalizedPart, oemNumber: null },
      steps: stepRows,
    }, 201);
  }

  // POST /guides — create guide
  if (subpath === "" && method === "POST") {
    if (user.role === "GUEST")
      return errorResponse("Create an account to generate guides", 403);

    const b = await body(req);
    const vin = typeof b.vin === "string" ? b.vin : undefined;
    const vehicleModel = typeof b.vehicleModel === "string" ? b.vehicleModel : undefined;
    const make = typeof b.make === "string" ? b.make.trim() : undefined;
    const model = typeof b.model === "string" ? b.model.trim() : undefined;
    const manufacturer = typeof b.manufacturer === "string" ? b.manufacturer.trim() : undefined;
    const generation = typeof b.generation === "string" ? b.generation.trim() : undefined;
    const year = parseOptionalYear(b.year);
    const partName = typeof b.partName === "string" ? b.partName : undefined;
    const oemNumber = typeof b.oemNumber === "string" ? b.oemNumber : undefined;
    const language = normalizeLanguage(typeof b.language === "string" ? b.language : "en");

    if (!partName) return errorResponse("partName is required", 400);

    const vehicleIdentity = resolveVehicleIdentity({
      vehicleModel: vehicleModel ?? vin ?? "Unknown vehicle",
      make,
      manufacturer,
      model,
      year,
      generation,
    });
    const normalizedVehicle = vehicleIdentity.displayName;
    const normalizedPart = `${partName}${oemNumber ? ` (${oemNumber})` : ""}`.trim();
    const sourceType = user.role === "ENTERPRISE_ADMIN" ? "ENTERPRISE" : "B2C";

    const generated = await generateRepairGuide(normalizedVehicle, normalizedPart, undefined, language);

    const now = new Date().toISOString();

    // Insert Vehicle
    const vehicleId = newId();
    await sql`
      INSERT INTO "Vehicle" (
        id, "tenantId", vin, model, manufacturer, year, generation, "imageCacheKey", "createdAt", "updatedAt"
      )
      VALUES (
        ${vehicleId}, ${user.tenantId}, ${vin ?? null}, ${normalizedVehicle}, ${vehicleIdentity.manufacturer},
        ${vehicleIdentity.year}, ${vehicleIdentity.generation}, ${vehicleIdentity.cacheKey}, ${now}, ${now}
      )
    `;

    // Insert Part
    const partId = newId();
    await sql`
      INSERT INTO "Part" (id, "tenantId", name, "oemNumber", "createdAt", "updatedAt")
      VALUES (${partId}, ${user.tenantId}, ${partName}, ${oemNumber ?? null}, ${now}, ${now})
    `;

    // Insert RepairGuide
    const guideId = newId();
    await sql`
      INSERT INTO "RepairGuide" (
        id, "tenantId", "userId", "vehicleId", "partId", title, difficulty,
        "timeEstimate", "safetyNotes", tools, "inputVin", "inputModel", "inputPart",
        "sourceType", "language", "canonicalGuideId", "createdAt", "updatedAt"
      ) VALUES (
        ${guideId}, ${user.tenantId}, ${user.sub}, ${vehicleId}, ${partId},
        ${generated.title}, ${generated.difficulty}, ${generated.timeEstimate},
        ${generated.safetyNotes}, ${generated.tools},
        ${vin ?? null}, ${vehicleModel ?? null}, ${normalizedPart},
        ${sourceType}, ${language}, ${guideId}, ${now}, ${now}
      )
    `;

    // Insert RepairSteps
    const stepRows = [];
    for (const step of generated.steps) {
      const stepId = newId();
      await sql`
        INSERT INTO "RepairStep" (
          id, "guideId", "stepOrder", title, instruction, "torqueValue", "warningNote", "imageStatus", "createdAt", "updatedAt"
        )
        VALUES (
          ${stepId}, ${guideId}, ${step.order}, ${step.title}, ${step.instruction}, ${step.torqueValue ?? null},
          ${step.warningNote ?? null}, 'none', ${now}, ${now}
        )
      `;
      stepRows.push({
        id: stepId,
        guideId,
        stepOrder: step.order,
        title: step.title,
        instruction: step.instruction,
        torqueValue: step.torqueValue ?? null,
        warningNote: step.warningNote ?? null,
        imageStatus: "none",
        imageUrl: null,
        createdAt: now,
      });
    }

    // Insert GeneratedImages
    const imageRows = [];
    for (let i = 0; i < generated.imagePlan.length; i++) {
      const imageId = newId();
      const prompt = generated.imagePlan[i];
      await sql`
        INSERT INTO "GeneratedImage" (id, "guideId", "stepOrder", prompt, "createdAt", "updatedAt")
        VALUES (${imageId}, ${guideId}, ${i + 1}, ${prompt}, ${now}, ${now})
      `;
      await upsertInstructionImageCache(sql, {
        instructionId: guideId,
        stepNumber: i + 1,
        status: "none",
        prompt,
      });
      imageRows.push({ id: imageId, guideId, stepOrder: i + 1, prompt, imageUrl: null, status: "PENDING", createdAt: now });
    }

    return json(
      {
        id: guideId,
        tenantId: user.tenantId,
        userId: user.sub,
        vehicleId,
        partId,
        title: generated.title,
        difficulty: generated.difficulty,
        timeEstimate: generated.timeEstimate,
        safetyNotes: generated.safetyNotes,
        tools: generated.tools,
        inputVin: vin ?? null,
        inputModel: vehicleModel ?? null,
        inputPart: normalizedPart,
        language,
        canonicalGuideId: guideId,
        sourceType,
        status: "READY",
        createdAt: now,
        updatedAt: now,
        vehicle: {
          id: vehicleId,
          model: normalizedVehicle,
          vin: vin ?? null,
          manufacturer: vehicleIdentity.manufacturer,
          year: vehicleIdentity.year,
          generation: vehicleIdentity.generation,
          imageUrl: null,
        },
        part: { id: partId, name: partName, oemNumber: oemNumber ?? null },
        steps: stepRows,
        images: imageRows,
      },
      201,
    );
  }

  // GET /guides — history
  if (subpath === "" && method === "GET") {
    const language = requestLanguage(req);
    const where = user.tenantId
      ? sql`("tenantId" = ${user.tenantId} OR "userId" = ${user.sub})`
      : sql`"userId" = ${user.sub}`;

    const guides = await sql`
      SELECT g.*, v.model as vehicle_model, v.vin as vehicle_vin,
             v.manufacturer as vehicle_manufacturer, v.year as vehicle_year, v.generation as vehicle_generation,
             COALESCE(v."imageUrl", vic.image_url) as vehicle_image_url,
             p.name as part_name, p."oemNumber" as part_oem
      FROM "RepairGuide" g
      JOIN "Vehicle" v ON v.id = g."vehicleId"
      LEFT JOIN vehicle_image_cache vic ON vic.cache_key = v."imageCacheKey"
      JOIN "Part" p ON p.id = g."partId"
      WHERE ${where}
      ORDER BY g."createdAt" DESC
    `;

    // Auto-seed example guides for users who have none yet
    if (guides.length === 0 && user.role !== "GUEST") {
      await seedExampleGuides(user.sub, user.tenantId).catch(() => {});
      const seeded = await sql`
        SELECT g.*, v.model as vehicle_model, v.vin as vehicle_vin,
               v.manufacturer as vehicle_manufacturer, v.year as vehicle_year, v.generation as vehicle_generation,
               COALESCE(v."imageUrl", vic.image_url) as vehicle_image_url,
               p.name as part_name, p."oemNumber" as part_oem
        FROM "RepairGuide" g
        JOIN "Vehicle" v ON v.id = g."vehicleId"
        LEFT JOIN vehicle_image_cache vic ON vic.cache_key = v."imageCacheKey"
        JOIN "Part" p ON p.id = g."partId"
        WHERE ${where}
        ORDER BY g."createdAt" DESC
      `;
      // Fetch lightweight step status data for the dashboard status dot
      const seededResult = await Promise.all(seeded.map(async (g) => {
        const stepStatus = await sql`
          SELECT s.id,
                 COALESCE(ii.status, s."imageStatus") as "imageStatus",
                 COALESCE(ii.image_url, s."imageUrl") as "imageUrl"
          FROM "RepairStep" s
          JOIN "RepairGuide" rg ON rg.id = s."guideId"
          LEFT JOIN instruction_images ii
            ON ii.instruction_id = COALESCE(rg."canonicalGuideId", rg.id)
           AND ii.step_number = s."stepOrder"
          WHERE s."guideId" = ${g.id}
          ORDER BY s."stepOrder" ASC
        `;
        return {
          ...g,
          vehicle: {
            id: g.vehicleId,
            model: g.vehicle_model,
            vin: g.vehicle_vin,
            manufacturer: g.vehicle_manufacturer ?? null,
            year: g.vehicle_year ?? null,
            generation: g.vehicle_generation ?? null,
            imageUrl: g.vehicle_image_url ?? null,
          },
          part: { id: g.partId, name: g.part_name, oemNumber: g.part_oem },
          steps: stepStatus,
        };
      }));
      const filteredSeeded = pickGuidesForLanguage(seededResult, language);
      const localizedSeeded = language === "en"
        ? filteredSeeded
        : await Promise.all(filteredSeeded.map(async (guide) => {
          const guideLanguage = normalizeLanguage(typeof guide.language === "string" ? guide.language : "en");
          if (guideLanguage === language) return guide;
          const resolved = await resolveLocalizedGuide(sql, String(guide.id), language);
          if (!resolved) return guide;
          return {
            ...formatGuideResponse(resolved.guide, resolved.steps, resolved.images),
            steps: resolved.steps.map((step) => ({
              id: step.id,
              imageStatus: step.imageStatus,
              imageUrl: step.imageUrl ?? null,
            })),
          };
        }));
      return json(localizedSeeded);
    }

    // Fetch lightweight step status data for each guide (used for dashboard status dot + step count)
    const result = await Promise.all(guides.map(async (g) => {
      const stepStatus = await sql`
        SELECT s.id,
               COALESCE(ii.status, s."imageStatus") as "imageStatus",
               COALESCE(ii.image_url, s."imageUrl") as "imageUrl"
        FROM "RepairStep" s
        JOIN "RepairGuide" rg ON rg.id = s."guideId"
        LEFT JOIN instruction_images ii
          ON ii.instruction_id = COALESCE(rg."canonicalGuideId", rg.id)
         AND ii.step_number = s."stepOrder"
        WHERE s."guideId" = ${g.id}
        ORDER BY s."stepOrder" ASC
      `;
      return {
        ...g,
        vehicle: {
          id: g.vehicleId,
          model: g.vehicle_model,
          vin: g.vehicle_vin,
          manufacturer: g.vehicle_manufacturer ?? null,
          year: g.vehicle_year ?? null,
          generation: g.vehicle_generation ?? null,
          imageUrl: g.vehicle_image_url ?? null,
        },
        part: { id: g.partId, name: g.part_name, oemNumber: g.part_oem },
        steps: stepStatus,
      };
    }));

    const filtered = pickGuidesForLanguage(result, language);
    const localized = language === "en"
      ? filtered
      : await Promise.all(filtered.map(async (guide) => {
        const guideLanguage = normalizeLanguage(typeof guide.language === "string" ? guide.language : "en");
        if (guideLanguage === language) return guide;
        const resolved = await resolveLocalizedGuide(sql, String(guide.id), language);
        if (!resolved) return guide;
        return {
          ...formatGuideResponse(resolved.guide, resolved.steps, resolved.images),
          steps: resolved.steps.map((step) => ({
            id: step.id,
            imageStatus: step.imageStatus,
            imageUrl: step.imageUrl ?? null,
          })),
        };
      }));

    return json(localized);
  }

  // POST /guides/:id/ask — Ask AI about a specific step
  const askMatch = subpath.match(/^\/([a-zA-Z0-9_-]+)\/ask$/);
  if (askMatch && method === "POST") {
    const guideId = askMatch[1];
    const b = await body(req);
    const stepId = typeof b.stepId === "string" ? b.stepId : null;
    const question = typeof b.question === "string" ? b.question : "";
    const language = normalizeLanguage(typeof b.language === "string" ? b.language : "en");

    if (!stepId) return errorResponse("stepId is required", 400);

    // Demo guides: skip ownership check (public demo content)
    const isDemoAsk = DEMO_GUIDE_IDS.includes(guideId);
    const guideWhere = isDemoAsk
      ? sql`g.id = ${guideId}`
      : user.tenantId
        ? sql`g.id = ${guideId} AND (g."tenantId" = ${user.tenantId} OR g."userId" = ${user.sub})`
        : sql`g.id = ${guideId} AND g."userId" = ${user.sub}`;

    const guides = await sql`
      SELECT g.id, v.model as vehicle_model, p.name as part_name
      FROM "RepairGuide" g
      JOIN "Vehicle" v ON v.id = g."vehicleId"
      JOIN "Part" p ON p.id = g."partId"
      WHERE ${guideWhere}
      LIMIT 1
    `;
    if (guides.length === 0) return errorResponse("Guide not found", 404);

    const guide = guides[0];

    const steps = await sql`
      SELECT id, title, instruction
      FROM "RepairStep"
      WHERE id = ${stepId} AND "guideId" = ${guideId}
      LIMIT 1
    `;
    if (steps.length === 0) return errorResponse("Step not found", 404);

    const step = steps[0];
    console.log(`[guides] ask guideId=${guideId} stepId=${stepId} question="${question.slice(0, 80)}"`);

    const answer = await explainStep(
      step.title,
      step.instruction,
      guide.vehicle_model,
      guide.part_name,
      question,
      language,
    );

    return json({ answer });
  }

  // GET /guides/:id — single guide with steps + images
  const idMatch = subpath.match(/^\/([a-zA-Z0-9_-]+)$/);
  if (idMatch && method === "GET") {
    const guideId = idMatch[1];
    const language = requestLanguage(req);

    // Demo guides: fetch from DB (no ownership check — public demo content).
    // This returns real step IDs so the image generation pipeline works.
    const isDemoGuide = DEMO_GUIDE_IDS.includes(guideId);
    if (!isDemoGuide) {
      const where = user.tenantId
        ? sql`id = ${guideId} AND ("tenantId" = ${user.tenantId} OR "userId" = ${user.sub})`
        : sql`id = ${guideId} AND "userId" = ${user.sub}`;
      const existing = await sql`SELECT id FROM "RepairGuide" WHERE ${where} LIMIT 1`;
      if (existing.length === 0) return errorResponse("Guide not found", 404);
    }

    const resolved = await resolveLocalizedGuide(sql, guideId, language);
    if (!resolved) {
      // Fallback to static data if demo guide isn't in DB yet
      if (isDemoGuide) {
        const demoGuide = DEMO_GUIDES_RESPONSE.find((g) => g.id === guideId);
        if (demoGuide) {
          return json({
            ...demoGuide,
            language,
            canonicalGuideId: demoGuide.id,
            steps: demoGuide.steps,
          });
        }
      }
      return errorResponse("Guide not found", 404);
    }
    return json(formatGuideResponse(resolved.guide, resolved.steps, resolved.images));
  }

  // DELETE /guides/:id
  if (idMatch && method === "DELETE") {
    const guideId = idMatch[1];
    const where = user.tenantId
      ? sql`id = ${guideId} AND "tenantId" = ${user.tenantId}`
      : sql`id = ${guideId} AND "userId" = ${user.sub}`;

    const existing = await sql`SELECT id FROM "RepairGuide" WHERE ${where} LIMIT 1`;
    if (existing.length === 0) return errorResponse("Guide not found", 404);

    await sql`DELETE FROM "RepairGuide" WHERE id = ${guideId}`;
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  return errorResponse("Not Found", 404);
}

// Static demo guides response — returned directly, no DB queries needed.
function makeDemoStep(id: string, guideId: string, order: number, title: string, instruction: string, torqueValue?: string, warningNote?: string) {
  return { id, guideId, stepOrder: order, title, instruction, torqueValue: torqueValue ?? null, warningNote: warningNote ?? null, imageStatus: "none" as const, imageUrl: null };
}

const DEMO_GUIDES_RESPONSE = [
  {
    id: DEMO_GUIDE_IDS[0],
    title: "BMW E90 3-Series Oil Change",
    difficulty: "Beginner",
    timeEstimate: "45-60 min",
    tools: ["Oil drain pan", "17mm socket", "Oil filter wrench", "Funnel", "Torque wrench"],
    safetyNotes: ["Allow engine to cool for 15 minutes before starting.", "Never dispose of old oil in the drain — take it to a recycling centre."],
    inputModel: "BMW E90 3-Series", inputPart: "Oil Change", sourceType: "B2C", source: "demo", confidence: 95,
    vehicle: { id: "demo-v1", model: "BMW E90 3-Series", vin: null },
    part: { id: "demo-p1", name: "Oil Change", oemNumber: null },
    steps: [
      makeDemoStep("ds1a", DEMO_GUIDE_IDS[0], 1, "Warm up engine", "1. Idle the engine for 2-3 minutes so the oil thins and drains more completely.\n2. Park on level ground, switch the engine off, and apply the parking brake.\n3. Open the bonnet and remove the oil filler cap slightly to help the sump vent while draining."),
      makeDemoStep("ds1b", DEMO_GUIDE_IDS[0], 2, "Lift and secure vehicle", "1. Chock the rear wheels before lifting the front of the vehicle.\n2. Raise the front using the approved jacking point and position axle stands under the front support locations.\n3. Lower the vehicle gently onto the stands and shake the body lightly to confirm it is stable before going underneath.", undefined, "Ensure axle stands are on solid ground and rated for the vehicle weight."),
      makeDemoStep("ds1c", DEMO_GUIDE_IDS[0], 3, "Remove drain plug", "1. Position the drain pan directly below the sump plug and keep absorbent rags nearby.\n2. Crack the drain plug loose with a 17 mm socket, then finish removing it by hand to avoid dropping it into the pan.\n3. Let the oil drain until it reduces to a slow drip, then inspect the plug and sealing surface for damage.", "25 Nm on reinstall"),
      makeDemoStep("ds1d", DEMO_GUIDE_IDS[0], 4, "Remove oil filter", "1. Move to the top of the engine and place rags around the filter housing to catch any spill.\n2. Use the oil filter wrench to loosen the housing cap, then lift out the old filter element and old O-ring.\n3. Wipe the housing clean so the new seal seats on a clean surface without twisting."),
      makeDemoStep("ds1e", DEMO_GUIDE_IDS[0], 5, "Install new filter", "1. Lightly coat the new O-ring with fresh engine oil before fitting it to the housing groove.\n2. Push the new filter element fully into the cap until it seats squarely.\n3. Thread the housing in by hand first to avoid cross-threading, then tighten evenly to specification.", "18 Nm"),
      makeDemoStep("ds1f", DEMO_GUIDE_IDS[0], 6, "Reinstall drain plug", "1. Clean the drain plug threads and fit a new sealing washer.\n2. Reinstall the plug by hand until it seats against the sump to avoid thread damage.\n3. Torque the plug correctly and wipe the area clean so any later leak is easy to spot.", "25 Nm"),
      makeDemoStep("ds1g", DEMO_GUIDE_IDS[0], 7, "Add new oil", "1. Place a clean funnel in the filler neck and add oil in controlled stages rather than all at once.\n2. Pour in approximately 5.0 litres first, pause, then add the remaining amount gradually toward the target fill.\n3. Refit the filler cap securely and wipe any spilled oil from the cover and surrounding trim."),
      makeDemoStep("ds1h", DEMO_GUIDE_IDS[0], 8, "Check level and leaks", "1. Start the engine and let it idle for about 60 seconds while you inspect the drain plug and filter housing.\n2. Switch off, wait two minutes for the oil to settle, then check the dipstick level on level ground.\n3. Top up if needed so the oil sits between MIN and MAX, then confirm there are no active leaks before closing the bonnet."),
    ],
    createdAt: "2026-03-01T10:00:00.000Z", updatedAt: "2026-03-01T10:00:00.000Z",
  },
  {
    id: DEMO_GUIDE_IDS[1],
    title: "Nissan Qashqai J10 Front Brake Pad Replacement",
    difficulty: "Intermediate",
    timeEstimate: "1.5 - 2 hours",
    tools: ["Socket set", "C-clamp or brake piston tool", "Wire brush", "Brake cleaner", "Torque wrench", "Flat screwdriver"],
    safetyNotes: ["Never compress the brake pedal while a caliper is removed.", "Wear gloves — brake dust is hazardous.", "Pump the brake pedal 10–15 times before moving the vehicle after reassembly."],
    inputModel: "Nissan Qashqai J10", inputPart: "Brake Pads", sourceType: "B2C", source: "demo", confidence: 95,
    vehicle: { id: "demo-v2", model: "Nissan Qashqai J10", vin: null },
    part: { id: "demo-p2", name: "Brake Pads", oemNumber: null },
    steps: [
      makeDemoStep("ds2a", DEMO_GUIDE_IDS[1], 1, "Loosen wheel nuts", "1. Before lifting the vehicle, crack each front wheel nut loose by roughly half a turn.\n2. Work in a star pattern so the wheel tension is released evenly.\n3. Leave the nuts threaded on by a few turns so the wheel stays seated until the vehicle is raised."),
      makeDemoStep("ds2b", DEMO_GUIDE_IDS[1], 2, "Raise and support vehicle", "1. Lift the front of the vehicle using the approved front jacking point.\n2. Place axle stands under the reinforced support locations on both sides and lower the vehicle onto them.\n3. Remove both front wheels and store the nuts where they stay clean for refitting.", undefined, "Use proper axle stand positions as per the vehicle manual."),
      makeDemoStep("ds2c", DEMO_GUIDE_IDS[1], 3, "Inspect existing pads", "1. Check pad friction material thickness on both inner and outer pads before removal.\n2. Inspect the disc surface for heavy scoring, lips, or blue heat marks that may require additional service.\n3. Confirm the wear pattern is even; uneven wear can indicate seized slide pins or piston issues."),
      makeDemoStep("ds2d", DEMO_GUIDE_IDS[1], 4, "Remove caliper guide bolts", "1. Locate the upper and lower guide bolts on the rear of the caliper body.\n2. Remove both bolts with a 12 mm socket while supporting the caliper with your free hand.\n3. Slide the caliper away from the disc and suspend it with a hook or wire instead of letting it hang on the hose.", undefined, "Do not let the caliper hang by the brake hose — support it with a hook or wire."),
      makeDemoStep("ds2e", DEMO_GUIDE_IDS[1], 5, "Remove old brake pads", "1. Withdraw the outer and inner pads from the caliper bracket, noting the location of any shims or clips.\n2. Compare the old pads side by side to check for uneven wear.\n3. Keep the old pad set nearby in case one is needed as a buffer while compressing the piston."),
      makeDemoStep("ds2f", DEMO_GUIDE_IDS[1], 6, "Clean bracket and hardware", "1. Clean the pad abutment points and hardware seats using brake cleaner and a wire brush.\n2. Remove rust build-up so the new pads can slide freely without binding.\n3. Lightly lubricate the slide pin contact areas with brake-safe grease, keeping lubricant off pad friction surfaces."),
      makeDemoStep("ds2g", DEMO_GUIDE_IDS[1], 7, "Compress caliper piston", "1. Position an old pad against the piston face to spread the load evenly.\n2. Wind the piston back slowly with a C-clamp or piston tool until it sits fully home in the bore.\n3. Watch the brake fluid reservoir while compressing and remove excess fluid if the level rises too high."),
      makeDemoStep("ds2h", DEMO_GUIDE_IDS[1], 8, "Install new pads", "1. Fit the new pad hardware and anti-squeal shims exactly as supplied with the pad kit.\n2. Seat the inner pad against the piston and place the outer pad squarely in the bracket.\n3. Confirm both pads move freely by hand before the caliper is refitted."),
      makeDemoStep("ds2i", DEMO_GUIDE_IDS[1], 9, "Refit caliper", "1. Swing the caliper back over the new pads without disturbing their position.\n2. Start the guide bolts by hand first, then tighten them evenly.\n3. Torque the guide bolts to specification and confirm the caliper slides freely on its pins.", "34 Nm"),
      makeDemoStep("ds2j", DEMO_GUIDE_IDS[1], 10, "Refit wheels and bed in pads", "1. Refit both wheels and tighten the wheel nuts finger-tight before lowering the vehicle.\n2. Lower the vehicle, torque the wheel nuts, and pump the brake pedal until a firm pedal returns.\n3. Carry out a controlled bedding-in cycle with several moderate stops so the new pads mate evenly to the discs.", "Wheel nuts: 100 Nm"),
    ],
    createdAt: "2026-03-01T11:00:00.000Z", updatedAt: "2026-03-01T11:00:00.000Z",
  },
  {
    id: DEMO_GUIDE_IDS[2],
    title: "Toyota Land Cruiser 200 Series (1VD-FTV) Turbocharger Replacement Guide",
    difficulty: "Advanced",
    timeEstimate: "8 - 12 hours",
    tools: ["Socket set (metric)", "Torque wrench", "Extension bars", "Oil line disconnect tool", "Gasket scraper", "Threadlocker", "Vacuum pump"],
    safetyNotes: ["Allow turbo and exhaust manifold to cool completely — surfaces reach over 900°C in operation.", "Relieve fuel system pressure before disconnecting any fuel lines.", "Use new gaskets, seals, and oil feed/return lines — reusing old ones risks oil leaks and premature turbo failure."],
    inputModel: "Toyota Land Cruiser 200", inputPart: "Turbocharger", sourceType: "B2C", source: "demo", confidence: 95,
    vehicle: { id: "demo-v3", model: "Toyota Land Cruiser 200", vin: null },
    part: { id: "demo-p3", name: "Turbocharger", oemNumber: null },
    steps: [
      makeDemoStep("ds3a", DEMO_GUIDE_IDS[2], 1, "Prepare and depressurise", "1. Disconnect the negative battery terminal and allow the engine bay to cool fully before touching the turbo assembly.\n2. Drain engine oil and coolant into clean containers if they are to be reused.\n3. Label nearby hoses and connectors now, because access becomes more restricted once intake and heat shielding are removed."),
      makeDemoStep("ds3b", DEMO_GUIDE_IDS[2], 2, "Remove engine cover and air intake", "1. Remove the engine cover and any intake ducting blocking access to the turbocharger.\n2. Loosen the turbo inlet and intercooler clamps, then pull the pipework clear without damaging rubber couplers.\n3. Inspect all intake hoses as they come off so split boots can be replaced during reassembly."),
      makeDemoStep("ds3c", DEMO_GUIDE_IDS[2], 3, "Disconnect oil feed line", "1. Clean around the oil feed fitting before loosening it so no debris enters the new turbo.\n2. Remove the banjo bolt and sealing washers, keeping note of the fitting orientation.\n3. Cap or wrap the open feed line immediately to prevent contamination while the turbo is out."),
      makeDemoStep("ds3d", DEMO_GUIDE_IDS[2], 4, "Disconnect oil return line", "1. Place absorbent material beneath the turbocharger because the return line will spill residual oil.\n2. Remove the flange fasteners at the turbo base and ease the drain tube away carefully.\n3. Inspect the return hose or pipe for coking, restriction, or hardening before reuse."),
      makeDemoStep("ds3e", DEMO_GUIDE_IDS[2], 5, "Disconnect coolant lines (water-cooled turbo)", "1. Clamp the coolant hoses if required to limit fluid loss once they are disconnected.\n2. Release both feed and return lines from the turbo centre housing and catch any remaining coolant.\n3. Plug the open line ends so dirt does not enter the cooling circuit during the repair.", undefined, "Have rags ready — residual coolant will spill."),
      makeDemoStep("ds3f", DEMO_GUIDE_IDS[2], 6, "Disconnect exhaust downpipe", "1. Support the downpipe before loosening the fasteners so its weight does not twist the turbo outlet studs.\n2. Remove the outlet flange nuts evenly and separate the downpipe from the turbo.\n3. Inspect the flange faces and studs now, replacing any heat-damaged hardware before final assembly."),
      makeDemoStep("ds3g", DEMO_GUIDE_IDS[2], 7, "Remove turbo-to-manifold mounting nuts", "1. Soak the manifold nuts with penetrating oil and let it work before applying force.\n2. Loosen each nut progressively to reduce the risk of snapping a stud in the manifold.\n3. Once all hardware is free, support the turbo body because the unit will shift as the final nut is removed.", "Penetrating oil soak required"),
      makeDemoStep("ds3h", DEMO_GUIDE_IDS[2], 8, "Extract turbocharger", "1. Lift the turbocharger clear while checking that no hose, bracket, or heat shield is still attached.\n2. Keep the compressor and turbine housings away from surrounding wiring and hard lines during removal.\n3. Set the removed unit on a bench for inspection so you can compare housings, ports, and actuator layout with the replacement."),
      makeDemoStep("ds3i", DEMO_GUIDE_IDS[2], 9, "Clean all mating surfaces", "1. Remove every trace of the old gasket from the manifold, oil return, and downpipe flange surfaces.\n2. Clean carbon deposits from the flange faces without gouging the mating surfaces.\n3. Blow out or wipe away any debris so nothing enters the oil passages or the new turbocharger on installation."),
      makeDemoStep("ds3j", DEMO_GUIDE_IDS[2], 10, "Pre-lubricate new turbo", "1. Pour clean engine oil into the turbo oil inlet port before the unit is fitted.\n2. Rotate the turbine shaft by hand several turns to distribute the oil through the bearings.\n3. Keep the inlet protected until final installation so the pre-lubricated assembly stays clean.", undefined, "Never start the engine immediately after turbo installation without pre-lubricating."),
      makeDemoStep("ds3k", DEMO_GUIDE_IDS[2], 11, "Install new turbocharger", "1. Position the new turbo with a fresh manifold gasket and start all mounting nuts by hand.\n2. Align the housing so the oil drain points correctly downward without stressing attached lines.\n3. Tighten the mounting hardware evenly in a cross pattern to pull the flange down squarely.", "43 Nm"),
      makeDemoStep("ds3l", DEMO_GUIDE_IDS[2], 12, "Reconnect all lines and pipes", "1. Refit the oil feed with new sealing washers and the return line with a new gasket.\n2. Reconnect coolant lines, the downpipe, intake piping, and intercooler hoses in the reverse order of removal.\n3. Tighten every connection to specification and check that hoses are fully seated with no twist or preload.", "Oil feed banjo bolt: 32 Nm | Downpipe: 43 Nm"),
      makeDemoStep("ds3m", DEMO_GUIDE_IDS[2], 13, "Refill fluids and verify", "1. Refill engine oil and coolant to the correct capacities before attempting to start the engine.\n2. Prime oil pressure by cranking the engine without starting, then start and let it idle while monitoring the turbo area.\n3. Check carefully for oil, coolant, intake, or exhaust leaks and confirm boost hoses remain seated after the first warm idle."),
    ],
    createdAt: "2026-03-01T12:00:00.000Z", updatedAt: "2026-03-01T12:00:00.000Z",
  },
];

function applyCuratedDemoGuideContent(response: Record<string, unknown>) {
  const language = normalizeLanguage(typeof response.language === "string" ? response.language : "en");
  if (language !== "en") return response;

  const canonicalId = guideCanonicalId(response);
  const curated = DEMO_GUIDES_RESPONSE.find((guide) => guide.id === canonicalId);
  if (!curated) return response;

  const responseSteps = Array.isArray(response.steps) ? response.steps as Array<Record<string, unknown>> : [];
  return {
    ...response,
    title: curated.title,
    difficulty: curated.difficulty,
    timeEstimate: curated.timeEstimate,
    tools: curated.tools,
    safetyNotes: curated.safetyNotes,
    inputModel: curated.inputModel,
    inputPart: curated.inputPart,
    confidence: curated.confidence,
    steps: responseSteps.map((step, index) => {
      const curatedStep = curated.steps[index];
      if (!curatedStep) return step;
      return {
        ...step,
        title: curatedStep.title,
        instruction: curatedStep.instruction,
        torqueValue: curatedStep.torqueValue,
        warningNote: curatedStep.warningNote,
      };
    }),
  };
}

function buildLocalizationSeed(
  guide: Record<string, unknown>,
  steps: Array<Record<string, unknown>>,
) {
  const canonicalId = guideCanonicalId(guide);
  const curated = DEMO_GUIDES_RESPONSE.find((entry) => entry.id === canonicalId);
  if (!curated) {
    return {
      title: String(guide.title),
      difficulty: String(guide.difficulty),
      timeEstimate: String(guide.timeEstimate ?? ""),
      tools: Array.isArray(guide.tools) ? guide.tools : [],
      safetyNotes: Array.isArray(guide.safetyNotes) ? guide.safetyNotes : [],
      partName: String(guide.part_name ?? ""),
      steps: steps.map((step) => ({
        order: Number(step.stepOrder),
        title: String(step.title),
        instruction: String(step.instruction),
        torqueValue: typeof step.torqueValue === "string" ? step.torqueValue : null,
        warningNote: typeof step.warningNote === "string" ? step.warningNote : null,
      })),
    };
  }

  return {
    title: curated.title,
    difficulty: curated.difficulty,
    timeEstimate: curated.timeEstimate,
    tools: curated.tools,
    safetyNotes: curated.safetyNotes,
    partName: curated.part.name,
    steps: curated.steps.map((step) => ({
      order: step.stepOrder,
      title: step.title,
      instruction: step.instruction,
      torqueValue: step.torqueValue,
      warningNote: step.warningNote,
    })),
  };
}
