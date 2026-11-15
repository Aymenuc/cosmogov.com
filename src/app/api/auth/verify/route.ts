import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ApiError, apiFailure, rateLimit, requestClient, tokenHash } from '@/lib/api-server';

const schema = z.object({ token: z.string().min(20).max(200) });

/** Confirms an email address from the one-time link. */
export async function POST(req: NextRequest) {
  try {
    await rateLimit('verify-email', requestClient(req), 30, 3600);
    const { token } = schema.parse(await req.json());
    const row = await db.emailVerification.findUnique({ where: { tokenHash: tokenHash(token) } });
    if (!row || row.usedAt || row.expiresAt < new Date())
      throw new ApiError(400, 'This link has expired or was already used. Sign in and send a new one.');
    await db.$transaction([
      db.emailVerification.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
      db.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } }),
    ]);
    return NextResponse.json({ verified: true });
  } catch (error) {
    return apiFailure(error);
  }
}
