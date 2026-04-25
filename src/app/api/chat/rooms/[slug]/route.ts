import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/chat/rooms/[slug] - Get room details with recent messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { slug } = await params;

  const room = await db.chatRoom.findUnique({
    where: { slug },
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true, level: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
      messages: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      _count: { select: { messages: true, members: true } },
    },
  });

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  // Reverse messages to be in chronological order
  const roomData = {
    ...room,
    messages: room.messages.reverse(),
  };

  return NextResponse.json(roomData);
}
