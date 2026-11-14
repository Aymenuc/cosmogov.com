import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { outputSchema } from "@/lib/missions/validation";
import {
  accessMission,
  missionUser,
  missionFailure,
  requireManager,
  MissionError,
} from "@/lib/missions/server";
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> },
) {
  try {
    const user = await missionUser();
    const { id, runId } = await params;
    const { canManage } = await accessMission(id, user.id);
    requireManager(canManage);
    await db.$transaction(
      async (tx) => {
        const mission = await tx.mission.findUniqueOrThrow({ where: { id } });
        const run = await tx.missionRun.findFirst({
          where: {
            id: runId,
            missionId: id,
            stage: { in: ["plan", "tool"] },
            status: "completed",
          },
        });
        if (!run)
          throw new MissionError(404, "Completed plan or tool not found.");
        if (run.acceptedAt)
          throw new MissionError(409, "This output has already been adopted.");
        if (run.inputRevision !== mission.revision)
          throw new MissionError(
            409,
            "People have added or removed input. Generate a fresh output before adopting it.",
          );
        const output = outputSchema.parse(run.output);
        if (run.stage === "plan" && !output.tasks.length)
          throw new MissionError(409, "This plan has no tasks to adopt.");
        if (run.stage === "tool" && !output.tool)
          throw new MissionError(409, "This output has no form to publish.");
        await tx.missionRun.update({
          where: { id: runId },
          data: { acceptedAt: new Date(), reviewedBy: user.id },
        });
        if (run.stage === "plan")
          await tx.missionTask.createMany({
            data: output.tasks.map((task, position) => ({
              ...task,
              position,
              missionId: id,
              runId,
            })),
          });
        await tx.mission.update({
          where: { id },
          data: { updatedAt: new Date() },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return missionFailure(error);
  }
}
