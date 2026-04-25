import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/chat/rooms/[slug]/messages - Get paginated messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');
  const limit = parseInt(searchParams.get('limit') || '50');

  // Find the room first
  const room = await db.chatRoom.findUnique({ where: { slug }, select: { id: true } });
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const where: Record<string, unknown> = { roomId: room.id };
  if (cursor) {
    where.id = { lt: cursor };
  }

  const messages = await db.chatMessage.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

  return NextResponse.json({
    messages: messages.reverse(),
    nextCursor,
  });
}

// POST /api/chat/rooms/[slug]/messages - Send a message (REST fallback for when socket is unavailable)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { slug } = await params;

  try {
    const { content, type } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const room = await db.chatRoom.findUnique({ where: { slug }, select: { id: true } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const message = await db.chatMessage.create({
      data: {
        roomId: room.id,
        userId: session.id,
        content: content.trim(),
        type: type || 'text',
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
