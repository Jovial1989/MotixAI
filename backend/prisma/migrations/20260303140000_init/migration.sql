-- Create enums
CREATE TYPE "Role" AS ENUM ('USER', 'ENTERPRISE_ADMIN');
CREATE TYPE "JobType" AS ENUM ('GUIDE_IMAGE_GENERATION');
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

CREATE TABLE "Tenant" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "refreshTokenHash" TEXT,
  "tenantId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Vehicle" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT,
  "vin" TEXT,
  "model" TEXT NOT NULL,
  "manufacturer" TEXT,
  "year" INTEGER,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "Vehicle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Part" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT,
  "name" TEXT NOT NULL,
  "oemNumber" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "Part_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ManualDocument" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "extractedText" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "ManualDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "RepairGuide" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT,
  "userId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "partId" TEXT NOT NULL,
  "manualId" TEXT,
  "title" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL,
  "timeEstimate" TEXT NOT NULL,
  "safetyNotes" TEXT[] NOT NULL DEFAULT '{}',
  "tools" TEXT[] NOT NULL DEFAULT '{}',
  "inputVin" TEXT,
  "inputModel" TEXT,
  "inputPart" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL DEFAULT 'B2C',
  "status" TEXT NOT NULL DEFAULT 'READY',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "RepairGuide_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "RepairGuide_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RepairGuide_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RepairGuide_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RepairGuide_manualId_fkey" FOREIGN KEY ("manualId") REFERENCES "ManualDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "RepairStep" (
  "id" TEXT PRIMARY KEY,
  "guideId" TEXT NOT NULL,
  "stepOrder" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "instruction" TEXT NOT NULL,
  "torqueValue" TEXT,
  "warningNote" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "RepairStep_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "RepairGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "GeneratedImage" (
  "id" TEXT PRIMARY KEY,
  "guideId" TEXT NOT NULL,
  "stepOrder" INTEGER NOT NULL,
  "prompt" TEXT NOT NULL,
  "imageUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "GeneratedImage_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "RepairGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Job" (
  "id" TEXT PRIMARY KEY,
  "guideId" TEXT NOT NULL,
  "type" "JobType" NOT NULL,
  "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
  "payload" JSONB NOT NULL,
  "error" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "Job_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "RepairGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "_ManualDocumentToVehicle" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  PRIMARY KEY ("A", "B"),
  CONSTRAINT "_ManualDocumentToVehicle_A_fkey" FOREIGN KEY ("A") REFERENCES "ManualDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "_ManualDocumentToVehicle_B_fkey" FOREIGN KEY ("B") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Vehicle_tenantId_model_idx" ON "Vehicle"("tenantId", "model");
CREATE INDEX "Part_tenantId_name_idx" ON "Part"("tenantId", "name");
CREATE INDEX "RepairGuide_tenantId_userId_createdAt_idx" ON "RepairGuide"("tenantId", "userId", "createdAt");
CREATE INDEX "RepairStep_guideId_stepOrder_idx" ON "RepairStep"("guideId", "stepOrder");
CREATE INDEX "GeneratedImage_guideId_stepOrder_idx" ON "GeneratedImage"("guideId", "stepOrder");
CREATE INDEX "Job_guideId_status_idx" ON "Job"("guideId", "status");
