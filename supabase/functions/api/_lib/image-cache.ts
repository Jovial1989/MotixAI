import { getDb, newId } from "./db.ts";

export interface InstructionImageCacheRecord {
  instructionId: string;
  stepNumber: number;
  imageUrl?: string | null;
  status?: string | null;
  prompt?: string | null;
  error?: string | null;
}

type Sql = ReturnType<typeof getDb>;

export async function getInstructionImageCache(
  sql: Sql,
  instructionId: string,
  stepNumber: number,
) {
  const rows = await sql`
    SELECT id, instruction_id, step_number, image_url, status, prompt, error, updated_at
    FROM instruction_images
    WHERE instruction_id = ${instructionId}
      AND step_number = ${stepNumber}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function upsertInstructionImageCache(
  sql: Sql,
  record: InstructionImageCacheRecord,
) {
  const now = new Date().toISOString();
  await sql`
    INSERT INTO instruction_images (
      id,
      instruction_id,
      step_number,
      image_url,
      status,
      prompt,
      error,
      created_at,
      updated_at
    ) VALUES (
      ${newId()},
      ${record.instructionId},
      ${record.stepNumber},
      ${record.imageUrl ?? null},
      ${record.status ?? "none"},
      ${record.prompt ?? null},
      ${record.error ?? null},
      ${now},
      ${now}
    )
    ON CONFLICT (instruction_id, step_number) DO UPDATE SET
      image_url = EXCLUDED.image_url,
      status = EXCLUDED.status,
      prompt = COALESCE(EXCLUDED.prompt, instruction_images.prompt),
      error = EXCLUDED.error,
      updated_at = EXCLUDED.updated_at
  `;
}

export async function syncRepairStepImage(
  sql: Sql,
  stepId: string,
  payload: { imageUrl?: string | null; status?: string | null; prompt?: string | null; error?: string | null },
) {
  await sql`
    UPDATE "RepairStep"
    SET
      "imageUrl" = ${payload.imageUrl ?? null},
      "imageStatus" = ${payload.status ?? "none"},
      "imagePrompt" = ${payload.prompt ?? null},
      "imageError" = ${payload.error ?? null},
      "updatedAt" = ${new Date().toISOString()}
    WHERE id = ${stepId}
  `;
}
