import { CORS_HEADERS, errorResponse, json } from "../_lib/cors.ts";
import { getDb, newId } from "../_lib/db.ts";
import { explainStep, generateRepairGuide, localizeGuide, synthesizeFromSource } from "../_lib/gemini.ts";
import type { TokenPayload } from "../_lib/jwt.ts";
import { seedExampleGuides } from "../_lib/seed-guides.ts";
import { getSourcePackage } from "../_lib/sources/registry.ts";
import type { TaskType } from "../_lib/sources/types.ts";

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

const DEMO_IMAGE_PATHS: Record<string, string> = {
  [DEMO_GUIDE_IDS[0]]: "/demo-guides/bmw-e90-oil-change.svg",
  [DEMO_GUIDE_IDS[1]]: "/demo-guides/nissan-qashqai-brake-pads.svg",
  [DEMO_GUIDE_IDS[2]]: "/demo-guides/toyota-land-cruiser-turbo.svg",
};

function normalizeLanguage(language?: string | null): string {
  if (!language) return "en";
  const normalized = language.toLowerCase() === "ua" ? "uk" : language.toLowerCase();
  return SUPPORTED_LANGUAGES.has(normalized) ? normalized : "en";
}

function requestLanguage(req: Request): string {
  const url = new URL(req.url);
  return normalizeLanguage(url.searchParams.get("language"));
}

function guideCanonicalId(guide: Record<string, unknown>): string {
  return typeof guide.canonicalGuideId === "string" && guide.canonicalGuideId
    ? guide.canonicalGuideId
    : String(guide.id);
}

function hydrateDemoSteps(guideId: string, steps: Array<Record<string, unknown>>) {
  const imageUrl = DEMO_IMAGE_PATHS[guideId];
  return steps.map((step) => ({
    ...step,
    imageStatus: imageUrl ? "ready" : (step.imageStatus ?? "none"),
    imageUrl: imageUrl ?? step.imageUrl ?? null,
  }));
}

function formatGuideResponse(
  guide: Record<string, unknown>,
  steps: Array<Record<string, unknown>>,
  images: Array<Record<string, unknown>> = [],
) {
  const canonicalId = guideCanonicalId(guide);
  const isDemoGuide = DEMO_GUIDE_IDS.includes(canonicalId);
  return {
    ...guide,
    canonicalGuideId: canonicalId,
    language: normalizeLanguage(typeof guide.language === "string" ? guide.language : "en"),
    ...(isDemoGuide ? { source: "demo" } : {}),
    vehicle: {
      id: guide.vid,
      model: guide.vehicle_model,
      vin: guide.vehicle_vin,
    },
    part: {
      id: guide.pid,
      name: guide.part_name,
      oemNumber: guide.part_oem,
    },
    steps: isDemoGuide ? hydrateDemoSteps(canonicalId, steps) : steps,
    images,
  };
}

