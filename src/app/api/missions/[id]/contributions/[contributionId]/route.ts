import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  accessMission,
  missionUser,
  missionFailure,
  MissionError,
} from "@/lib/missions/server";
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contributionId: string }> },
) {
  try {
    const user = await missionUser();
    const { id, contributionId } = await params;
    const { canManage } = await accessMission(id, user.id);
    const contribution = await db.missionContribution.findFirst({
      where: { id: contributionId, missionId: id },
    });
    if (!contribution) throw new MissionError(404, "Contribution not found.");
    if (contribution.authorId !== user.id && !canManage)
      throw new MissionError(
        403,
        "Only the contributor or a mission manager can remove this input.",
      );
    await db.$transaction([
      db.missionContribution.delete({ where: { id: contributionId } }),
      db.mission.update({
        where: { id },
        data: { revision: { increment: 1 } },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return missionFailure(error);
  }
}
