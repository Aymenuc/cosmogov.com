import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;

    const assembly = await db.assembly.findUnique({ where: { id } });
    if (!assembly) return NextResponse.json({ error: 'Assembly not found' }, { status: 404 });

    if (!assembly.isPublic) {
      return NextResponse.json({ error: 'This assembly is private. Contact a coordinator to join.' }, { status: 403 });
    }

    const existing = await db.assemblyMember.findUnique({
      where: { assemblyId_userId: { assemblyId: id, userId: session.id } },
    });

    if (existing) return NextResponse.json({ error: 'You are already a member of this assembly' }, { status: 409 });

    const member = await db.assemblyMember.create({
      data: {
        assemblyId: id,
        userId: session.id,
        role: 'member',
      },
    });

    await db.assembly.update({
      where: { id },
      data: { memberCount: { increment: 1 } },
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error('Error joining assembly:', error);
    return NextResponse.json({ error: 'Failed to join assembly' }, { status: 500 });
  }
}
