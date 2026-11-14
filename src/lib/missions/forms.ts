import { z } from "zod";
import type { MissionTool } from "./types";
export const FORM_NOTICE_VERSION = "mission-form-v2";
export const formSettingsSchema = z.object({
  responseVisibility: z.enum(["organizers", "members"]).default("organizers"),
  retentionDays: z
    .union([z.literal(30), z.literal(90), z.literal(365)])
    .default(90),
  sensitiveReason: z.string().trim().max(1000).default(""),
});
export type FormSettings = z.infer<typeof formSettingsSchema>;
export const defaultFormSettings: FormSettings = {
  responseVisibility: "organizers",
  retentionDays: 90,
  sensitiveReason: "",
};
// A review aid, not a claim that all sensitive questions can be recognized.
const patterns: [RegExp, string][] = [
  [/\b(your|full|first|last|legal)\s+name\b/i, "personal names"],
  [
    /\b(e-?mail|telephone|phone number|mobile number|contact details|your address|home address|postal address|mailing address)\b/i,
    "contact details",
  ],
  [
    /\b(medical|diagnos\w*|health condition|disabilit\w*|religio\w*|ethnic\w*|political (affiliation|party|opinion)|sexual\w*|gender identity)\b/i,
    "sensitive personal information",
  ],
  [
    /\b(passport|national id|identity document|social security|bank account|credit card|salary|income|financial details)\b/i,
    "identity or financial information",
  ],
];
export function sensitiveQuestions(tool: MissionTool): string[] {
  const texts = [
    { label: "Form introduction", text: `${tool.title} ${tool.description}` },
    ...tool.fields.map((field, i) => ({
      label: `Question ${i + 1}`,
      text: field.label,
    })),
  ];
  return texts.flatMap((item) =>
    patterns
      .filter(([pattern]) => pattern.test(item.text))
      .map(([, category]) => `${item.label}: ${category}`),
  );
}
export function formReviewError(
  tool: MissionTool,
  settings: { responseVisibility: string; sensitiveReason?: string | null },
): string | null {
  if (!sensitiveQuestions(tool).length) return null;
  if (settings.responseVisibility !== "organizers")
    return "Questions flagged as sensitive must use organizer-only answers.";
  if ((settings.sensitiveReason || "").trim().length < 20)
    return "Review the flagged questions in the form editor. Remove them or explain why they are necessary before publishing.";
  return null;
}
export function answerNotice(visibility: string, retentionDays: number | null) {
  return {
    version: FORM_NOTICE_VERSION,
    visibility,
    retentionDays,
    text: `${visibility === "members" ? "People with access to this mission" : "Mission organizers and you"} can see your name and answers. ${retentionDays ? `Answers expire ${retentionDays} days after your last save.` : "Answers remain available until you or an organizer delete the mission or response."} You can remove your response earlier.`,
  };
}
export function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[\s]*[=+@\-\t\r]/.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
export const evidenceSchema = z.object({
  note: z.string().trim().min(20).max(2000),
  url: z
    .string()
    .trim()
    .max(2000)
    .default("")
    .refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return (
          ["http:", "https:"].includes(url.protocol) &&
          !url.username &&
          !url.password
        );
      } catch {
        return false;
      }
    }),
});

export function formSettingsFrom(
  run?: {
    responseVisibility?: string;
    retentionDays?: number | null;
    sensitiveReason?: string | null;
  } | null,
): FormSettings {
  return {
    responseVisibility:
      run?.responseVisibility === "members" ? "members" : "organizers",
    retentionDays:
      run?.retentionDays === 30 || run?.retentionDays === 365
        ? run.retentionDays
        : 90,
    sensitiveReason: run?.sensitiveReason || "",
  };
}
