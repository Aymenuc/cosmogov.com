import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formDraftSchema, outputSchema } from "@/lib/missions/validation";
import {
  accessMission,
  missionUser,
  missionFailure,
  requireManager,
  MissionError,
} from "@/lib/missions/server";

// Each save creates an immutable draft. Published versions and their answers stay intact.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await missionUser();
    const { id } = await params;
    const { canManage } = await accessMission(id, user.id);
    requireManager(canManage);
    const { tool, sourceRunId, inputRevision } = formDraftSchema.parse(
      await req.json(),
    );
    const draft = await db.$transaction(
      async (tx) => {
        const mission = await tx.mission.findUniqueOrThrow({ where: { id } });
        if (mission.revision !== inputRevision)
          throw new MissionError(
            409,
            "The mission context changed. Reload it before saving your form.",
          );
        const count = await tx.missionRun.count({
          where: {
            requestedBy: user.id,
            origin: { in: ["manual", "edited"] },
            createdAt: { gt: new Date(Date.now() - 3_600_000) },
          },
        });
        if (count >= 60)
          throw new MissionError(
            429,
            "You have saved 60 form drafts this hour. Please try again later.",
          );
        const source = sourceRunId
          ? await tx.missionRun.findFirst({
              where: {
                id: sourceRunId,
                missionId: id,
                stage: "tool",
                status: "completed",
              },
            })
          : null;
        if (sourceRunId && !source)
          throw new MissionError(404, "The original form was not found.");
        if (source && source.inputRevision !== mission.revision)
          throw new MissionError(
            409,
            "This form uses earlier mission context. Generate a fresh draft or start a new form.",
          );
        const previous = source ? outputSchema.parse(source.output) : null;
        const output = outputSchema.parse({
          headline: tool.title,
          summary: tool.description,
          findings: previous?.findings || [],
          questions: previous?.questions || [],
          tasks: [],
          tool,
        });
        const run = await tx.missionRun.create({
          data: {
            missionId: id,
            requestedBy: user.id,
            stage: "tool",
            status: "completed",
            inputRevision,
            origin: source && source.origin !== "manual" ? "edited" : "manual",
            derivedFromId: source?.id,
            sources: (source?.sources || []) as Prisma.InputJsonValue,
            output: output as unknown as Prisma.InputJsonValue,
            completedAt: new Date(),
          },
        });
        await tx.mission.update({
          where: { id },
          data: { updatedAt: new Date() },
        });
        return run;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json({ id: draft.id }, { status: 201 });
  } catch (error) {
    return missionFailure(error);
  }
}
