import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || '';
  const category = url.searchParams.get('category') || '';

  const where: any = {};
  if (status) where.status = status;
  if (category) where.category = category;

  const messages = await db.contactMessage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(messages);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id, status, reply } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const data: any = {};
  if (status) data.status = status;
  if (reply) { data.reply = reply; data.repliedAt = new Date(); data.repliedBy = session.id; }

  const message = await db.contactMessage.update({ where: { id }, data });
  return NextResponse.json({ success: true, message });
}
