import { NextRequest, NextResponse } from 'next/server';
import { inVisibleProcess } from '@/lib/visibility';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { id } = await params;

    const body = await req.json();
    const { title, description, sectionRef, originalText, proposedText, rationale } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // Verify legislation exists
    const legislation = await db.legislation.findFirst({ where: { id, ...inVisibleProcess(session.id) } });
    if (!legislation) return NextResponse.json({ error: 'Legislation not found' }, { status: 404 });

    const amendment = await db.legislationAmendment.create({
      data: {
        legislationId: id,
        userId: session.id,
        title,
        description,
        sectionRef: sectionRef || null,
        originalText: originalText || null,
        proposedText: proposedText || null,
        rationale: rationale || null,
        status: 'proposed',
      },
      include: {
        proposer: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Increment amendment count
    await db.legislation.update({
      where: { id },
      data: { amendmentCount: { increment: 1 } },
    });

    return NextResponse.json({ amendment }, { status: 201 });
  } catch (error) {
    console.error('Error proposing amendment:', error);
    return NextResponse.json({ error: 'Failed to propose amendment' }, { status: 500 });
  }
}
