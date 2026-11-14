import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  accessMission,
  missionUser,
  missionFailure,
  missionInclude,
  requireManager,
  MissionError,
} from "@/lib/missions/server";
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await missionUser();
    const { id } = await params;
    const { canManage } = await accessMission(id, user.id);
    const now = new Date();
    await db.missionToolResponse.deleteMany({
      where: { missionId: id, expiresAt: { lte: now } },
    });
    const allowedAnswers: Prisma.MissionToolResponseWhereInput = {
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      ...(!canManage
        ? {
            AND: [
              {
                OR: [
                  { authorId: user.id },
                  {
                    run: {
                      responseVisibility: "members",
                      formState: { in: ["published", "closed"] },
                    },
                  },
                ],
              },
            ],
          }
        : {}),
    };
    const mission = await db.mission.findUniqueOrThrow({
      where: { id },
      include: {
        ...missionInclude,
        toolResponses: {
          ...missionInclude.toolResponses,
          where: allowedAnswers,
        },
      },
    });
    const forms = await db.missionRun.findMany({
      where: {
        missionId: id,
        OR: [
          { stage: "plan", acceptedAt: { not: null } },
          {
            stage: "tool",
            OR: [
              { formState: { in: ["published", "closed"] } },
              ...(canManage
                ? [{ formState: "unpublished" }]
                : [{ toolResponses: { some: { authorId: user.id } } }]),
            ],
          },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    const history = [
      ...mission.runs,
      ...forms.filter(
        (run) => !mission.runs.some((recent) => recent.id === run.id),
      ),
    ].filter(
      (run) =>
        canManage ||
        run.formState !== "unpublished" ||
        mission.toolResponses.some(
          (response) =>
            response.runId === run.id && response.authorId === user.id,
        ),
    );
    const reviewers = await db.user.findMany({
      where: {
        id: {
          in: [
            ...new Set(
              history.flatMap((run) =>
                run.reviewedBy ? [run.reviewedBy] : [],
              ),
            ),
          ],
        },
      },
      select: { id: true, name: true },
    });
    const counts = await db.missionToolResponse.groupBy({
      by: ["runId"],
      where: {
        missionId: id,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      _count: { _all: true },
    });
    const runs = history.map((run) => ({
      ...run,
      responseCount:
        counts.find((count) => count.runId === run.id)?._count._all || 0,
      reviewerName:
        reviewers.find((person) => person.id === run.reviewedBy)?.name || null,
      ...(run.status === "running" &&
      (!mission.runLeaseUntil || mission.runLeaseUntil < now)
        ? { status: "failed", error: "This run timed out. You can try again." }
        : {}),
    }));
    return NextResponse.json(
      {
        ...mission,
        runs,
        canManage,
        searchAvailable:
          process.env.MISSION_WEB_SEARCH === "1" &&
          process.env.Z_AI_USE_OPENAI_COMPAT !== "1" &&
          !/nvidia/i.test(process.env.Z_AI_BASE_URL || ""),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return missionFailure(error);
  }
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await missionUser();
    const { id } = await params;
    const { mission, canManage } = await accessMission(id, user.id);
    requireManager(canManage);
    const { confirmation } = z
      .object({ confirmation: z.string().max(200) })
      .parse(await req.json());
    if (confirmation !== mission.title)
      throw new MissionError(
        400,
        "Type the mission title exactly to confirm deletion.",
      );
    await db.$transaction(
      async (tx) => {
        const current = await tx.mission.findUniqueOrThrow({ where: { id } });
        if (current.runLeaseUntil && current.runLeaseUntil > new Date())
          throw new MissionError(
            409,
            "Wait for the active AI step to finish before deleting this mission.",
          );
        await tx.mission.delete({ where: { id } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return missionFailure(error);
  }
}
