import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/chat/rooms - List all chat rooms
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  const where: Record<string, unknown> = {};
  if (category) where.category = category;

  const rooms = await db.chatRoom.findMany({
    where,
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { messages: true, members: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(rooms);
}

// POST /api/chat/rooms - Create a new chat room
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { name, description, category, type } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36);

    const room = await db.chatRoom.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        category: category || 'general',
        type: type || 'public',
        createdBy: session.id,
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { messages: true, members: true } },
      },
    });

    // Auto-join creator as admin
    await db.chatMember.create({
      data: {
        roomId: room.id,
        userId: session.id,
        role: 'admin',
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Create chat room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
