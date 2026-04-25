import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { chatCompletionsCreate } from '@/lib/ai-completions';

// ─── Agent Response Decision Logic ───

const shouldModeratorRespond = (msg: string, sentiment: string, contextLength: number) => {
  return sentiment === 'negative' || msg.length > 500 || contextLength % 5 === 0;
};

const shouldFacilitatorRespond = (msg: string, contextLength: number) => {
  return msg.includes('?') || contextLength < 3;
};

const shouldSummarizerRespond = (contextLength: number) => {
  return contextLength > 0 && contextLength % 8 === 0;
};

const shouldConsensusBuilderRespond = (contextLength: number) => {
  return contextLength > 0 && contextLength % 10 === 0;
};

const shouldTranslate = (targetLang?: string) => {
  return !!targetLang && targetLang !== 'en';
};

const shouldSimplify = (simplifyLevel?: string) => {
  return !!simplifyLevel;
};

// ─── Simple Sentiment Analysis ───

function analyzeSentiment(content: string): string {
  const negativeWords = ['angry', 'hate', 'terrible', 'awful', 'stupid', 'idiot', 'worst', 'disgusting', 'outrageous', 'unacceptable', 'ridiculous'];
  const positiveWords = ['great', 'excellent', 'love', 'wonderful', 'amazing', 'fantastic', 'agree', 'support', 'brilliant', 'perfect'];
  const lowerContent = content.toLowerCase();

  const negCount = negativeWords.filter(w => lowerContent.includes(w)).length;
  const posCount = positiveWords.filter(w => lowerContent.includes(w)).length;

  if (negCount > posCount) return 'negative';
  if (posCount > negCount) return 'positive';
  return 'neutral';
}

// ─── AI Agent Response via z-ai-web-dev-sdk ───

async function getAgentResponse(agentSystemPrompt: string, messages: Array<{ displayName: string; content: string; agentType: string | null }>, topic: string) {
  try {
    const completion = await chatCompletionsCreate({
      messages: [
        { role: 'system', content: agentSystemPrompt },
        { role: 'system', content: `Current debate topic: "${topic}". Recent messages context provided. Respond as your agent persona based on the conversation.` },
        ...messages.slice(-8).map(m => ({
          role: (m.agentType ? 'assistant' : 'user') as 'assistant' | 'user',
          content: `${m.displayName}: ${m.content}`,
        })),
      ],
      temperature: 0.7,
      max_tokens: 200,
    });
    return completion.choices[0]?.message?.content || null;
  } catch (e) {
    console.error('AI agent error:', e);
    return null;
  }
}

