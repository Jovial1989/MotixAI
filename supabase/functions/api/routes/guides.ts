import { errorResponse, json } from "../_lib/cors.ts";
import { getDb, newId } from "../_lib/db.ts";
import { generateRepairGuide } from "../_lib/gemini.ts";
import type { TokenPayload } from "../_lib/jwt.ts";

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
             p.name as part_name, p."oemNumber" as part_oem,
             (SELECT COUNT(*) FROM "RepairStep" s WHERE s."guideId" = g.id)::int as step_count
      FROM "RepairGuide" g
      JOIN "Vehicle" v ON v.id = g."vehicleId"
      JOIN "Part" p ON p.id = g."partId"
      WHERE ${where}
      ORDER BY g."createdAt" DESC
    `;

    const result = guides.map((g) => ({
      ...g,
      vehicle: { id: g.vehicleId, model: g.vehicle_model, vin: g.vehicle_vin },
      part: { id: g.partId, name: g.part_name, oemNumber: g.part_oem },
      steps: Array(g.step_count ?? 0).fill(null),
    }));

    return json(result);
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
    return new Response(null, { status: 204 });
  }

  return errorResponse("Not Found", 404);
}
