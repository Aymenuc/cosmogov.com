-- AlterTable
ALTER TABLE "MissionRun" ADD COLUMN     "derivedFromId" TEXT,
ADD COLUMN     "origin" TEXT NOT NULL DEFAULT 'ai';

-- CreateIndex
CREATE INDEX "MissionRun_derivedFromId_idx" ON "MissionRun"("derivedFromId");

-- AddForeignKey
ALTER TABLE "MissionRun" ADD CONSTRAINT "MissionRun_derivedFromId_fkey" FOREIGN KEY ("derivedFromId") REFERENCES "MissionRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

