-- Add source-backed guide columns to RepairGuide
ALTER TABLE "RepairGuide"
  ADD COLUMN IF NOT EXISTS "source"           TEXT DEFAULT 'generated',
  ADD COLUMN IF NOT EXISTS "confidence"       INTEGER,
  ADD COLUMN IF NOT EXISTS "sourceProvider"   TEXT,
  ADD COLUMN IF NOT EXISTS "sourceReferences" JSONB,
  ADD COLUMN IF NOT EXISTS "taskType"         TEXT;
