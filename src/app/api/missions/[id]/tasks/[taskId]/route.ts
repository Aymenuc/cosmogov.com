import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { evidenceSchema } from "@/lib/missions/forms";
import {
  accessMission,
  missionUser,
  missionFailure,
  MissionError,
} from "@/lib/missions/server";
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  try {
    const user = await missionUser();
    const { id, taskId } = await params;
    const { canManage } = await accessMission(id, user.id);
    const { action, evidence } = z
      .object({
        action: z.enum(["claim", "release", "complete", "reopen"]),
        evidence: evidenceSchema.optional(),
      })
      .parse(await req.json());
    if (action === "complete" && !evidence)
      throw new MissionError(
        400,
        "Add a completion note or source before marking this task done.",
      );
    await db.$transaction(
      async (tx) => {
        const task = await tx.missionTask.findFirst({
          where: { id: taskId, missionId: id },
        });
        if (!task) throw new MissionError(404, "Task not found.");
        if (action !== "claim" && task.assignedToId !== user.id && !canManage)
          throw new MissionError(
            403,
            "Only the person responsible or a mission manager can change this task.",
          );
        const expected = {
          claim: "open",
          release: "claimed",
          complete: "claimed",
          reopen: "done",
        }[action];
        if (task.status !== expected)
          throw new MissionError(
            409,
            "This task changed. Refresh before updating it.",
          );
        const changed = await tx.missionTask.updateMany({
          where: {
            id: taskId,
            missionId: id,
            status: expected,
            assignedToId: task.assignedToId,
          },
          data: {
            status:
              action === "claim"
                ? "claimed"
                : action === "complete"
                  ? "done"
                  : "open",
            assignedToId:
              action === "claim"
                ? user.id
                : action === "complete"
                  ? task.assignedToId
                  : null,
            ...(evidence
              ? {
                  evidence: [
                    ...(Array.isArray(task.evidence) ? task.evidence : []),
                    {
                      ...evidence,
                      actor: user.name || "Community member",
                      at: new Date().toISOString(),
                    },
                  ],
                }
              : {}),
          },
        });
        if (!changed.count)
          throw new MissionError(
            409,
            "Someone just changed this task. Refresh and try again.",
          );
        await tx.missionEvent.create({
          data: {
            missionId: id,
            taskId,
            actorId: user.id,
            action: `task_${action}`,
            detail: { evidenceAdded: Boolean(evidence) },
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
