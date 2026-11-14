import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  accessMission,
  missionUser,
  missionFailure,
  missionInclude,
} from "@/lib/missions/server";
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await missionUser();
    const { id } = await params;
    const { canManage } = await accessMission(id, user.id);
    const mission = await db.mission.findUnique({
      where: { id },
      include: missionInclude,
    });
    // A worker interrupted by a platform timeout must not leave a permanent spinner.
    // Published forms remain reachable after they leave the recent-run window.
    const published = await db.missionRun.findMany({
      where: { missionId: id, stage: "tool", acceptedAt: { not: null } },
      orderBy: { createdAt: "desc" },
    });
    const history = [
      ...mission!.runs,
      ...published.filter(
        (run) => !mission!.runs.some((recent) => recent.id === run.id),
      ),
    ];
    const runs = history.map((run) =>
      run.status === "running" &&
      (!mission!.runLeaseUntil || mission!.runLeaseUntil < new Date())
        ? {
            ...run,
            status: "failed",
            error: "This run timed out. You can try again.",
          }
        : run,
    );
    return NextResponse.json({
      ...mission,
      runs,
      canManage,
      searchAvailable:
        process.env.MISSION_WEB_SEARCH === "1" &&
        process.env.Z_AI_USE_OPENAI_COMPAT !== "1" &&
        !/nvidia/i.test(process.env.Z_AI_BASE_URL || ""),
    });
  } catch (error) {
    return missionFailure(error);
  }
}
