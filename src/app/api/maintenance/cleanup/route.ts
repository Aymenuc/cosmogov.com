import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32)
    return NextResponse.json(
      { error: "Maintenance is not configured." },
      { status: 503 },
    );
  const supplied = Buffer.from(req.headers.get("authorization") || ""),
    expected = Buffer.from(`Bearer ${secret}`);
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  )
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const now = new Date();
  const [answers, limits, revoked] = await db.$transaction([
    db.missionToolResponse.deleteMany({ where: { expiresAt: { lte: now } } }),
    db.rateLimitBucket.deleteMany({ where: { expiresAt: { lte: now } } }),
    db.revokedSession.deleteMany({ where: { expiresAt: { lte: now } } }),
  ]);
  return NextResponse.json({
    deletedResponses: answers.count,
    deletedLimits: limits.count,
    deletedRevocations: revoked.count,
  });
}
