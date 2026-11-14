import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/api-server";
import { sharedOfferTerms } from "@/lib/missions/matching";
import {
  accessMission,
  missionUser,
  missionFailure,
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
    const { mission, canManage } = await accessMission(id, user.id);
    const [tasks, responses, invites] = await Promise.all([
      db.missionTask.findMany({
        where: { missionId: id, status: "open" },
        orderBy: { position: "asc" },
        take: 100,
      }),
      db.missionToolResponse.findMany({
        where: {
          missionId: id,
          offerToHelp: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          run: { formState: { in: ["published", "closed"] } },
          ...(mission.organizationId
            ? {
                author: {
                  memberships: {
                    some: { organizationId: mission.organizationId },
                  },
                },
              }
            : {}),
          ...(!canManage ? { authorId: user.id } : {}),
        },
        include: { author: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
      db.missionMatch.findMany({
        where: {
          missionId: id,
          ...(!canManage ? { response: { authorId: user.id } } : {}),
        },
        include: {
          task: { select: { title: true, status: true } },
          response: {
            select: { authorId: true, author: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);
    const suggestions = tasks
      .flatMap((task) =>
        responses.flatMap((response) => {
          if (
            invites.some(
              (invite) =>
                invite.taskId === task.id && invite.responseId === response.id,
            )
          )
            return [];
          const terms = sharedOfferTerms(
            task,
            response.values as Record<string, string>,
          );
          return terms.length
            ? [
                {
                  taskId: task.id,
                  taskTitle: task.title,
                  responseId: response.id,
                  respondent: response.author.name || "Community member",
                  authorId: response.authorId,
                  terms,
                },
              ]
            : [];
        }),
      )
      .slice(0, 50);
    return NextResponse.json(
      {
        suggestions,
        invites: invites.map((invite) => ({
          id: invite.id,
          taskId: invite.taskId,
          responseId: invite.responseId,
          taskTitle: invite.task.title,
          taskStatus: invite.task.status,
          respondent: invite.response.author.name || "Community member",
          authorId: invite.response.authorId,
          terms: invite.terms,
          status: invite.status,
        })),
        canManage,
        limited:
          tasks.length >= 100 ||
          responses.length >= 200 ||
          suggestions.length >= 50,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return missionFailure(error);
  }
}
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await missionUser();
    const { id } = await params;
    const { canManage } = await accessMission(id, user.id);
    requireManager(canManage);
    await rateLimit("mission-match-invite", user.id, 30, 3600);
    const { taskId, responseId } = z
      .object({ taskId: z.string().max(100), responseId: z.string().max(100) })
      .parse(await req.json());
    await db.$transaction(
      async (tx) => {
        const [task, response] = await Promise.all([
          tx.missionTask.findFirst({
            where: { id: taskId, missionId: id, status: "open" },
          }),
          tx.missionToolResponse.findFirst({
            where: {
              id: responseId,
              missionId: id,
              offerToHelp: true,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              run: { formState: { in: ["published", "closed"] } },
            },
          }),
        ]);
        if (!task || !response)
          throw new MissionError(
            409,
            "This task or offer is no longer available.",
          );
        const member = await tx.membership.findFirst({
          where: {
            userId: response.authorId,
            organization: { missions: { some: { id } } },
          },
        });
        const mission = await tx.mission.findUniqueOrThrow({ where: { id } });
        if (mission.organizationId && !member)
          throw new MissionError(
            409,
            "This person is no longer in the community.",
          );
        const terms = sharedOfferTerms(
          task,
          response.values as Record<string, string>,
        );
        if (!terms.length)
          throw new MissionError(
            409,
            "This offer no longer shares a task term. Review it again.",
          );
        await tx.missionMatch.create({
          data: {
            missionId: id,
            taskId,
            responseId,
            invitedBy: user.id,
            terms,
          },
        });
        await tx.notification.create({
          data: {
            userId: response.authorId,
            type: "system",
            title: "An invitation to help",
            message: `${user.name || "A mission organizer"} invited you to consider “${task.title}”. You decide whether to accept.`,
            link: `/dashboard/missions/${id}`,
          },
        });
        await tx.missionEvent.create({
          data: {
            missionId: id,
            taskId,
            actorId: user.id,
            action: "match_invited",
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return missionFailure(error);
  }
}
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await missionUser();
    const { id } = await params;
    const { canManage } = await accessMission(id, user.id);
    const { matchId, action } = z
      .object({
        matchId: z.string().max(100),
        action: z.enum(["accept", "decline", "withdraw"]),
      })
      .parse(await req.json());
    await db.$transaction(
      async (tx) => {
        const match = await tx.missionMatch.findFirst({
          where: { id: matchId, missionId: id },
          include: { response: { include: { run: true } } },
        });
        if (!match || match.status !== "invited")
          throw new MissionError(409, "This invitation is no longer pending.");
        if (
          action === "withdraw"
            ? !canManage
            : match.response.authorId !== user.id
        )
          throw new MissionError(
            403,
            "Only the invited person can accept or decline.",
          );
        if (action === "accept") {
          if (
            !match.response.offerToHelp ||
            (match.response.expiresAt &&
              match.response.expiresAt <= new Date()) ||
            !["published", "closed"].includes(match.response.run.formState)
          )
            throw new MissionError(409, "This offer is no longer active.");
          const task = await tx.missionTask.updateMany({
            where: {
              id: match.taskId,
              missionId: id,
              status: "open",
              assignedToId: null,
            },
            data: { status: "claimed", assignedToId: user.id },
          });
          if (!task.count)
            throw new MissionError(
              409,
              "This task has already been picked up.",
            );
          await tx.missionEvent.create({
            data: {
              missionId: id,
              taskId: match.taskId,
              actorId: user.id,
              action: "task_claim",
              detail: { viaInvitation: true },
            },
          });
        }
        await tx.missionMatch.update({
          where: { id: matchId },
          data: {
            status:
              action === "accept"
                ? "accepted"
                : action === "decline"
                  ? "declined"
                  : "withdrawn",
            respondedAt: new Date(),
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
