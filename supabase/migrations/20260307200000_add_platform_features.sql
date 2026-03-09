-- Platform features: RepairJob + GuideRequest tables

CREATE TABLE IF NOT EXISTS "RepairJob" (
  "id"                   TEXT PRIMARY KEY,
  "tenantId"             TEXT,
  "userId"               TEXT NOT NULL,
  "vehicleId"            TEXT NOT NULL,
  "guideId"              TEXT,
  "assignedTechnicianId" TEXT,
  "problemDescription"   TEXT NOT NULL,
  "status"               TEXT NOT NULL DEFAULT 'pending',
  "notes"                TEXT,
  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "RepairJob_vehicleId_fkey"  FOREIGN KEY ("vehicleId")  REFERENCES "Vehicle"("id")      ON DELETE CASCADE,
  CONSTRAINT "RepairJob_guideId_fkey"    FOREIGN KEY ("guideId")    REFERENCES "RepairGuide"("id")  ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "RepairJob_tenantId_userId_createdAt_idx"
  ON "RepairJob"("tenantId", "userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "RepairJob_vehicleId_idx"
  ON "RepairJob"("vehicleId");

CREATE TABLE IF NOT EXISTS "GuideRequest" (
  "id"           TEXT PRIMARY KEY,
  "tenantId"     TEXT,
  "userId"       TEXT NOT NULL,
  "vehicleModel" TEXT NOT NULL,
  "repairType"   TEXT NOT NULL,
  "partNumber"   TEXT,
  "notes"        TEXT,
  "status"       TEXT NOT NULL DEFAULT 'pending',
  "guideId"      TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "GuideRequest_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "RepairGuide"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "GuideRequest_tenantId_status_createdAt_idx"
  ON "GuideRequest"("tenantId", "status", "createdAt" DESC);
