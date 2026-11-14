import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { runSchema } from "@/lib/missions/validation";
import {
  accessMission,
  missionUser,
  missionFailure,
  requireManager,
  MissionError,
} from "@/lib/missions/server";
import { generateMissionOutput, searchMissionSources } from "@/lib/missions/ai";
import type { Evidence } from "@/lib/missions/types";
export const maxDuration = 120;
async function bounded<T>(
  promise: Promise<T>,
  milliseconds: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("AI deadline exceeded")),
          milliseconds,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let runId: string | undefined;
  let missionId: string | undefined;
  let lease: Date | undefined;
  try {
    const user = await missionUser();
    const { id } = await params;
    missionId = id;
    const { canManage } = await accessMission(id, user.id);
    requireManager(canManage);
    const { stage, webSearch } = runSchema.parse(await req.json());
    const now = new Date();
    lease = new Date(now.getTime() + 110_000);
    const reserved = await db.$transaction(
      async (tx) => {
        if (
          (await tx.missionRun.count({
            where: {
              requestedBy: user.id,
              origin: "ai",
              createdAt: { gt: new Date(now.getTime() - 3_600_000) },
            },
          })) >= 12
        )
          throw new MissionError(
            429,
            "You have started 12 AI runs this hour. Please try again later.",
          );
        const locked = await tx.mission.updateMany({
          where: {
            id,
            OR: [{ runLeaseUntil: null }, { runLeaseUntil: { lt: now } }],
          },
          data: { runLeaseUntil: lease },
        });
        if (!locked.count)
          throw new MissionError(
            409,
            "An AI step is already working on this mission.",
          );
        await tx.missionRun.updateMany({
          where: { missionId: id, status: "running" },
          data: {
            status: "failed",
            completedAt: now,
            error: "This run timed out. You can try again.",
          },
        });
        const mission = await tx.mission.findUniqueOrThrow({
          where: { id },
          include: {
            contributions: {
              include: { author: { select: { name: true } } },
              orderBy: { createdAt: "asc" },
            },
            runs: {
              where: { status: "completed" },
              orderBy: { createdAt: "desc" },
              take: 20,
            },
          },
        });
        const run = await tx.missionRun.create({
          data: {
            missionId: id,
            requestedBy: user.id,
            stage,
            inputRevision: mission.revision,
          },
        });
        return { mission, run };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    runId = reserved.run.id;
    const { mission } = reserved;
    let sources: Evidence[] = mission.contributions.map((item) => ({
      id: item.id,
      title: item.title,
      text: item.content,
      kind: item.kind as Evidence["kind"],
      ...(item.url ? { url: item.url } : {}),
      author: item.author.name || "Community member",
    }));
    const seenStages = new Set<string>();
    const stages = ["research", "perspectives", "plan", "tool"];
    const previous = mission.runs.filter((run) => {
      if (
        run.inputRevision !== mission.revision ||
        stages.indexOf(run.stage) >= stages.indexOf(stage) ||
        seenStages.has(run.stage)
      )
        return false;
      seenStages.add(run.stage);
      return true;
    });
    if (stage !== "research") {
      for (const run of previous)
        for (const source of run.sources as unknown as Evidence[])
          if (!sources.some((s) => s.id === source.id)) sources.push(source);
    }
    let searchStatus = "not_requested";
    if (webSearch && stage === "research") {
      try {
        const web = await bounded(
          searchMissionSources(`${mission.title} ${mission.location || ""}`),
          20_000,
        );
        sources = [
          ...sources,
          ...web.map((item) => ({ ...item, id: `${runId}-${item.id}` })),
        ];
        searchStatus = web.length ? "completed" : "empty";
      } catch {
        searchStatus = "unavailable";
      }
    }
    await db.missionRun.update({
      where: { id: runId },
      data: {
        sources: sources as unknown as Prisma.InputJsonValue,
        searchStatus,
      },
    });
    const output = await bounded(
      generateMissionOutput({
        stage,
        title: mission.title,
        goal: mission.goal,
        location: mission.location,
        sources,
        previous: previous.map((run) => ({
          stage: run.stage,
          output: run.output,
        })),
      }),
      70_000,
    );
    await db.$transaction([
      db.missionRun.update({
        where: { id: runId },
        data: { output, status: "completed", completedAt: new Date() },
      }),
      db.mission.updateMany({
        where: { id, runLeaseUntil: lease },
        data: { runLeaseUntil: null },
      }),
    ]);
    return NextResponse.json({ id: runId, status: "completed" });
  } catch (error) {
    if (runId) {
      // Output is never replaced by canned content if the provider fails.
      await db
        .$transaction([
          db.missionRun.update({
            where: { id: runId },
            data: {
              status: "failed",
              error:
                "The AI step could not finish. Your contributions are saved; please try again.",
              completedAt: new Date(),
            },
          }),
          db.mission.updateMany({
            where: { id: missionId, runLeaseUntil: lease },
            data: { runLeaseUntil: null },
          }),
        ])
        .catch(() => {});
      return NextResponse.json(
        {
          error:
            "The AI step could not finish. Your contributions are saved; please try again.",
        },
        { status: 503 },
      );
    }
    return missionFailure(error);
  }
}
