-- Add image-related columns to RepairStep that were added to Prisma schema
-- after the initial migration was created.
ALTER TABLE "RepairStep"
  ADD COLUMN IF NOT EXISTS "imageStatus" TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS "imageUrl"    TEXT,
  ADD COLUMN IF NOT EXISTS "imagePrompt" TEXT,
  ADD COLUMN IF NOT EXISTS "imageError"  TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW();
