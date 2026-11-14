import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/api-server";
import { outputSchema } from "@/lib/missions/validation";
import { templateContentSchema } from "@/lib/missions/templates";
import {
  templateVisibility,
  accessTemplate,
} from "@/lib/missions/coordination-server";
import {
  accessMission,
  missionUser,
  requireManager,
  missionFailure,
  MissionError,
} from "@/lib/missions/server";
export async function GET() {
  try {
    const user = await missionUser();
    return NextResponse.json(
      await db.missionTemplate.findMany({
        where: templateVisibility(user.id),
        include: { organization: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return missionFailure(error);
  }
}
export async function POST(req: NextRequest) {
  try {
    const user = await missionUser();
    await rateLimit("mission-template-create", user.id, 20, 3600);
    const data = z
      .object({
        missionId: z.string().max(100),
        name: z.string().trim().min(1).max(120),
        scope: z.enum(["private", "organization"]).default("private"),
        planRunId: z.string().max(100).nullable().default(null),
        formRunId: z.string().max(100).nullable().default(null),
      })
      .parse(await req.json());
    const { mission, canManage } = await accessMission(data.missionId, user.id);
    requireManager(canManage);
    if (data.scope === "organization" && !mission.organizationId)
      throw new MissionError(
        400,
        "A private mission can save a personal template. Use a community mission for a community template.",
      );
    const runs = await db.missionRun.findMany({
      where: {
        missionId: mission.id,
        id: {
          in: [data.planRunId, data.formRunId].filter(Boolean) as string[],
        },
        acceptedAt: { not: null },
        status: "completed",
      },
    });
    const plan = data.planRunId
      ? runs.find((run) => run.id === data.planRunId && run.stage === "plan")
      : null;
    const form = data.formRunId
      ? runs.find(
          (run) =>
            run.id === data.formRunId &&
            run.stage === "tool" &&
            ["published", "closed"].includes(run.formState),
        )
      : null;
    if (
      (data.planRunId && !plan) ||
      (data.formRunId && !form) ||
      (!plan && !form)
    )
      throw new MissionError(
        400,
        "Choose an adopted plan or published form from this mission.",
      );
    if (
      [plan, form].some((run) => run && run.inputRevision !== mission.revision)
    )
      throw new MissionError(
        409,
        "Context changed after this work was adopted. Review a fresh version before saving a template.",
      );
    const content = templateContentSchema.parse({
      tasks: plan ? outputSchema.parse(plan.output).tasks : [],
      tool: form ? outputSchema.parse(form.output).tool : null,
    });
    const template = await db.missionTemplate.create({
      data: {
        name: data.name,
        goal: mission.goal,
        createdBy: user.id,
        authorName: user.name || "Community member",
        organizationId:
          data.scope === "organization" ? mission.organizationId : null,
        sourceMissionId: mission.id,
        content,
      },
    });
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return missionFailure(error);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    const user = await missionUser();
    const { id } = z
      .object({ id: z.string().max(100) })
      .parse(await req.json());
    const template = await accessTemplate(id, user.id);
    const membership = template.organizationId
      ? await db.membership.findUnique({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId: template.organizationId,
            },
          },
        })
      : null;
    if (
      template.createdBy !== user.id &&
      !["admin", "moderator"].includes(membership?.role || "")
    )
      throw new MissionError(
        403,
        "Only the template author or a community moderator can remove it.",
      );
    await db.missionTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return missionFailure(error);
  }
}
