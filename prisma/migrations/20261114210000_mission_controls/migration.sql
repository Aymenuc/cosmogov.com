-- AlterTable
ALTER TABLE "MissionRun" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "formState" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN     "model" TEXT,
ADD COLUMN     "promptVersion" TEXT,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "responseVisibility" TEXT NOT NULL DEFAULT 'members',
ADD COLUMN     "retentionDays" INTEGER,
ADD COLUMN     "sensitiveReason" TEXT,
ADD COLUMN     "stateChangedBy" TEXT;

-- AlterTable
ALTER TABLE "MissionTask" ADD COLUMN     "evidence" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "MissionToolResponse" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "notice" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "noticeVersion" TEXT NOT NULL DEFAULT 'legacy-notice',
ADD COLUMN     "offerToHelp" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MissionEvent" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "taskId" TEXT,
    "runId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "detail" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MissionEvent_missionId_createdAt_idx" ON "MissionEvent"("missionId", "createdAt");

-- AddForeignKey
ALTER TABLE "MissionEvent" ADD CONSTRAINT "MissionEvent_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionEvent" ADD CONSTRAINT "MissionEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "MissionTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionEvent" ADD CONSTRAINT "MissionEvent_runId_fkey" FOREIGN KEY ("runId") REFERENCES "MissionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionEvent" ADD CONSTRAINT "MissionEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Preserve existing sharing and retention notices; new drafts get explicit defaults in code.
UPDATE "MissionRun" SET "formState" = 'published' WHERE stage = 'tool' AND "acceptedAt" IS NOT NULL;
