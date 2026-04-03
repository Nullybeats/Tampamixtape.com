-- Add Apple Music enriched cache columns
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "appleMusicCache" JSONB;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "appleMusicCachedAt" TIMESTAMP(3);
