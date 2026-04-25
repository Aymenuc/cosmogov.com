import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const records = await db.billingRecord.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { user: { select: { name: true, email: true } } },
  });

  const monthlyRevenue = await db.billingRecord.aggregate({
    where: { status: 'paid' },
    _sum: { amount: true },
    _count: true,
  });

  const planBreakdown = await db.billingRecord.groupBy({
    by: ['plan'],
    where: { status: 'paid' },
    _sum: { amount: true },
    _count: true,
  });

  return NextResponse.json({ records, monthlyRevenue, planBreakdown });
}
