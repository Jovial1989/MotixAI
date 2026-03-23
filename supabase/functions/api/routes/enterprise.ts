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

export async function handleEnterprise(
  req: Request,
  method: string,
  subpath: string,
  user: TokenPayload,
): Promise<Response> {
  // Enterprise endpoints require ENTERPRISE_ADMIN role with a tenantId
  if (user.role !== "ENTERPRISE_ADMIN") return errorResponse("Forbidden", 403);
  if (!user.tenantId) return errorResponse("Tenant required for enterprise operations", 403);

  const sql = getDb();
  const tenantId = user.tenantId;

  // POST /enterprise/manuals — upload manual
  if (subpath === "/manuals" && method === "POST") {
    const b = await body(req);
    const title = typeof b.title === "string" ? b.title : undefined;
    const fileUrl = typeof b.fileUrl === "string" ? b.fileUrl : undefined;
    const extractedText = typeof b.extractedText === "string" ? b.extractedText : null;
    const vehicleModel = typeof b.vehicleModel === "string" ? b.vehicleModel : null;

    if (!title || title.length < 3) return errorResponse("title must be at least 3 characters", 400);
    if (!fileUrl || !fileUrl.startsWith("http")) return errorResponse("fileUrl must be a valid URL", 400);

    const now = new Date().toISOString();
    const manualId = newId();

    await sql`
      INSERT INTO "ManualDocument" (id, "tenantId", title, "fileUrl", "extractedText", "createdAt", "updatedAt")
      VALUES (${manualId}, ${tenantId}, ${title}, ${fileUrl}, ${extractedText}, ${now}, ${now})
    `;

    let vehicles: unknown[] = [];
    if (vehicleModel) {
      const vehicleId = newId();
      await sql`
        INSERT INTO "Vehicle" (id, "tenantId", model, "createdAt", "updatedAt")
        VALUES (${vehicleId}, ${tenantId}, ${vehicleModel}, ${now}, ${now})
      `;
      // Link vehicle to manual via join table
      await sql`
        INSERT INTO "_ManualDocumentToVehicle" ("A", "B") VALUES (${manualId}, ${vehicleId})
      `;
      vehicles = [{ id: vehicleId, tenantId, model: vehicleModel }];
    }

    return json({ id: manualId, tenantId, title, fileUrl, extractedText, createdAt: now, vehicles }, 201);
  }

  // GET /enterprise/manuals — list manuals
  if (subpath === "/manuals" && method === "GET") {
    const manuals = await sql`
      SELECT m.*, array_agg(row_to_json(v)) FILTER (WHERE v.id IS NOT NULL) as vehicles
      FROM "ManualDocument" m
      LEFT JOIN "_ManualDocumentToVehicle" mv ON mv."A" = m.id
      LEFT JOIN "Vehicle" v ON v.id = mv."B"
      WHERE m."tenantId" = ${tenantId}
      GROUP BY m.id
      ORDER BY m."createdAt" DESC
    `;
    return json(manuals);
  }

  // POST /enterprise/guides — create guide from manual
  if (subpath === "/guides" && method === "POST") {
    const b = await body(req);
    const manualId = typeof b.manualId === "string" ? b.manualId : undefined;
    const vehicleModel = typeof b.vehicleModel === "string" ? b.vehicleModel : undefined;
    const partName = typeof b.partName === "string" ? b.partName : undefined;
    const oemNumber = typeof b.oemNumber === "string" ? b.oemNumber : undefined;

    if (!manualId) return errorResponse("manualId is required", 400);
    if (!vehicleModel || vehicleModel.length < 2) return errorResponse("vehicleModel must be at least 2 characters", 400);
    if (!partName || partName.length < 2) return errorResponse("partName must be at least 2 characters", 400);

    const manuals = await sql`
      SELECT id, "extractedText" FROM "ManualDocument"
      WHERE id = ${manualId} AND "tenantId" = ${tenantId}
      LIMIT 1
    `;

    const manualText = manuals.length > 0 ? (manuals[0].extractedText ?? undefined) : undefined;

    const normalizedPart = `${partName}${oemNumber ? ` (${oemNumber})` : ""}`.trim();
    const generated = await generateRepairGuide(vehicleModel, normalizedPart, manualText);

    const now = new Date().toISOString();

    const vehicleId = newId();
    await sql`
      INSERT INTO "Vehicle" (id, "tenantId", model, "createdAt", "updatedAt")
      VALUES (${vehicleId}, ${tenantId}, ${vehicleModel}, ${now}, ${now})
    `;

    const partId = newId();
    await sql`
      INSERT INTO "Part" (id, "tenantId", name, "oemNumber", "createdAt", "updatedAt")
      VALUES (${partId}, ${tenantId}, ${partName}, ${oemNumber ?? null}, ${now}, ${now})
    `;

    const guideId = newId();
    await sql`
      INSERT INTO "RepairGuide" (
        id, "tenantId", "userId", "vehicleId", "partId", "manualId", title, difficulty,
        "timeEstimate", "safetyNotes", tools, "inputModel", "inputPart", "sourceType", "language", "canonicalGuideId", "createdAt", "updatedAt"
      ) VALUES (
        ${guideId}, ${tenantId}, ${user.sub}, ${vehicleId}, ${partId}, ${manualId},
        ${generated.title}, ${generated.difficulty}, ${generated.timeEstimate},
        ${generated.safetyNotes}, ${generated.tools},
        ${vehicleModel}, ${normalizedPart}, ${"ENTERPRISE"}, ${"en"}, ${guideId}, ${now}, ${now}
      )
    `;

    const stepRows = [];
    for (const step of generated.steps) {
      const stepId = newId();
      await sql`
        INSERT INTO "RepairStep" (id, "guideId", "stepOrder", title, instruction, "torqueValue", "warningNote", "createdAt")
        VALUES (${stepId}, ${guideId}, ${step.order}, ${step.title}, ${step.instruction}, ${step.torqueValue ?? null}, ${step.warningNote ?? null}, ${now})
      `;
      stepRows.push({ id: stepId, guideId, stepOrder: step.order, title: step.title, instruction: step.instruction });
    }

    const imageRows = [];
    for (let i = 0; i < generated.imagePlan.length; i++) {
      const imageId = newId();
      await sql`
        INSERT INTO "GeneratedImage" (id, "guideId", "stepOrder", prompt, "createdAt", "updatedAt")
        VALUES (${imageId}, ${guideId}, ${i + 1}, ${generated.imagePlan[i]}, ${now}, ${now})
      `;
      imageRows.push({ id: imageId, guideId, stepOrder: i + 1, prompt: generated.imagePlan[i] });
    }

    return json({
      id: guideId,
      tenantId,
      userId: user.sub,
      title: generated.title,
      difficulty: generated.difficulty,
      timeEstimate: generated.timeEstimate,
      safetyNotes: generated.safetyNotes,
      tools: generated.tools,
      sourceType: "ENTERPRISE",
      vehicle: { id: vehicleId, model: vehicleModel },
      part: { id: partId, name: partName, oemNumber: oemNumber ?? null },
      steps: stepRows,
      images: imageRows,
    }, 201);
  }

  return errorResponse("Not Found", 404);
}
