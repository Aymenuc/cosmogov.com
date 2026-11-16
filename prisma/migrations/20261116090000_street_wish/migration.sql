-- Dream street: each person's ideal street (one per person, updatable).
CREATE TABLE "StreetWish" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "items" TEXT NOT NULL,
  "vibe" TEXT NOT NULL,
  "note" TEXT,
  "cityName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StreetWish_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StreetWish_userId_key" ON "StreetWish"("userId");
CREATE INDEX "StreetWish_cityName_idx" ON "StreetWish"("cityName");
ALTER TABLE "StreetWish" ADD CONSTRAINT "StreetWish_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
