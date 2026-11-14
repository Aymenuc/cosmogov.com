import { z } from "zod";
const content = z.string().trim().min(1);
export const proposalCreate = z.object({
  title: content.max(200),
  description: content.max(20000),
  category: z.string().max(50).default("general"),
  votingType: z
    .enum(["yes_no", "single_choice", "multiple_choice"])
    .default("yes_no"),
  options: z
    .array(content.max(160))
    .min(2)
    .max(12)
    .refine((v) => new Set(v).size === v.length, "Use different options.")
    .default(["For", "Against"]),
  organizationId: z.string().max(100).nullable().default(null),
  isAnonymous: z.boolean().default(false),
  quorum: z.number().int().min(1).max(1000000).default(10),
  closesAt: z.string().datetime().nullable().default(null),
  countryId: z.string().max(100).nullish(),
  countryName: z.string().max(100).nullish(),
  stateId: z.string().max(100).nullish(),
  stateName: z.string().max(100).nullish(),
  cityId: z.string().max(100).nullish(),
  cityName: z.string().max(100).nullish(),
  latitude: z.number().min(-90).max(90).nullish(),
  longitude: z.number().min(-180).max(180).nullish(),
});
export const proposalPatch = proposalCreate
  .omit({ organizationId: true })
  .partial()
  .extend({
    status: z.enum(["draft", "active", "closed", "cancelled"]).optional(),
  })
  .strict();
