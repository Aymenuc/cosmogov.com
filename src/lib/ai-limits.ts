/**
 * AI allowances, shared by the server budget (lib/ai-budget.ts), the
 * assistant page and /trust, so the numbers people see are the ones enforced.
 */
export const AI_LIMITS = {
  assistant: { hour: 10, day: 25 },
  debate: { hour: 20, day: 60 },
  mission: { hour: 12, day: 30 },
} as const;

/** Ceiling on AI requests across the whole site, per day. */
export const AI_SITE_DAILY_LIMIT = 400;
