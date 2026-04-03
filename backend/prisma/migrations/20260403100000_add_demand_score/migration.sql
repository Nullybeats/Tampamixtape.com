-- Add TampaMixtape Demand Score fields to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "demandScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "demandScoreTier" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "demandScoreAt" TIMESTAMP(3);

-- Create profile views table for tracking
CREATE TABLE IF NOT EXISTS "profile_views" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "viewerIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profile_views_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "profile_views_artistId_idx" ON "profile_views"("artistId");
CREATE INDEX IF NOT EXISTS "profile_views_artistId_createdAt_idx" ON "profile_views"("artistId", "createdAt");
