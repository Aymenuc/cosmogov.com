import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { id } = await params;

    const body = await req.json();
    const { content, sectionRef, type, parentCommentId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    // Verify legislation exists
    const legislation = await db.legislation.findUnique({ where: { id } });
    if (!legislation) return NextResponse.json({ error: 'Legislation not found' }, { status: 404 });

    const comment = await db.legislationComment.create({
      data: {
        legislationId: id,
        userId: session.id,
        content: content.trim(),
        sectionRef: sectionRef || null,
        type: type || 'comment',
        parentCommentId: parentCommentId || null,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Increment comment count
    await db.legislation.update({
      where: { id },
      data: { commentCount: { increment: 1 } },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
