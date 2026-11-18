CREATE TABLE "SparkRoom" (
  "code" TEXT PRIMARY KEY,
  "hostId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "topic" TEXT NOT NULL,
  "state" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "SparkRoom_hostId_createdAt_idx" ON "SparkRoom"("hostId", "createdAt");
CREATE INDEX "SparkRoom_expiresAt_idx" ON "SparkRoom"("expiresAt");
