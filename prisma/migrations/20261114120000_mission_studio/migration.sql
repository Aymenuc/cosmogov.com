-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "location" TEXT,
    "organizationId" TEXT,
    "createdBy" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "runLeaseUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionContribution" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionRun" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "inputRevision" INTEGER NOT NULL,
    "sources" JSONB NOT NULL DEFAULT '[]',
    "output" JSONB,
    "error" TEXT,
    "searchStatus" TEXT NOT NULL DEFAULT 'not_requested',
    "reviewedBy" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MissionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionTask" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionToolResponse" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionToolResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Mission_organizationId_updatedAt_idx" ON "Mission"("organizationId", "updatedAt");

-- CreateIndex
CREATE INDEX "Mission_createdBy_updatedAt_idx" ON "Mission"("createdBy", "updatedAt");

-- CreateIndex
CREATE INDEX "MissionContribution_missionId_createdAt_idx" ON "MissionContribution"("missionId", "createdAt");

-- CreateIndex
CREATE INDEX "MissionRun_missionId_createdAt_idx" ON "MissionRun"("missionId", "createdAt");

-- CreateIndex
CREATE INDEX "MissionRun_requestedBy_createdAt_idx" ON "MissionRun"("requestedBy", "createdAt");

-- CreateIndex
CREATE INDEX "MissionTask_missionId_createdAt_idx" ON "MissionTask"("missionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MissionTask_runId_position_key" ON "MissionTask"("runId", "position");

-- CreateIndex
CREATE INDEX "MissionToolResponse_missionId_idx" ON "MissionToolResponse"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionToolResponse_runId_authorId_key" ON "MissionToolResponse"("runId", "authorId");

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionContribution" ADD CONSTRAINT "MissionContribution_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionContribution" ADD CONSTRAINT "MissionContribution_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionRun" ADD CONSTRAINT "MissionRun_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionRun" ADD CONSTRAINT "MissionRun_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionTask" ADD CONSTRAINT "MissionTask_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionTask" ADD CONSTRAINT "MissionTask_runId_fkey" FOREIGN KEY ("runId") REFERENCES "MissionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionTask" ADD CONSTRAINT "MissionTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionToolResponse" ADD CONSTRAINT "MissionToolResponse_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionToolResponse" ADD CONSTRAINT "MissionToolResponse_runId_fkey" FOREIGN KEY ("runId") REFERENCES "MissionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionToolResponse" ADD CONSTRAINT "MissionToolResponse_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

