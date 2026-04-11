-- Add fields collected at signup and used by admins reviewing artist applications
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountType" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "signupIp" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT;

CREATE INDEX IF NOT EXISTS "users_signupIp_idx" ON "users"("signupIp");
