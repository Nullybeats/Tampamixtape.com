-- Add advertisement settings fields
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "adImageUrl" TEXT;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "adImageLink" TEXT;