// ─── GET: Fetch paginated messages ───

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;

    const messages = await db.debateMessage.findMany({
      where: { sessionId: id },
      include: {
        participant: { select: { id: true, displayName: true, role: true, agentType: true } },
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Reverse to chronological order
    return NextResponse.json([...messages].reverse());
  } catch (error) {
    console.error('Debate messages fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST: Send a message and trigger AI agent responses ───

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { content, type, targetLang, simplifyLevel } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Verify debate session exists
    const debate = await db.debateSession.findUnique({
      where: { id },
    });

    if (!debate) {
      return NextResponse.json({ error: 'Debate session not found' }, { status: 404 });
    }

    // Ensure user is a participant; create if not
    let participant = await db.debateParticipant.findUnique({
      where: {
        sessionId_userId: {
          sessionId: id,
          userId: session.id,
        },
      },
    });

    if (!participant) {
      const user = await db.user.findUnique({
        where: { id: session.id },
        select: { name: true, avatarUrl: true },
      });

      participant = await db.debateParticipant.create({
        data: {
          sessionId: id,
          userId: session.id,
          displayName: user?.name || session.email || 'Anonymous',
          avatarUrl: user?.avatarUrl || null,
          role: 'participant',
          stance: 'neutral',
        },
      });

      // Update participant count
      await db.debateSession.update({
        where: { id },
        data: { participantCount: { increment: 1 } },
      });
    }

    // Create the user's message
    const sentiment = analyzeSentiment(content);

    const userMessage = await db.debateMessage.create({
      data: {
        sessionId: id,
        participantId: participant.id,
        userId: session.id,
        content: content.trim(),
        type: type || 'statement',
        sentiment,
        metadata: JSON.stringify({ targetLang: targetLang || null, simplifyLevel: simplifyLevel || null }),
      },
      include: {
        participant: { select: { id: true, displayName: true, role: true, agentType: true } },
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // ─── Trigger AI Agent Responses ───

    // Fetch recent messages for context
    const recentMessages = await db.debateMessage.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'asc' },
      take: 10,
      include: {
        participant: { select: { displayName: true, agentType: true } },
      },
    });

    const contextForDecision = recentMessages.map(m => ({
      displayName: m.participant?.displayName || 'Unknown',
      content: m.content,
      agentType: m.agentType,
    }));

    const contextLength = recentMessages.length;

    // Fetch all active AI agents for their system prompts
    const aiAgents = await db.aiAgent.findMany({
      where: { isActive: true },
    });

    const agentMap = new Map(aiAgents.map(a => [a.type, a]));

    // Determine which agents should respond
    const agentResponses: Array<{
      id: string;
      agentType: string;
      content: string;
      type: string;
    }> = [];

    const respondingAgents: Array<{ type: string; agentType: string; systemPrompt: string }> = [];

    // Moderator (Nexus)
    if (shouldModeratorRespond(content, sentiment, contextLength)) {
      const agent = agentMap.get('moderator');
      if (agent) respondingAgents.push({ type: 'moderation', agentType: 'moderator', systemPrompt: agent.systemPrompt });
    }

    // Facilitator (Lumen)
    if (shouldFacilitatorRespond(content, contextLength)) {
      const agent = agentMap.get('facilitator');
      if (agent) respondingAgents.push({ type: 'intervention', agentType: 'facilitator', systemPrompt: agent.systemPrompt });
    }

    // Summarizer (Synthesis)
    if (shouldSummarizerRespond(contextLength)) {
      const agent = agentMap.get('summarizer');
      if (agent) respondingAgents.push({ type: 'summary', agentType: 'summarizer', systemPrompt: agent.systemPrompt });
    }

    // Consensus Builder (Concord)
    if (shouldConsensusBuilderRespond(contextLength)) {
      const agent = agentMap.get('consensus');
      if (agent) respondingAgents.push({ type: 'consensus_report', agentType: 'consensus', systemPrompt: agent.systemPrompt });
    }

    // Translator (Babel)
    if (shouldTranslate(targetLang)) {
      const agent = agentMap.get('translator');
      if (agent) respondingAgents.push({ type: 'translation', agentType: 'translator', systemPrompt: agent.systemPrompt });
    }

    // Accessibility (Aegis)
    if (shouldSimplify(simplifyLevel)) {
      const agent = agentMap.get('accessibility');
      if (agent) respondingAgents.push({ type: 'simplification', agentType: 'accessibility', systemPrompt: agent.systemPrompt });
    }

    // Generate responses from each triggered agent
    for (const agent of respondingAgents) {
      const agentResponse = await getAgentResponse(
        agent.systemPrompt,
        contextForDecision,
        debate.topic
      );

      if (agentResponse) {
        // Ensure the AI agent has a participant record
        let agentParticipant = await db.debateParticipant.findFirst({
          where: {
            sessionId: id,
            agentType: agent.agentType,
          },
        });

        if (!agentParticipant) {
          const agentConfig = agentMap.get(agent.agentType);
          const personalityData = agentConfig ? JSON.parse(agentConfig.personality || '{}') : {};
          const avatarConfigData = agentConfig ? JSON.parse(agentConfig.avatarConfig || '{}') : {};

          agentParticipant = await db.debateParticipant.create({
            data: {
              sessionId: id,
              userId: null,
              agentType: agent.agentType,
              displayName: agentConfig?.name || agent.agentType,
              role: 'ai_agent',
              stance: 'neutral',
              position: JSON.stringify({ x: 0, y: 0, orbitRadius: 100, angle: Math.random() * 360 }),
            },
          });
        }

        // Prepare translated/simplified content fields
        let translatedContent: string | null = null;
        let simplifiedContent: string | null = null;
        let finalTargetLang: string | null = null;

        if (agent.agentType === 'translator' && targetLang) {
          translatedContent = agentResponse;
          finalTargetLang = targetLang;
        }

        if (agent.agentType === 'accessibility' && simplifyLevel) {
          simplifiedContent = agentResponse;
        }

        // Determine the content to store
        let messageContent = agentResponse;
        // For translator, store the original message context + translation
        if (agent.agentType === 'translator' && targetLang) {
          messageContent = agentResponse;
        }

        const aiMessage = await db.debateMessage.create({
          data: {
            sessionId: id,
            participantId: agentParticipant.id,
            userId: null,
            agentType: agent.agentType,
            content: messageContent,
            simplifiedContent: simplifiedContent,
            translatedContent: translatedContent,
            targetLang: finalTargetLang,
            type: agent.type,
            sentiment: 'neutral',
            metadata: JSON.stringify({
              triggeredBy: 'auto',
              contextLength,
            }),
          },
          include: {
            participant: { select: { id: true, displayName: true, role: true, agentType: true } },
          },
        });

        // Record the intervention
        await db.aiAgentIntervention.create({
          data: {
            sessionId: id,
            agentType: agent.agentType,
            agentId: agentMap.get(agent.agentType)?.id || null,
            triggerType: agent.agentType === 'moderator' ? 'toxicity_detected'
              : agent.agentType === 'facilitator' ? 'quiet_participant'
              : agent.agentType === 'summarizer' ? 'summarize_request'
              : agent.agentType === 'consensus' ? 'consensus_opportunity'
              : agent.agentType === 'translator' ? 'language_barrier'
              : agent.agentType === 'accessibility' ? 'complexity_barrier'
              : 'custom',
            triggerData: JSON.stringify({ sentiment, contextLength, messageContent: content.slice(0, 200) }),
            response: agentResponse,
            impact: JSON.stringify({ messageId: aiMessage.id }),
          },
        });

        agentResponses.push({
          id: aiMessage.id,
          agentType: agent.agentType,
          content: agentResponse,
          type: agent.type,
        });
      }
    }

    // Update debate energy level based on activity
    const newEnergyLevel = Math.min(1, debate.energyLevel + 0.05);
    await db.debateSession.update({
      where: { id },
      data: {
        energyLevel: newEnergyLevel,
        status: debate.status === 'waiting' ? 'active' : debate.status,
      },
    });

    return NextResponse.json({
      userMessage,
      aiResponses: agentResponses,
    }, { status: 201 });
  } catch (error) {
    console.error('Debate message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
