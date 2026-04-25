import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { chatCompletionsCreate } from '@/lib/ai-completions';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const { messages, mode } = await req.json();

    let systemPrompt = `You are the CosmoGov AI Assistant — an expert governance advisor embedded in an interstellar civic operating system. You help users draft proposals, analyze voting patterns, identify cognitive biases, and make better collective decisions. You speak with clarity, precision, and a touch of cosmic wonder. Keep responses concise but insightful.`;

    if (mode === 'proposal_draft') {
      systemPrompt = `You are the CosmoGov AI Proposal Generator. Generate a well-structured governance proposal based on the user's description. Include: Title, Summary, Key Benefits (3-5 bullet points), Implementation Steps, Risk Assessment, and Expected Outcomes. Be specific, actionable, and compelling.`;
    }

    const completion = await chatCompletionsCreate({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 4096,
    });

    const content = completion.choices[0]?.message?.content || 'I apologize, I was unable to generate a response. Please try again.';

    return NextResponse.json({ content });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
  }
}
