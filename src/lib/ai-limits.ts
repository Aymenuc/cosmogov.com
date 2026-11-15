/**
 * AI allowances. The per-plan numbers live in lib/plans.ts; these are the
 * free (Community) allowances, used where no plan is known and on /trust.
 */
import { PLANS, AI_SITE_DAILY_LIMIT as SITE } from "@/lib/plans";

export const AI_LIMITS = PLANS.community.ai;
export const AI_SITE_DAILY_LIMIT = SITE.free;
export const AI_SITE_DAILY_LIMIT_PAID = SITE.paid;
