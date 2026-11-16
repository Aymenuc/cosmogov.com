-- My top three: each person's three neighbourhood priorities (one per person, updatable).
CREATE TABLE "PriorityPick" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "picks" TEXT NOT NULL,
  "cityName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PriorityPick_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PriorityPick_userId_key" ON "PriorityPick"("userId");
CREATE INDEX "PriorityPick_cityName_idx" ON "PriorityPick"("cityName");
ALTER TABLE "PriorityPick" ADD CONSTRAINT "PriorityPick_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
