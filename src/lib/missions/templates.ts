import { z } from "zod";
import { toolSchema } from "./validation";
export const templateContentSchema = z.object({
  tool: toolSchema.nullable(),
  tasks: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(160),
        detail: z.string().trim().min(1).max(1200),
        minutes: z.number().int().min(5).max(480),
      }),
    )
    .max(8),
});
