import { db } from '@/lib/db';
import { ensureAiAgents } from '@/lib/ai-agents';
import type { HelperType } from '@/lib/helper-languages';

/**
 * What each helper does when a person asks. Helpers never speak on their own:
 * someone presses a button, the helper answers once, and everyone can see
 * who it was for and that it came from an AI.
 */
export const DEBATE_TASKS: Record<HelperType, (language: string) => string> = {
  summarizer: () =>
    'Sum up the debate so far in short sections: the main views (say who holds them, by display name), where people agree, where they disagree, and questions raised but not answered. Use only what was said.',
  consensus: () =>
    'Point out where people already agree, even partly. Then suggest one or two options or small next steps that respect everyone’s main concerns. Never give a score or percentage, and never push anyone to agree.',
  facilitator: () =>
    'Someone has just arrived. In plain words, explain what this debate is about and the main points so far. Then suggest one or two questions that would help it move forward.',
  moderator: () =>
    'Look at the recent messages. If the discussion is drifting off topic, getting heated, or some people are being talked over, say so kindly and suggest how to continue. If it is going well, say so in one sentence. Do not take sides.',
  accessibility: () =>
    'Rewrite the most recent messages from people (not from helpers) in plain, simple language a 12-year-old could follow. Keep who said what and the meaning. Explain any term you have to keep.',
  translator: (language) =>
    `Translate the most recent messages from people (not from helpers) into ${language}. Keep who said what, the meaning and the tone. Reply with the translations only.`,
};

export const TEXT_TASKS: Record<HelperType, (language: string) => string> = {
  summarizer: () =>
    'The person pasted comments or a discussion from their community. Sum up the main views, where people agree and disagree, and questions left unanswered. Use only what is in the text.',
  consensus: () =>
    'The person pasted different views on a community question. Point out the common ground and suggest one or two options or next steps that respect everyone’s main concerns. No scores, and do not push anyone to agree.',
  facilitator: () =>
    'The person pasted a notice, plan or topic from their community. Explain it in plain words: what it is about, what is being decided and by when if stated, and two or three good questions they could ask.',
  moderator: () =>
    'The person pasted a message they want to post in a community discussion. Check its tone and fairness. If it could come across as hostile, personal or unfair, suggest a calmer version that keeps their point. If it is fine, say so in one sentence.',
  accessibility: () =>
    'Rewrite the pasted community text in plain, simple language a 12-year-old could follow, keeping the meaning. Use short sentences and explain any term you have to keep.',
  translator: (language) =>
    `Translate the pasted community text into ${language}, keeping the meaning and tone. Reply with the translation only, then at most one line about any phrase with no direct equivalent.`,
};

/** How each helper's reply is filed in the debate record. */
export const MESSAGE_TYPE: Record<HelperType, string> = {
  summarizer: 'summary',
  consensus: 'consensus_report',
  facilitator: 'intervention',
  moderator: 'moderation',
  accessibility: 'simplification',
  translator: 'translation',
};

/** The helper's stored definition (name and role prompt), creating the six if missing. */
export async function helperAgent(type: HelperType) {
  let agent = await db.aiAgent.findFirst({ where: { type, isActive: true } });
  if (!agent) {
    await ensureAiAgents();
    agent = await db.aiAgent.findFirst({ where: { type, isActive: true } });
  }
  return agent;
}
