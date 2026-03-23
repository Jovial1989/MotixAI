ALTER TABLE "RepairGuide"
  ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS "canonicalGuideId" TEXT;

UPDATE "RepairGuide"
SET
  "language" = COALESCE(NULLIF("language", ''), 'en'),
  "canonicalGuideId" = COALESCE("canonicalGuideId", id);

CREATE INDEX IF NOT EXISTS "RepairGuide_canonicalGuideId_idx"
  ON "RepairGuide" ("canonicalGuideId");

CREATE INDEX IF NOT EXISTS "RepairGuide_language_idx"
  ON "RepairGuide" ("language");

CREATE UNIQUE INDEX IF NOT EXISTS "RepairGuide_canonicalGuideId_language_user_idx"
  ON "RepairGuide" ("canonicalGuideId", "language", "userId");
