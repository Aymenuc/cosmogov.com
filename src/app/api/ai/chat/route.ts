import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { chatCompletionsCreate } from '@/lib/ai-completions';
import { ApiError, apiFailure, apiUser } from '@/lib/api-server';
import { AI_GROUND_RULES, AI_UNAVAILABLE, ASSISTANT_SCOPE } from '@/lib/ai-rules';
import { spendAi } from '@/lib/ai-budget';

// Only the person's own turns and earlier replies are accepted: a browser
// can't smuggle in "system" instructions. The model sees just the last few
// turns, questions are short, and answers are capped, so it isn't useful as a
// long-running general chatbot.
const MAX_QUESTION = 1500;
const KEEP_TURNS = 6;

const chatSchema = z.object({
  mode: z.enum(['chat', 'proposal_draft', 'analysis', 'coaching']).default('chat'),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(8000),
      }),
    )
    .min(1)
    .max(40),
});

const modePrompts: Record<z.infer<typeof chatSchema>['mode'], string> = {
  chat: 'You help people in a community take part well: understand an issue, prepare a question, run a fair discussion, and follow up on decisions.',
  proposal_draft:
    'You help a person draft a proposal for their community. Structure it as: Title, What we propose, Why, How it would work, Costs and risks, What we would check afterwards. Mark anything that needs local facts as [to check]. If the topic is not something a community could decide on, say so briefly instead of drafting.',
  analysis:
    'You help a person think through options their community faces: who is affected, trade-offs, and what evidence would settle open questions. You cannot see votes, ballots or community data; work only from what the person tells you.',
  coaching:
    'You give practical tips on facilitating community meetings, including quieter voices, and making decisions together fairly.',
};

export async function POST(req: NextRequest) {
  try {
    const user = await apiUser();
    const { mode, messages } = chatSchema.parse(await req.json());
    const question = messages[messages.length - 1];
    if (question.role !== 'user') throw new ApiError(400, 'Please ask a question.');
    if (question.content.length > MAX_QUESTION)
      throw new ApiError(400, `Please keep questions under ${MAX_QUESTION.toLocaleString('en')} characters.`);

    const { remainingToday } = await spendAi('assistant', user.id);

    // Short memory: the last few turns, earlier replies trimmed.
    const recent = messages.slice(-KEEP_TURNS).map((m) => ({
      role: m.role,
      content: m.content.slice(0, m.role === 'user' ? MAX_QUESTION : 1500),
    }));

    let completion;
    try {
      completion = await chatCompletionsCreate({
        messages: [
          { role: 'system', content: `${modePrompts[mode]}\n\n${ASSISTANT_SCOPE}\n\n${AI_GROUND_RULES}` },
          ...recent,
        ],
        max_tokens: mode === 'proposal_draft' ? 900 : 500,
      });
    } catch (error) {
      console.error('AI provider error:', error instanceof Error ? error.name : 'unknown');
      return NextResponse.json({ error: AI_UNAVAILABLE }, { status: 503 });
    }

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) return NextResponse.json({ error: AI_UNAVAILABLE }, { status: 503 });
    return NextResponse.json({ content, generatedBy: 'ai', remainingToday });
  } catch (error) {
    return apiFailure(error);
  }
}
