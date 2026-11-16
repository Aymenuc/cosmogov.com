import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ApiError, apiFailure, apiUser, rateLimit } from '@/lib/api-server';
import { PRIORITIES } from '@/lib/games/priorities';

const ids = PRIORITIES.map((p) => p.id) as [string, ...string[]];
const schema = z.object({ picks: z.array(z.enum(ids)).length(3) });

/**
 * Community priorities: 3 points for a first choice, 2 for second, 1 for
 * third, in the person's town once five neighbours took part. Totals only.
 */
async function board(cityName: string | null) {
  const local = cityName ? await db.priorityPick.count({ where: { cityName } }) : 0;
  const where = cityName && local >= 5 ? { cityName } : {};
  const rows = await db.priorityPick.findMany({ where, select: { picks: true } });
  const points: Record<string, number> = {};
  for (const r of rows) (JSON.parse(r.picks) as string[]).forEach((id, i) => (points[id] = (points[id] ?? 0) + (3 - i)));
  return { scope: where.cityName ? cityName : null, total: rows.length, points };
}

export async function GET() {
  try {
    const user = await apiUser();
    const me = await db.user.findUnique({ where: { id: user.id }, select: { cityName: true, priorityPick: true } });
    return NextResponse.json({ mine: me?.priorityPick ? JSON.parse(me.priorityPick.picks) : null, board: await board(me?.cityName ?? null) });
  } catch (error) {
    return apiFailure(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await apiUser();
    await rateLimit('top-three', user.id, 20, 3600);
    const { picks } = schema.parse(await req.json());
    if (new Set(picks).size !== 3) throw new ApiError(400, 'Choose three different priorities.');
    const me = await db.user.findUnique({ where: { id: user.id }, select: { cityName: true } });
    const data = { picks: JSON.stringify(picks), cityName: me?.cityName ?? null };
    await db.priorityPick.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data });
    return NextResponse.json({ saved: true, board: await board(me?.cityName ?? null) });
  } catch (error) {
    return apiFailure(error);
  }
}
