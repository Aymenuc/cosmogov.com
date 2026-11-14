import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { StickerCounts } from "@/lib/stickers";

/**
 * Counts of the signed-in person's own helpful actions, plus the shared
 * garden for missions they can see. Read-only: nothing is stored, and nothing
 * here counts votes or signatures.
 */
export async function GET() {
  const user = await getSession();
  if (!user)
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    // The same visibility rule the mission list uses.
    const visibleMissions = {
      OR: [
        { createdBy: user.id, organizationId: null },
        { organization: { memberships: { some: { userId: user.id } } } },
      ],
    };
    const [
      missionsStarted,
      communitiesJoined,
      communitiesStarted,
      sourcesAdded,
      viewsAdded,
      tasksPicked,
      tasksDone,
      formsAnswered,
      draftsDecided,
      proposalsOpened,
      commentsWritten,
      gardenTasksDone,
      gardenMissions,
    ] = await Promise.all([
      db.mission.count({ where: { createdBy: user.id } }),
      db.membership.count({ where: { userId: user.id } }),
      db.organization.count({ where: { createdBy: user.id } }),
      db.missionContribution.count({
        where: { authorId: user.id, kind: "source" },
      }),
      db.missionContribution.count({
        where: { authorId: user.id, kind: { in: ["perspective", "constraint"] } },
      }),
      db.missionTask.count({ where: { assignedToId: user.id } }),
      db.missionTask.count({ where: { assignedToId: user.id, status: "done" } }),
      db.missionToolResponse.count({ where: { authorId: user.id } }),
      db.missionRun.count({
        where: { reviewedBy: user.id, acceptedAt: { not: null } },
      }),
      db.proposal.count({ where: { createdBy: user.id } }),
      db.comment.count({ where: { authorId: user.id } }),
      db.missionTask.count({
        where: { status: "done", mission: visibleMissions },
      }),
      db.mission.count({ where: visibleMissions }),
    ]);
    const counts: StickerCounts = {
      missionsStarted,
      communitiesJoined,
      communitiesStarted,
      sourcesAdded,
      viewsAdded,
      tasksPicked,
      tasksDone,
      formsAnswered,
      draftsDecided,
      proposalsOpened,
      commentsWritten,
    };
    return NextResponse.json({
      counts,
      garden: { tasksDone: gardenTasksDone, missions: gardenMissions },
    });
  } catch (error) {
    console.error(
      "Sticker counts failed:",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { error: "Your sticker book is unavailable. Please try again." },
      { status: 503 },
    );
  }
}
