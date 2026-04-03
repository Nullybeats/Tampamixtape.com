-- Add Apple Music fields to users table
ALTER TABLE "users" ADD COLUMN "appleMusicId" TEXT;
ALTER TABLE "users" ADD COLUMN "appleMusicUrl" TEXT;

-- Add Apple Music URL to releases table
ALTER TABLE "releases" ADD COLUMN "appleMusicUrl" TEXT;
