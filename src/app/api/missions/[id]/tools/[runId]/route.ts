import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { outputSchema } from "@/lib/missions/validation";
import { formReviewError } from "@/lib/missions/forms";
import {
  accessMission,
  missionUser,
  requireManager,
  missionFailure,
  MissionError,
} from "@/lib/missions/server";
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> },
) {
  try {
    const user = await missionUser();
    const { id, runId } = await params;
    const { canManage } = await accessMission(id, user.id);
    requireManager(canManage);
    const { action } = z
      .object({ action: z.enum(["close", "unpublish", "reopen"]) })
      .strict()
      .parse(await req.json());
    await db.$transaction(
      async (tx) => {
        const run = await tx.missionRun.findFirst({
          where: {
            id: runId,
            missionId: id,
            stage: "tool",
            acceptedAt: { not: null },
          },
        });
        if (!run) throw new MissionError(404, "Published form not found.");
        const mission = await tx.mission.findUniqueOrThrow({ where: { id } });
        if (action === "close" && run.formState !== "published")
          throw new MissionError(409, "Only an open form can be closed.");
        if (
          action === "unpublish" &&
          !["published", "closed"].includes(run.formState)
        )
          throw new MissionError(409, "This form is already unpublished.");
        if (action === "reopen") {
          if (!["closed", "unpublished"].includes(run.formState))
            throw new MissionError(409, "This form is already open.");
          if (run.inputRevision !== mission.revision)
            throw new MissionError(
              409,
              "Mission context changed. Create and review a new version before reopening.",
            );
          const tool = outputSchema.parse(run.output).tool;
          if (tool) {
            const error = formReviewError(tool, run);
            if (error) throw new MissionError(400, error);
          }
        }
        await tx.missionRun.update({
          where: { id: runId },
          data: {
            formState:
              action === "close"
                ? "closed"
                : action === "unpublish"
                  ? "unpublished"
                  : "published",
            closedAt: action === "reopen" ? null : new Date(),
            stateChangedBy: user.id,
          },
        });
        await tx.missionEvent.create({
          data: {
            missionId: id,
            runId,
            actorId: user.id,
            action: `form_${action}`,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return missionFailure(error);
  }
}
