-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "BindingProposalSignature" ADD COLUMN     "verificationNote" TEXT;

-- CreateTable
CREATE TABLE "OfficialInvitation" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfficialInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevokedSession" (
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevokedSession_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "OfficialInvitation_tokenHash_key" ON "OfficialInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "OfficialInvitation_expiresAt_idx" ON "OfficialInvitation"("expiresAt");

-- CreateIndex
CREATE INDEX "RevokedSession_expiresAt_idx" ON "RevokedSession"("expiresAt");

-- CreateIndex
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");

UPDATE "BindingProposal" AS p SET "signatureCount" = (SELECT COUNT(*)::INTEGER FROM "BindingProposalSignature" s WHERE s."proposalId" = p.id AND s.verified = TRUE);
UPDATE "BindingProposal" SET status = CASE WHEN "signatureCount" >= "signatureGoal" THEN 'threshold_reached' ELSE 'collecting' END WHERE status IN ('collecting', 'threshold_reached');
