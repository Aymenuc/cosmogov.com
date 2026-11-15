-- Email confirmation: voting, signing and AI help need a confirmed address.
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
-- Accounts created before this change keep working (production has only the administrator).
UPDATE "User" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;

CREATE TABLE "EmailVerification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmailVerification_tokenHash_key" ON "EmailVerification"("tokenHash");
CREATE INDEX "EmailVerification_userId_idx" ON "EmailVerification"("userId");
ALTER TABLE "EmailVerification" ADD CONSTRAINT "EmailVerification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
