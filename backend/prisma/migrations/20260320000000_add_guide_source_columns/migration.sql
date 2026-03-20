-- Add source-backed guide columns to RepairGuide
ALTER TABLE "RepairGuide"
  ADD COLUMN IF NOT EXISTS "source"           TEXT DEFAULT 'generated',
  ADD COLUMN IF NOT EXISTS "confidence"       INTEGER,
  ADD COLUMN IF NOT EXISTS "sourceProvider"   TEXT,
  ADD COLUMN IF NOT EXISTS "sourceReferences" JSONB,
  ADD COLUMN IF NOT EXISTS "taskType"         TEXT;

-- Add image pipeline columns to RepairStep
ALTER TABLE "RepairStep"
  ADD COLUMN IF NOT EXISTS "imageStatus"   TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS "imageUrl"      TEXT,
  ADD COLUMN IF NOT EXISTS "imagePrompt"   TEXT,
  ADD COLUMN IF NOT EXISTS "imageError"    TEXT,
  ADD COLUMN IF NOT EXISTS "imageAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "updatedAt"     TIMESTAMP DEFAULT NOW();
