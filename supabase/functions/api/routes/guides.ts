import { CORS_HEADERS, errorResponse, json } from "../_lib/cors.ts";
import { getDb, newId } from "../_lib/db.ts";
import { explainStep, generateRepairGuide, synthesizeFromSource } from "../_lib/gemini.ts";
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

export async function handleGuides(
  req: Request,
  method: string,
  subpath: string,
  user: TokenPayload,
): Promise<Response> {
  const sql = getDb();

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
      ? await synthesizeFromSource(sourcePkg)
      : await generateRepairGuide(normalizedVehicle, normalizedPart);

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
        "taskType", "createdAt", "updatedAt"
      ) VALUES (
        ${guideId}, ${user.tenantId}, ${user.sub}, ${vehicleId}, ${partId},
        ${generated.title}, ${generated.difficulty}, ${generated.timeEstimate},
        ${generated.safetyNotes}, ${generated.tools},
        ${null}, ${normalizedVehicle}, ${normalizedPart},
        ${sourceType}, ${sourceTag}, ${confidence},
        ${sourceProvider}, ${sourceReferences ? JSON.stringify(sourceReferences) : null},
        ${taskType}, ${now}, ${now}
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
      taskType, status: "READY", createdAt: now, updatedAt: now,
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

    if (!partName) return errorResponse("partName is required", 400);

    const normalizedVehicle = (vehicleModel || vin || "Unknown vehicle").trim();
    const normalizedPart = `${partName}${oemNumber ? ` (${oemNumber})` : ""}`.trim();
    const sourceType = user.role === "ENTERPRISE_ADMIN" ? "ENTERPRISE" : "B2C";

    const generated = await generateRepairGuide(normalizedVehicle, normalizedPart);

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
        "sourceType", "createdAt", "updatedAt"
      ) VALUES (
        ${guideId}, ${user.tenantId}, ${user.sub}, ${vehicleId}, ${partId},
        ${generated.title}, ${generated.difficulty}, ${generated.timeEstimate},
        ${generated.safetyNotes}, ${generated.tools},
        ${vin ?? null}, ${vehicleModel ?? null}, ${normalizedPart},
        ${sourceType}, ${now}, ${now}
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
    const where = user.tenantId
      ? sql`"tenantId" = ${user.tenantId}`
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
      await seedExampleGuides(user.sub).catch(() => {});
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
          SELECT id, "imageStatus" FROM "RepairStep"
          WHERE "guideId" = ${g.id} ORDER BY "stepOrder" ASC
        `;
        return {
          ...g,
          vehicle: { id: g.vehicleId, model: g.vehicle_model, vin: g.vehicle_vin },
          part: { id: g.partId, name: g.part_name, oemNumber: g.part_oem },
          steps: stepStatus,
        };
      }));
      return json(seededResult);
    }

    // Fetch lightweight step status data for each guide (used for dashboard status dot + step count)
    const result = await Promise.all(guides.map(async (g) => {
      const stepStatus = await sql`
        SELECT id, "imageStatus" FROM "RepairStep"
        WHERE "guideId" = ${g.id} ORDER BY "stepOrder" ASC
      `;
      return {
        ...g,
        vehicle: { id: g.vehicleId, model: g.vehicle_model, vin: g.vehicle_vin },
        part: { id: g.partId, name: g.part_name, oemNumber: g.part_oem },
        steps: stepStatus,
      };
    }));

    return json(result);
  }

  // POST /guides/:id/ask — Ask AI about a specific step
  const askMatch = subpath.match(/^\/([a-zA-Z0-9]+)\/ask$/);
  if (askMatch && method === "POST") {
    const guideId = askMatch[1];

    // Fetch the guide (must belong to this user or be a cached/shared guide)
    const guideWhere = user.tenantId
      ? sql`g.id = ${guideId} AND g."tenantId" = ${user.tenantId}`
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
    const b = await body(req);
    const stepId = typeof b.stepId === "string" ? b.stepId : null;
    const question = typeof b.question === "string" ? b.question : "";

    if (!stepId) return errorResponse("stepId is required", 400);

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
    );

    return json({ answer });
  }

  // GET /guides/:id — single guide with steps + images
  const idMatch = subpath.match(/^\/([a-zA-Z0-9]+)$/);
  if (idMatch && method === "GET") {
    const guideId = idMatch[1];
    const where = user.tenantId
      ? sql`g.id = ${guideId} AND g."tenantId" = ${user.tenantId}`
      : sql`g.id = ${guideId} AND g."userId" = ${user.sub}`;

    const guides = await sql`
      SELECT g.*, v.id as vid, v.model as vehicle_model, v.vin as vehicle_vin,
             p.id as pid, p.name as part_name, p."oemNumber" as part_oem
      FROM "RepairGuide" g
      JOIN "Vehicle" v ON v.id = g."vehicleId"
      JOIN "Part" p ON p.id = g."partId"
      WHERE ${where}
      LIMIT 1
    `;
    if (guides.length === 0) return errorResponse("Guide not found", 404);

    const g = guides[0];
    const steps =
      await sql`SELECT * FROM "RepairStep" WHERE "guideId" = ${guideId} ORDER BY "stepOrder" ASC`;
    const images =
      await sql`SELECT * FROM "GeneratedImage" WHERE "guideId" = ${guideId} ORDER BY "stepOrder" ASC`;

    return json({
      ...g,
      vehicle: { id: g.vid, model: g.vehicle_model, vin: g.vehicle_vin },
      part: { id: g.pid, name: g.part_name, oemNumber: g.part_oem },
      steps,
      images,
    });
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
