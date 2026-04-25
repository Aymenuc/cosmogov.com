import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proposal = await db.bindingProposal.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true, role: true } },
        signatures: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { signatures: true } },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Binding proposal not found' }, { status: 404 });
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error('Error fetching binding proposal:', error);
    return NextResponse.json({ error: 'Failed to fetch binding proposal' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    // Admin only for updates
    if (session.role !== 'admin' && session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, governmentResponse, voteDate, enactmentDate } = body;

    const existing = await db.bindingProposal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Binding proposal not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (governmentResponse) {
      data.governmentResponse = governmentResponse;
      data.responseDate = new Date();
    }
    if (voteDate) data.voteDate = new Date(voteDate);
    if (enactmentDate) data.enactmentDate = new Date(enactmentDate);

    const proposal = await db.bindingProposal.update({
      where: { id },
      data,
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        signatures: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error('Error updating binding proposal:', error);
    return NextResponse.json({ error: 'Failed to update binding proposal' }, { status: 500 });
  }
}
