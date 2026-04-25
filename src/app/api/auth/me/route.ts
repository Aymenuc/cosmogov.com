import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json(session);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { name, ageGroup, interests } = await req.json();
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (ageGroup !== undefined) data.ageGroup = ageGroup;
    if (interests !== undefined) data.interests = interests;

    const user = await db.user.update({
      where: { id: session.id },
      data,
      select: { id: true, email: true, name: true, plan: true, role: true, totalXp: true, level: true, streak: true, ageGroup: true, interests: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
