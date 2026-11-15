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
      home,
      ownCityProposals,
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
      db.user.findUnique({
        where: { id: user.id },
        select: { cityId: true, cityName: true, countryName: true, latitude: true, longitude: true },
      }),
      db.proposal.findMany({
        where: { createdBy: user.id, cityId: { not: null } },
        select: { cityId: true, createdAt: true },
        orderBy: { createdAt: "asc" },
        take: 50,
      }),
    ]);

    // A "local spark" is a proposal of yours that was the first in its city.
    const firstCities = new Set<string>();
    for (const proposal of ownCityProposals) {
      const cityId = proposal.cityId as string;
      if (firstCities.has(cityId)) continue;
      const earlier = await db.proposal.count({
        where: { cityId, createdAt: { lt: proposal.createdAt } },
      });
      if (earlier === 0) firstCities.add(cityId);
    }

    const hasHome = Boolean(home?.cityId && home.latitude !== null && home.longitude !== null);
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
      homeSet: hasHome ? 1 : 0,
      localSparks: firstCities.size,
    };
    return NextResponse.json({
      counts,
      garden: { tasksDone: gardenTasksDone, missions: gardenMissions },
      home: hasHome
        ? {
            cityName: home!.cityName,
            countryName: home!.countryName,
            latitude: home!.latitude,
            longitude: home!.longitude,
          }
        : null,
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
