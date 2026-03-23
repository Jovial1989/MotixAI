-- Add Stripe billing fields to User
-- Required for Stripe Checkout + webhook integration

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "stripeCustomerId"     TEXT,
  ADD COLUMN IF NOT EXISTS "stripeSubscriptionId"  TEXT,
  ADD COLUMN IF NOT EXISTS "currentPeriodEnd"      TIMESTAMP(3);
