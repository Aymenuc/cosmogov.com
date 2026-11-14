-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "templateCredit" TEXT,
ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "MissionMatch" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'invited',
    "terms" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "MissionMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "organizationId" TEXT,
    "sourceMissionId" TEXT,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MissionMatch_missionId_createdAt_idx" ON "MissionMatch"("missionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MissionMatch_taskId_responseId_key" ON "MissionMatch"("taskId", "responseId");

-- CreateIndex
CREATE INDEX "MissionTemplate_organizationId_createdAt_idx" ON "MissionTemplate"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MissionTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionMatch" ADD CONSTRAINT "MissionMatch_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionMatch" ADD CONSTRAINT "MissionMatch_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "MissionTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionMatch" ADD CONSTRAINT "MissionMatch_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "MissionToolResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionTemplate" ADD CONSTRAINT "MissionTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionTemplate" ADD CONSTRAINT "MissionTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionTemplate" ADD CONSTRAINT "MissionTemplate_sourceMissionId_fkey" FOREIGN KEY ("sourceMissionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
