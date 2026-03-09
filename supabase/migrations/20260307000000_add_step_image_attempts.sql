-- Add imageAttempts counter for retry tracking
ALTER TABLE "RepairStep"
  ADD COLUMN IF NOT EXISTS "imageAttempts" INTEGER NOT NULL DEFAULT 0;
