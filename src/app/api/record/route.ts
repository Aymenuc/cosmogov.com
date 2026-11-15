import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * The signed-in person's civic record: what they contributed, from their own
 * records, for a printable page they can use as proof of volunteering.
 * Read-only, only ever about the person asking, and nothing about how anyone
 * voted or what they signed.
 */
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    const [
      profile,
      tasks,
      missions,
      communitiesStarted,
      communitiesJoined,
      sourcesAdded,
      viewsAdded,
      formsAnswered,
      draftsDecided,
      proposals,
      commentsWritten,
    ] = await Promise.all([
      db.user.findUnique({
        where: { id: user.id },
        select: { name: true, createdAt: true, cityName: true, countryName: true },
      }),
      db.missionTask.findMany({
        where: { assignedToId: user.id, status: "done" },
        select: {
          id: true,
          title: true,
          minutes: true,
          updatedAt: true,
          mission: { select: { title: true, organization: { select: { name: true } } } },
          events: {
            where: { action: "task_complete", actorId: user.id },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
      db.mission.findMany({
        where: { createdBy: user.id },
        select: { id: true, title: true, createdAt: true, organization: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.organization.findMany({
        where: { createdBy: user.id },
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.membership.count({ where: { userId: user.id } }),
      db.missionContribution.count({ where: { authorId: user.id, kind: "source" } }),
      db.missionContribution.count({
        where: { authorId: user.id, kind: { in: ["perspective", "constraint"] } },
      }),
      db.missionToolResponse.count({ where: { authorId: user.id } }),
      db.missionRun.count({ where: { reviewedBy: user.id, acceptedAt: { not: null } } }),
      db.proposal.findMany({
        where: { createdBy: user.id },
        select: { id: true, title: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.comment.count({ where: { authorId: user.id } }),
    ]);

    const finished = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      mission: task.mission.title,
      community: task.mission.organization?.name ?? null,
      minutes: task.minutes,
      finishedAt: (task.events[0]?.createdAt ?? task.updatedAt).toISOString(),
    }));

    return NextResponse.json({
      person: {
        name: profile?.name || user.name || null,
        memberSince: profile?.createdAt.toISOString() ?? null,
        place: [profile?.cityName, profile?.countryName].filter(Boolean).join(", ") || null,
      },
      tasks: finished,
      estimatedMinutes: finished.reduce((sum, task) => sum + (task.minutes > 0 ? task.minutes : 0), 0),
      missions: missions.map((m) => ({
        id: m.id,
        title: m.title,
        community: m.organization?.name ?? null,
        startedAt: m.createdAt.toISOString(),
      })),
      communitiesStarted: communitiesStarted.map((c) => ({
        id: c.id,
        name: c.name,
        startedAt: c.createdAt.toISOString(),
      })),
      proposals: proposals.map((p) => ({ id: p.id, title: p.title, openedAt: p.createdAt.toISOString() })),
      counts: { communitiesJoined, sourcesAdded, viewsAdded, formsAnswered, draftsDecided, commentsWritten },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Civic record failed:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { error: "Your civic record is unavailable. Please try again." },
      { status: 503 },
    );
  }
}
