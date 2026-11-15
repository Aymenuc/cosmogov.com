import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * Where the shared garden blooms: for missions the signed-in person can see,
 * finished tasks grouped by the community's place on the map. Same visibility
 * rule as the mission list and the sticker garden. Counts only; no names of
 * who did what.
 */
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    const missions = await db.mission.findMany({
      where: {
        organization: {
          memberships: { some: { userId: user.id } },
          latitude: { not: null },
          longitude: { not: null },
        },
      },
      select: {
        organizationId: true,
        organization: { select: { name: true, cityName: true, latitude: true, longitude: true } },
        _count: { select: { tasks: { where: { status: "done" } } } },
      },
      take: 500,
    });

    const byCommunity = new Map<
      string,
      { id: string; name: string; cityName: string | null; latitude: number; longitude: number; tasksDone: number; missions: number }
    >();
    for (const mission of missions) {
      const org = mission.organization;
      if (!mission.organizationId || !org || org.latitude === null || org.longitude === null) continue;
      const entry = byCommunity.get(mission.organizationId) ?? {
        id: mission.organizationId,
        name: org.name,
        cityName: org.cityName,
        latitude: org.latitude,
        longitude: org.longitude,
        tasksDone: 0,
        missions: 0,
      };
      entry.tasksDone += mission._count.tasks;
      entry.missions += 1;
      byCommunity.set(mission.organizationId, entry);
    }

    return NextResponse.json({ blooms: [...byCommunity.values()] });
  } catch (error) {
    console.error("Map blooms failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ blooms: [] }, { status: 503 });
  }
}
