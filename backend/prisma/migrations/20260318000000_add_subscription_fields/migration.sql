-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('free', 'trial', 'premium');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'expired', 'none');

-- AlterTable: add subscription fields to User
ALTER TABLE "User"
  ADD COLUMN "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "planType"               "PlanType" NOT NULL DEFAULT 'free',
  ADD COLUMN "trialEndsAt"            TIMESTAMP(3),
  ADD COLUMN "subscriptionStatus"     "SubscriptionStatus" NOT NULL DEFAULT 'none';
