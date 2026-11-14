import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
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
    const { action } = z
      .object({ action: z.enum(["claim", "release", "complete", "reopen"]) })
      .parse(await req.json());
    const task = await db.missionTask.findFirst({
      where: { id: taskId, missionId: id },
    });
    if (!task) throw new MissionError(404, "Task not found.");
    if (action !== "claim" && task.assignedToId !== user.id && !canManage)
      throw new MissionError(
        403,
        "Only the person responsible or a mission manager can change this task.",
      );
    if (action === "claim" && task.status !== "open")
      throw new MissionError(409, "This task has already been picked up.");
    if (action === "complete" && task.status !== "claimed")
      throw new MissionError(409, "Pick up this task before marking it done.");
    if (action === "release" && task.status !== "claimed")
      throw new MissionError(409, "Only a claimed task can be released.");
    if (action === "reopen" && task.status !== "done")
      throw new MissionError(409, "Only a completed task can be reopened.");
    const status =
      action === "claim" ? "claimed" : action === "complete" ? "done" : "open";
    const assignedToId =
      action === "claim"
        ? user.id
        : action === "complete"
          ? task.assignedToId
          : null;
    const changed = await db.missionTask.updateMany({
      where: {
        id: taskId,
        missionId: id,
        status: task.status,
        assignedToId: task.assignedToId,
      },
      data: { status, assignedToId },
    });
    if (!changed.count)
      throw new MissionError(
        409,
        "Someone just changed this task. Refresh and try again.",
      );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return missionFailure(error);
  }
}
