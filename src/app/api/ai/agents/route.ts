import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ensureAiAgents } from '@/lib/ai-agents';


export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await ensureAiAgents();
    const agents = await db.aiAgent.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error('AI agents fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
