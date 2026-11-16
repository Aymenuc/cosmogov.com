import { z } from "zod";

/** The shapes an answer can take: a choice, a set of project ids, or an estimate. */
export const answerSchema = z.union([
  z.number().int().min(0).max(20),
  z.array(z.string().max(10)).max(20),
  z.object({ value: z.number().min(0).max(100), low: z.number().min(0).max(100), high: z.number().min(0).max(100) }),
]);
