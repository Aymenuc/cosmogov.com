import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();

    const initiative = await db.citizenInitiative.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        signatures: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            comment: true,
            createdAt: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        _count: { select: { signatures: true } },
      },
    });

    if (!initiative) return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });

    const hasSigned = session
      ? await db.initiativeSignature.findUnique({ where: { initiativeId_userId: { initiativeId: id, userId: session.id } } })
      : null;

    return NextResponse.json({ initiative, hasSigned: !!hasSigned });
  } catch (error) {
    console.error('Error fetching initiative:', error);
    return NextResponse.json({ error: 'Failed to fetch initiative' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const initiative = await db.citizenInitiative.findUnique({ where: { id } });
    if (!initiative) return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });

    const isCreator = initiative.createdBy === session.id;
    const isAdmin = session.role === 'admin' || session.role === 'super_admin';
    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updated = await db.citizenInitiative.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.governmentResponse !== undefined && { governmentResponse: body.governmentResponse, responseDate: new Date() }),
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ initiative: updated });
  } catch (error) {
    console.error('Error updating initiative:', error);
    return NextResponse.json({ error: 'Failed to update initiative' }, { status: 500 });
  }
}
