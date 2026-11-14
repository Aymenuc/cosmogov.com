import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { rateLimit } from "@/lib/api-server";
import { accessTemplate } from "@/lib/missions/coordination-server";
import { templateContentSchema } from "@/lib/missions/templates";
import { db } from "@/lib/db";
import { createMissionSchema } from "@/lib/missions/validation";
import {
  missionUser,
  missionFailure,
  MissionError,
} from "@/lib/missions/server";
export async function GET() {
  try {
    const user = await missionUser();
    const missions = await db.mission.findMany({
      where: {
        OR: [
          { createdBy: user.id, organizationId: null },
          { organization: { memberships: { some: { userId: user.id } } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        organization: { select: { name: true, slug: true } },
        _count: { select: { contributions: true, tasks: true } },
        runs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { stage: true, status: true },
        },
      },
    });
    return NextResponse.json(missions);
  } catch (error) {
    return missionFailure(error);
  }
}
export async function POST(req: NextRequest) {
  try {
    const user = await missionUser();
    await rateLimit("mission-create", user.id, 30, 3600);
    const { templateId, ...data } = createMissionSchema.parse(await req.json());
    if (
      data.organizationId &&
      !(await db.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: data.organizationId,
          },
        },
      }))
    )
      throw new MissionError(
        403,
        "Join this community before starting a shared mission.",
      );
    const template = templateId
      ? await accessTemplate(templateId, user.id)
      : null;
    if (
      template?.organizationId &&
      data.organizationId &&
      template.organizationId !== data.organizationId
    )
      throw new MissionError(
        403,
        "A community template can be reused within that community or in your private workspace.",
      );
    const content = template
      ? templateContentSchema.parse(template.content)
      : null;
    const mission = await db.$transaction(
      async (tx) => {
        const mission = await tx.mission.create({
          data: {
            ...data,
            location: data.location || null,
            createdBy: user.id,
            templateId: template?.id,
            templateCredit: template
              ? `${template.name} · shared by ${template.authorName}`
              : null,
          },
        });
        if (content?.tasks.length)
          await tx.missionRun.create({
            data: {
              missionId: mission.id,
              requestedBy: user.id,
              inputRevision: 0,
              stage: "plan",
              origin: "template",
              status: "completed",
              completedAt: new Date(),
              output: {
                headline: "A starting plan for your people",
                summary:
                  "Adapt this template to your mission before adopting its tasks.",
                findings: [],
                questions: [
                  "What needs changing for your people, place and constraints?",
                ],
                tasks: content.tasks,
                tool: null,
              },
            },
          });
        if (content?.tool)
          await tx.missionRun.create({
            data: {
              missionId: mission.id,
              requestedBy: user.id,
              inputRevision: 0,
              stage: "tool",
              origin: "template",
              status: "completed",
              responseVisibility: "organizers",
              retentionDays: 90,
              completedAt: new Date(),
              output: {
                headline: content.tool.title,
                summary:
                  "A form from a community template. Review the wording, privacy settings and fit before publishing.",
                findings: [],
                questions: [],
                tasks: [],
                tool: content.tool,
              },
            },
          });
        return mission;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json(mission, { status: 201 });
  } catch (error) {
    return missionFailure(error);
  }
}
