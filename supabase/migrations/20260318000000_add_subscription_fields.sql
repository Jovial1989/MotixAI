-- Add subscription / onboarding fields to User
-- Matches backend/prisma/migrations/20260318000000_add_subscription_fields

-- Enums
DO $$ BEGIN
  CREATE TYPE "PlanType" AS ENUM ('free', 'trial', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'expired', 'none');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Columns (idempotent)
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "planType"               "PlanType" NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS "trialEndsAt"            TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "subscriptionStatus"     "SubscriptionStatus" NOT NULL DEFAULT 'none';
