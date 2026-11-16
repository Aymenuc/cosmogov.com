import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ApiError, apiFailure, apiUser, rateLimit } from '@/lib/api-server';
import { STREET_ITEMS, STREET_SPACE, VIBES } from '@/lib/games/street-items';

const ids = STREET_ITEMS.map((i) => i.id) as [string, ...string[]];
const schema = z.object({
  items: z.array(z.enum(ids)).min(1).max(STREET_SPACE),
  vibe: z.enum(VIBES),
  note: z.string().trim().max(160).optional(),
});

/**
 * The wish wall: how often each item and vibe was chosen, in the person's
 * city when enough neighbours took part, otherwise everywhere. Only counts
 * leave the server: no names, no notes.
 */
async function wall(cityName: string | null) {
  const local = cityName ? await db.streetWish.count({ where: { cityName } }) : 0;
  const where = cityName && local >= 5 ? { cityName } : {};
  const rows = await db.streetWish.findMany({ where, select: { items: true, vibe: true } });
  const items: Record<string, number> = {};
  const vibes: Record<string, number> = {};
  for (const r of rows) {
    for (const id of new Set(JSON.parse(r.items) as string[])) items[id] = (items[id] ?? 0) + 1;
    vibes[r.vibe] = (vibes[r.vibe] ?? 0) + 1;
  }
  return { scope: where.cityName ? cityName : null, total: rows.length, items, vibes };
}

export async function GET() {
  try {
    const user = await apiUser();
    const me = await db.user.findUnique({ where: { id: user.id }, select: { cityName: true, streetWish: true } });
    const mine = me?.streetWish ? { items: JSON.parse(me.streetWish.items), vibe: me.streetWish.vibe, note: me.streetWish.note ?? '' } : null;
    return NextResponse.json({ mine, wall: await wall(me?.cityName ?? null) });
  } catch (error) {
    return apiFailure(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await apiUser();
    await rateLimit('dream-street', user.id, 20, 3600);
    const body = schema.parse(await req.json());
    const used = body.items.reduce((s, id) => s + (STREET_ITEMS.find((i) => i.id === id)?.space ?? 1), 0);
    if (used > STREET_SPACE) throw new ApiError(400, `Your street only has ${STREET_SPACE} spaces.`);
    const me = await db.user.findUnique({ where: { id: user.id }, select: { cityName: true } });
    const data = { items: JSON.stringify(body.items), vibe: body.vibe, note: body.note || null, cityName: me?.cityName ?? null };
    await db.streetWish.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data });
    return NextResponse.json({ saved: true, wall: await wall(me?.cityName ?? null) });
  } catch (error) {
    return apiFailure(error);
  }
}
