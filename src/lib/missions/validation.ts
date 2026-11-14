import { z } from "zod";
import type { Evidence } from "./types";
const text = (max: number) => z.string().trim().min(1).max(max);
export const createMissionSchema = z.object({
  title: text(120),
  goal: text(2000),
  location: z.string().trim().max(150).default(""),
  organizationId: z.string().min(1).max(100).nullable().default(null),
});
export function safeSourceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
export const contributionSchema = z.object({
  kind: z.enum(["perspective", "constraint", "source"]),
  title: text(160),
  content: text(2000),
  url: z
    .string()
    .trim()
    .max(2000)
    .default("")
    .refine(
      (value) => !value || safeSourceUrl(value),
      "Use a full http or https link.",
    ),
});
export const runSchema = z.object({
  stage: z.enum(["research", "perspectives", "plan", "tool"]),
  webSearch: z.boolean().default(false),
});
export const toolSchema = z
  .object({
    title: text(160),
    description: text(500),
    fields: z
      .array(
        z.object({
          id: z.string().regex(/^f[1-6]$/),
          label: text(120),
          kind: z.enum(["text", "choice"]),
          options: z.array(text(100)).max(8),
          required: z.boolean(),
        }),
      )
      .min(1)
      .max(6),
  })
  .refine(
    (tool) =>
      new Set(tool.fields.map((f) => f.id)).size === tool.fields.length &&
      tool.fields.every((f) =>
        f.kind === "choice"
          ? f.options.length >= 2 &&
            new Set(f.options).size === f.options.length
          : f.options.length === 0,
      ),
    "Invalid form fields.",
  );
export const formDraftSchema = z.object({
  tool: toolSchema,
  sourceRunId: z.string().min(1).max(100).nullable().default(null),
  inputRevision: z.number().int().min(0),
});
export const outputSchema = z.object({
  tool: toolSchema.nullable().default(null),
  headline: text(180),
  summary: text(2000),
  findings: z
    .array(
      z.object({
        text: text(1200),
        sourceIds: z.array(text(100)).min(1).max(10),
      }),
    )
    .max(8),
  questions: z.array(text(500)).max(8),
  tasks: z
    .array(
      z.object({
        title: text(160),
        detail: text(1200),
        minutes: z.number().int().min(5).max(480),
      }),
    )
    .max(8),
});
export function parseMissionOutput(
  raw: string,
  sources: Evidence[],
  stage: string,
) {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/, "")
    .replace(/\s*```$/, "");
  const output = outputSchema.parse(JSON.parse(cleaned));
  const ids = new Set(sources.map((source) => source.id));
  if (output.findings.some((f) => f.sourceIds.some((id) => !ids.has(id))))
    throw new Error("The response included unknown references.");
  if (stage !== "plan" && output.tasks.length)
    throw new Error("Tasks belong in the planning step.");
  if (stage === "plan" && !output.tasks.length)
    throw new Error("The plan did not include any tasks.");
  if (stage === "tool" && !output.tool)
    throw new Error("The tool was missing.");
  if (stage !== "tool" && output.tool) throw new Error("Unexpected tool.");
  return output;
}