async function fetchGuideRows(sql: ReturnType<typeof getDb>, guideId: string) {
  const guides = await sql`
    SELECT g.*, v.id as vid, v.model as vehicle_model, v.vin as vehicle_vin,
           p.id as pid, p.name as part_name, p."oemNumber" as part_oem
    FROM "RepairGuide" g
    JOIN "Vehicle" v ON v.id = g."vehicleId"
    JOIN "Part" p ON p.id = g."partId"
    WHERE g.id = ${guideId}
    LIMIT 1
  `;
  if (guides.length === 0) return null;

  const steps = await sql`
    SELECT id, "guideId", "stepOrder", title, instruction,
           "torqueValue", "warningNote", "imageStatus", "imageUrl", "imagePrompt", "imageError", "createdAt"
    FROM "RepairStep"
    WHERE "guideId" = ${guideId}
    ORDER BY "stepOrder" ASC
  `;
  const images = await sql`
    SELECT id, "guideId", "stepOrder", prompt, status, "createdAt"
    FROM "GeneratedImage"
    WHERE "guideId" = ${guideId}
    ORDER BY "stepOrder" ASC
  `;
  return { guide: guides[0], steps, images };
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
    return await fetchGuideRows(sql, sibling[0].id);
  }

  const localized = await localizeGuide({
    title: String(currentGuide.title),
    difficulty: String(currentGuide.difficulty),
    timeEstimate: String(currentGuide.timeEstimate ?? ""),
    tools: Array.isArray(currentGuide.tools) ? currentGuide.tools : [],
    safetyNotes: Array.isArray(currentGuide.safetyNotes) ? currentGuide.safetyNotes : [],
    partName: String(currentGuide.part_name ?? ""),
    steps: current.steps.map((step) => ({
      order: Number(step.stepOrder),
      title: String(step.title),
      instruction: String(step.instruction),
      torqueValue: typeof step.torqueValue === "string" ? step.torqueValue : null,
      warningNote: typeof step.warningNote === "string" ? step.warningNote : null,
    })),
  }, requestedLanguage);

  if (!localized.steps || localized.steps.length !== current.steps.length) {
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
    const demoImageUrl = DEMO_IMAGE_PATHS[canonicalId] ?? null;
    await sql`
      INSERT INTO "RepairStep" (
        id, "guideId", "stepOrder", title, instruction, "torqueValue", "warningNote",
        "imageStatus", "imageUrl", "imagePrompt", "imageError", "createdAt"
      ) VALUES (
        ${newId()}, ${localizedGuideId}, ${step.order}, ${step.title}, ${step.instruction},
        ${step.torqueValue ?? null}, ${step.warningNote ?? null},
        ${demoImageUrl ? "ready" : (sourceStep.imageStatus ?? "none")},
        ${demoImageUrl ?? sourceStep.imageUrl ?? null},
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
      steps: hydrateDemoSteps(guide.id, guide.steps),
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

    const normalizedVehicle = `${year} ${make} ${model}`;
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
      INSERT INTO "Vehicle" (id, "tenantId", vin, model, "createdAt", "updatedAt")
      VALUES (${vehicleId}, ${user.tenantId}, ${null}, ${normalizedVehicle}, ${now}, ${now})
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
        INSERT INTO "RepairStep" (id, "guideId", "stepOrder", title, instruction, "torqueValue", "warningNote", "createdAt")
        VALUES (${stepId}, ${guideId}, ${step.order}, ${step.title}, ${step.instruction}, ${step.torqueValue ?? null}, ${step.warningNote ?? null}, ${now})
      `;
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
      vehicle: { id: vehicleId, model: normalizedVehicle, vin: null },
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
    const partName = typeof b.partName === "string" ? b.partName : undefined;
    const oemNumber = typeof b.oemNumber === "string" ? b.oemNumber : undefined;
    const language = normalizeLanguage(typeof b.language === "string" ? b.language : "en");

    if (!partName) return errorResponse("partName is required", 400);

    const normalizedVehicle = (vehicleModel || vin || "Unknown vehicle").trim();
    const normalizedPart = `${partName}${oemNumber ? ` (${oemNumber})` : ""}`.trim();
    const sourceType = user.role === "ENTERPRISE_ADMIN" ? "ENTERPRISE" : "B2C";

    const generated = await generateRepairGuide(normalizedVehicle, normalizedPart, undefined, language);

    const now = new Date().toISOString();

    // Insert Vehicle
    const vehicleId = newId();
    await sql`
      INSERT INTO "Vehicle" (id, "tenantId", vin, model, "createdAt", "updatedAt")
      VALUES (${vehicleId}, ${user.tenantId}, ${vin ?? null}, ${normalizedVehicle}, ${now}, ${now})
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
        INSERT INTO "RepairStep" (id, "guideId", "stepOrder", title, instruction, "torqueValue", "warningNote", "createdAt")
        VALUES (${stepId}, ${guideId}, ${step.order}, ${step.title}, ${step.instruction}, ${step.torqueValue ?? null}, ${step.warningNote ?? null}, ${now})
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
        vehicle: { id: vehicleId, model: normalizedVehicle, vin: vin ?? null },
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
             p.name as part_name, p."oemNumber" as part_oem
      FROM "RepairGuide" g
      JOIN "Vehicle" v ON v.id = g."vehicleId"
      JOIN "Part" p ON p.id = g."partId"
      WHERE ${where}
      ORDER BY g."createdAt" DESC
    `;

    // Auto-seed example guides for users who have none yet
    if (guides.length === 0 && user.role !== "GUEST") {
      await seedExampleGuides(user.sub, user.tenantId).catch(() => {});
      const seeded = await sql`
        SELECT g.*, v.model as vehicle_model, v.vin as vehicle_vin,
               p.name as part_name, p."oemNumber" as part_oem
        FROM "RepairGuide" g
        JOIN "Vehicle" v ON v.id = g."vehicleId"
        JOIN "Part" p ON p.id = g."partId"
        WHERE ${where}
        ORDER BY g."createdAt" DESC
      `;
      // Fetch lightweight step status data for the dashboard status dot
      const seededResult = await Promise.all(seeded.map(async (g) => {
        const stepStatus = await sql`
          SELECT id, "imageStatus", "imageUrl" FROM "RepairStep"
          WHERE "guideId" = ${g.id} ORDER BY "stepOrder" ASC
        `;
        return {
          ...g,
          vehicle: { id: g.vehicleId, model: g.vehicle_model, vin: g.vehicle_vin },
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
        SELECT id, "imageStatus", "imageUrl" FROM "RepairStep"
        WHERE "guideId" = ${g.id} ORDER BY "stepOrder" ASC
      `;
      return {
        ...g,
        vehicle: { id: g.vehicleId, model: g.vehicle_model, vin: g.vehicle_vin },
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
            steps: hydrateDemoSteps(demoGuide.id, demoGuide.steps),
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
      makeDemoStep("ds1a", DEMO_GUIDE_IDS[0], 1, "Warm up engine", "Run the engine for 2–3 minutes to warm the oil so it drains completely, then switch off."),
      makeDemoStep("ds1b", DEMO_GUIDE_IDS[0], 2, "Lift and secure vehicle", "Jack up the car and support it on axle stands. Never work under a car supported only by a jack.", undefined, "Ensure axle stands are on solid ground and rated for the vehicle weight."),
      makeDemoStep("ds1c", DEMO_GUIDE_IDS[0], 3, "Remove drain plug", "Place the drain pan under the sump. Using a 17mm socket, remove the drain plug and allow oil to drain fully.", "25 Nm on reinstall"),
      makeDemoStep("ds1d", DEMO_GUIDE_IDS[0], 4, "Remove oil filter", "Using an oil filter wrench, unscrew the cartridge filter housing located on the top of the engine. Remove the old filter element."),
      makeDemoStep("ds1e", DEMO_GUIDE_IDS[0], 5, "Install new filter", "Insert the new filter element, replace the O-ring with the one supplied, and hand-tighten the housing then torque to spec.", "18 Nm"),
      makeDemoStep("ds1f", DEMO_GUIDE_IDS[0], 6, "Reinstall drain plug", "Clean the drain plug and install a new sealing washer. Refit and torque the plug.", "25 Nm"),
      makeDemoStep("ds1g", DEMO_GUIDE_IDS[0], 7, "Add new oil", "Remove the oil filler cap on the valve cover. Using a funnel, add 5.5 L of 5W-30 long-life oil."),
      makeDemoStep("ds1h", DEMO_GUIDE_IDS[0], 8, "Check level and leaks", "Start the engine and let it idle for 1 minute. Check for leaks around the drain plug and filter. Switch off and check the dipstick — level should read between MIN and MAX."),
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
      makeDemoStep("ds2a", DEMO_GUIDE_IDS[1], 1, "Loosen wheel nuts", "With the vehicle on the ground, crack the wheel nuts loose half a turn on both front wheels."),
      makeDemoStep("ds2b", DEMO_GUIDE_IDS[1], 2, "Raise and support vehicle", "Jack up the front of the vehicle and secure on axle stands. Remove both front wheels.", undefined, "Use proper axle stand positions as per the vehicle manual."),
      makeDemoStep("ds2c", DEMO_GUIDE_IDS[1], 3, "Inspect existing pads", "Before removal, note the thickness of the existing pads and confirm they need replacement (less than 3mm is the typical minimum)."),
      makeDemoStep("ds2d", DEMO_GUIDE_IDS[1], 4, "Remove caliper guide bolts", "Using a 12mm socket, remove the two caliper guide bolts at the back of the caliper. Slide the caliper off the disc.", undefined, "Do not let the caliper hang by the brake hose — support it with a hook or wire."),
      makeDemoStep("ds2e", DEMO_GUIDE_IDS[1], 5, "Remove old brake pads", "Slide out the old inner and outer brake pads from the caliper bracket. Note which direction they face."),
      makeDemoStep("ds2f", DEMO_GUIDE_IDS[1], 6, "Clean bracket and hardware", "Use a wire brush and brake cleaner to clean the caliper bracket slide areas. Lightly lubricate slide pins with copper grease."),
      makeDemoStep("ds2g", DEMO_GUIDE_IDS[1], 7, "Compress caliper piston", "Place a piece of old pad against the piston and use a C-clamp to slowly compress the piston fully into the caliper body. Check the brake fluid reservoir does not overflow."),
      makeDemoStep("ds2h", DEMO_GUIDE_IDS[1], 8, "Install new pads", "Clip the new inner pad into the piston and the outer pad into the caliper bracket. Ensure anti-squeal shims are correctly seated."),
      makeDemoStep("ds2i", DEMO_GUIDE_IDS[1], 9, "Refit caliper", "Slide the caliper back over the new pads and start the guide bolts by hand. Torque to specification.", "34 Nm"),
      makeDemoStep("ds2j", DEMO_GUIDE_IDS[1], 10, "Refit wheels and bed in pads", "Refit wheels and torque wheel nuts. Lower vehicle. Pump brake pedal until firm. Perform 5–10 moderate stops from 40 km/h to bed in the new pads.", "Wheel nuts: 100 Nm"),
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
      makeDemoStep("ds3a", DEMO_GUIDE_IDS[2], 1, "Prepare and depressurise", "Disconnect the negative battery terminal. Allow the engine to cool for at least 2 hours. Drain engine oil and coolant into appropriate containers."),
      makeDemoStep("ds3b", DEMO_GUIDE_IDS[2], 2, "Remove engine cover and air intake", "Remove the plastic engine cover (4 bolts). Disconnect the air intake pipe from the turbo inlet and remove the intercooler pipes."),
      makeDemoStep("ds3c", DEMO_GUIDE_IDS[2], 3, "Disconnect oil feed line", "Using the oil line disconnect tool, remove the banjo bolt on the turbo oil feed line. Cap the feed line to prevent contamination."),
      makeDemoStep("ds3d", DEMO_GUIDE_IDS[2], 4, "Disconnect oil return line", "Remove the two bolts securing the oil return (drain) line flange at the turbo base. Expect residual oil to drain."),
      makeDemoStep("ds3e", DEMO_GUIDE_IDS[2], 5, "Disconnect coolant lines (water-cooled turbo)", "Clamp and disconnect both coolant feed and return lines from the turbo centre housing.", undefined, "Have rags ready — residual coolant will spill."),
      makeDemoStep("ds3f", DEMO_GUIDE_IDS[2], 6, "Disconnect exhaust downpipe", "Remove the three nuts securing the exhaust downpipe to the turbo outlet flange. Support the downpipe."),
      makeDemoStep("ds3g", DEMO_GUIDE_IDS[2], 7, "Remove turbo-to-manifold mounting nuts", "Remove the four nuts securing the turbo to the exhaust manifold. These are often seized — use penetrating oil and allow 20 minutes to soak.", "Penetrating oil soak required"),
      makeDemoStep("ds3h", DEMO_GUIDE_IDS[2], 8, "Extract turbocharger", "Carefully manoeuvre the turbo out of the engine bay. The unit is heavy — use an assistant or engine support bar."),
      makeDemoStep("ds3i", DEMO_GUIDE_IDS[2], 9, "Clean all mating surfaces", "Using a gasket scraper and brake cleaner, clean the manifold flange, oil feed port, and return port. Ensure no old gasket material remains."),
      makeDemoStep("ds3j", DEMO_GUIDE_IDS[2], 10, "Pre-lubricate new turbo", "Before installation, pour approximately 50ml of clean engine oil into the turbo oil inlet port and rotate the shaft by hand to distribute oil.", undefined, "Never start the engine immediately after turbo installation without pre-lubricating."),
      makeDemoStep("ds3k", DEMO_GUIDE_IDS[2], 11, "Install new turbocharger", "Fit new manifold-to-turbo gasket and carefully seat the new turbo. Start all four mounting nuts by hand, then torque evenly in a cross pattern.", "43 Nm"),
      makeDemoStep("ds3l", DEMO_GUIDE_IDS[2], 12, "Reconnect all lines and pipes", "Reconnect oil feed (new sealing washers), oil return (new gasket), coolant lines, exhaust downpipe (new gasket), and intake piping. Torque all fasteners to spec.", "Oil feed banjo bolt: 32 Nm | Downpipe: 43 Nm"),
      makeDemoStep("ds3m", DEMO_GUIDE_IDS[2], 13, "Refill fluids and verify", "Refill engine oil and coolant. Prime the oil system by cranking (without starting) for 10 seconds. Start and idle for 5 minutes — check for oil or coolant leaks around the turbo."),
    ],
    createdAt: "2026-03-01T12:00:00.000Z", updatedAt: "2026-03-01T12:00:00.000Z",
  },
];
