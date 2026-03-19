-- Add promo code tracking to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "promoCodeUsed" TEXT;
