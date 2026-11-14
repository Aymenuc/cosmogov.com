import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/api-server";
import { outputSchema } from "@/lib/missions/validation";
import { answerNotice, FORM_NOTICE_VERSION } from "@/lib/missions/forms";
import {
  accessMission,
  missionUser,
  missionFailure,
  MissionError,
} from "@/lib/missions/server";
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> },
) {
  try {
    const user = await missionUser();
    const { id, runId } = await params;
    await accessMission(id, user.id);
    await rateLimit("mission-response", user.id, 120, 3600);
    const { values, offerToHelp } = z
      .object({
        values: z.record(z.string(), z.string().trim().max(500)),
        offerToHelp: z.boolean().default(false),
      })
      .parse(await req.json());
    await db.$transaction(
      async (tx) => {
        const run = await tx.missionRun.findFirst({
          where: {
            id: runId,
            missionId: id,
            stage: "tool",
            status: "completed",
            acceptedAt: { not: null },
          },
        });
        if (!run || run.formState === "unpublished")
          throw new MissionError(404, "Published form not found.");
        if (run.formState !== "published")
          throw new MissionError(
            409,
            "This form is closed to answers. You can still remove your response.",
          );
        const tool = outputSchema.parse(run.output).tool;
        if (!tool) throw new MissionError(404, "Form not found.");
        const known = new Set(tool.fields.map((field) => field.id));
        if (Object.keys(values).some((key) => !known.has(key)))
          throw new MissionError(400, "The form includes an unknown field.");
        for (const field of tool.fields) {
          const value = values[field.id] || "";
          if (
            (field.required && !value) ||
            (value && field.kind === "choice" && !field.options.includes(value))
          )
            throw new MissionError(400, `Please check: ${field.label}`);
        }
        const expiresAt = run.retentionDays
          ? new Date(Date.now() + run.retentionDays * 86400000)
          : null;
        const notice = answerNotice(run.responseVisibility, run.retentionDays);
        const data = {
          values,
          offerToHelp,
          expiresAt,
          noticeVersion: FORM_NOTICE_VERSION,
          notice: notice as Prisma.InputJsonValue,
        };
        const saved = await tx.missionToolResponse.upsert({
          where: { runId_authorId: { runId, authorId: user.id } },
          create: { missionId: id, runId, authorId: user.id, ...data },
          update: data,
        });
        if (!offerToHelp)
          await tx.missionMatch.updateMany({
            where: { responseId: saved.id, status: "invited" },
            data: { status: "withdrawn", respondedAt: new Date() },
          });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return missionFailure(error);
  }
}
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> },
) {
  try {
    const user = await missionUser();
    const { id, runId } = await params;
    await accessMission(id, user.id);
    await db.missionToolResponse.deleteMany({
      where: { missionId: id, runId, authorId: user.id },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return missionFailure(error);
  }
}
