import { NextRequest, NextResponse } from 'next/server';
import { chatCompletionsCreate, aiProviderHost } from '@/lib/ai-completions';
import { apiFailure, rateLimit, requestClient } from '@/lib/api-server';

// Public health check: is the AI helper actually answering? It returns only
// on/off, never content. The check is a one-word completion, cached for ten
// minutes per server and rate-limited per client, so it can't run up the bill.
const TTL_MS = 10 * 60 * 1000;
let cached: { at: number; body: Record<string, unknown> } | null = null;

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await rateLimit('ai-status', requestClient(req), 20, 3600);
    if (cached && Date.now() - cached.at < TTL_MS) return NextResponse.json(cached.body);

    const configured = Boolean(process.env.Z_AI_BASE_URL?.trim() && process.env.Z_AI_API_KEY?.trim());
    let status: 'on' | 'off' | 'error' = 'off';
    let model: string | null = null;
    if (configured) {
      try {
        const reply = await chatCompletionsCreate({
          messages: [{ role: 'user', content: 'Reply with the single word OK.' }],
          max_tokens: 5,
          temperature: 0,
        });
        status = reply.choices[0]?.message?.content?.trim() ? 'on' : 'error';
        model = reply.model ?? null;
      } catch (error) {
        console.error('AI status check failed:', error instanceof Error ? error.message.slice(0, 200) : 'unknown');
        status = 'error';
      }
    }
    const body = { status, provider: configured ? aiProviderHost() : null, model, checkedAt: new Date().toISOString() };
    cached = { at: Date.now(), body };
    return NextResponse.json(body);
  } catch (error) {
    return apiFailure(error);
  }
}
