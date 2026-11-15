import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { chatCompletionsCreate } from '@/lib/ai-completions';
import { apiFailure, apiUser, rateLimit } from '@/lib/api-server';
import { AI_GROUND_RULES, AI_UNAVAILABLE } from '@/lib/ai-rules';

// Only the person's own turns and earlier replies are accepted: a browser
// can't smuggle in "system" instructions, and the size is bounded so one
// request can't run up the AI bill.
const chatSchema = z.object({
  mode: z.enum(['chat', 'proposal_draft', 'analysis', 'coaching']).default('chat'),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(12),
});

const modePrompts: Record<z.infer<typeof chatSchema>['mode'], string> = {
  chat: 'You help people in a community take part well: understand an issue, prepare a question, run a fair discussion, and follow up on decisions.',
  proposal_draft:
    'You help a person draft a proposal for their community. Structure it as: Title, What we propose, Why, How it would work, Costs and risks, What we would check afterwards. Mark anything that needs local facts as [to check].',
  analysis:
    'You help a person think through options they describe: who is affected, trade-offs, and what evidence would settle open questions. You cannot see votes, ballots or community data; work only from what the person tells you.',
  coaching:
    'You give practical tips on facilitating meetings, including quieter voices, and making decisions together fairly.',
};

export async function POST(req: NextRequest) {
  try {
    const user = await apiUser();
    await rateLimit('ai-chat', user.id, 30, 3600);
    const { mode, messages } = chatSchema.parse(await req.json());

    let completion;
    try {
      completion = await chatCompletionsCreate({
        messages: [
          { role: 'system', content: `${modePrompts[mode]}\n\n${AI_GROUND_RULES}` },
          ...messages,
        ],
        max_tokens: 1200,
      });
    } catch (error) {
      console.error('AI provider error:', error instanceof Error ? error.name : 'unknown');
      return NextResponse.json({ error: AI_UNAVAILABLE }, { status: 503 });
    }

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) return NextResponse.json({ error: AI_UNAVAILABLE }, { status: 503 });
    return NextResponse.json({ content, generatedBy: 'ai' });
  } catch (error) {
    return apiFailure(error);
  }
}
