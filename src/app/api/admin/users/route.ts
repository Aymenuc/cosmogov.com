import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const search = url.searchParams.get('search') || '';
  const plan = url.searchParams.get('plan') || '';

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }
  if (plan) where.plan = plan;

  const users = await db.user.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, plan: true, role: true, totalXp: true, level: true, streak: true, createdAt: true, lastActiveAt: true },
  });
  const total = await db.user.count({ where });

  return NextResponse.json({ users, total, page, limit });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { userId, plan, role } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const data: any = {};
  if (plan) data.plan = plan;
  if (role) data.role = role;

  const user = await db.user.update({ where: { id: userId }, data });
  return NextResponse.json({ success: true, user });
}
