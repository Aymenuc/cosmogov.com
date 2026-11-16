-- Council rooms: neighbours play "A year at the town hall" together.
CREATE TABLE "CouncilRoom" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "seed" INTEGER NOT NULL,
  "hostId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'lobby',
  "players" TEXT NOT NULL DEFAULT '[]',
  "decisions" TEXT NOT NULL DEFAULT '[]',
  "reactions" TEXT NOT NULL DEFAULT '{}',
  "votes" TEXT NOT NULL DEFAULT '{}',
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CouncilRoom_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CouncilRoom_code_key" ON "CouncilRoom"("code");
CREATE INDEX "CouncilRoom_updatedAt_idx" ON "CouncilRoom"("updatedAt");
