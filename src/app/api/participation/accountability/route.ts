import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiUser, apiFailure, ApiError } from "@/lib/api-server";
import { safeSourceUrl } from "@/lib/missions/validation";
const evidenceSchema = z
  .array(
    z.object({
      type: z.string().max(40).default("note"),
      url: z
        .string()
        .max(2000)
        .default("")
        .refine((value) => !value || safeSourceUrl(value)),
      description: z.string().trim().min(1).max(2000),
      date: z.string().max(100).optional(),
    }),
  )
  .max(20);
const include = {
  creator: { select: { id: true, name: true, avatarUrl: true } },
  process: { select: { id: true, title: true, currentPhase: true } },
  proposal: { select: { id: true, title: true } },
  project: { select: { id: true, title: true, budgetRequested: true } },
};
export async function GET(req: NextRequest) {
  try {
    const user = await apiUser();
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, Math.min(1000, Number(params.get("page")) || 1)),
      limit = Math.max(1, Math.min(100, Number(params.get("limit")) || 20));
    const where = {
      process: {
        OR: [
          { isPublic: true },
          { createdBy: user.id },
          { organization: { memberships: { some: { userId: user.id } } } },
        ],
      },
      ...(params.get("processId")
        ? { processId: params.get("processId")! }
        : {}),
      ...(params.get("status") ? { status: params.get("status")! } : {}),
    };
    const [milestones, total, summary] = await Promise.all([
      db.implementationMilestone.findMany({
        where,
        include,
        orderBy: { dueDate: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.implementationMilestone.count({ where }),
      db.implementationMilestone.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
    ]);
    const completed = summary.filter((item) => item.status === "completed");
    const withEvidence = summary.filter((item) => {
      try {
        const evidence = JSON.parse(item.evidence);
        return Array.isArray(evidence) && evidence.length;
      } catch {
        return false;
      }
    });
    const entities = new Map<
      string,
      {
        id: string;
        title: string;
        type: string;
        milestones: typeof milestones;
        overallProgress: number;
        status: string;
      }
    >();
    for (const item of milestones) {
      const entity = item.project || item.proposal || item.process;
      const type = item.project
        ? "project"
        : item.proposal
          ? "proposal"
          : "process";
      const key = `${type}-${entity.id}`;
      if (!entities.has(key))
        entities.set(key, {
          id: entity.id,
          title: entity.title,
          type,
          milestones: [],
          overallProgress: 0,
          status: "on_track",
        });
      entities.get(key)!.milestones.push(item);
    }
    for (const entity of entities.values()) {
      entity.overallProgress = Math.round(
        entity.milestones.reduce((sum, item) => sum + item.progress, 0) /
          entity.milestones.length,
      );
      entity.status = entity.milestones.every(
        (item) => item.status === "completed",
      )
        ? "completed"
        : entity.milestones.some(
              (item) =>
                item.status === "delayed" ||
                (item.dueDate &&
                  item.dueDate < new Date() &&
                  item.status !== "completed"),
            )
          ? "delayed"
          : "on_track";
    }
    return NextResponse.json({
      milestones,
      entities: [...entities.values()],
      total,
      page,
      totalPages: Math.ceil(total / limit),
      statsScope: "Latest 1,000 milestones you can access",
      stats: {
        totalMilestones: summary.length,
        completedMilestones: completed.length,
        delayedMilestones: summary.filter((item) => item.status === "delayed")
          .length,
        transparencyScore: summary.length
          ? Math.round((withEvidence.length / summary.length) * 100)
          : 0,
        onTimeRate: completed.length
          ? Math.round(
              (completed.filter(
                (item) =>
                  item.dueDate &&
                  item.completedAt &&
                  item.completedAt <= item.dueDate,
              ).length /
                completed.length) *
                100,
            )
          : 0,
        overallProgress: summary.length
          ? Math.round(
              summary.reduce((sum, item) => sum + item.progress, 0) /
                summary.length,
            )
          : 0,
      },
    });
  } catch (error) {
    return apiFailure(error);
  }
}
async function processManager(
  processId: string,
  user: { id: string; role: string },
) {
  const process = await db.participatoryProcess.findUnique({
    where: { id: processId },
  });
  if (!process) throw new ApiError(404, "Process not found.");
  if (
    process.createdBy !== user.id &&
    !["admin", "super_admin"].includes(user.role)
  )
    throw new ApiError(
      403,
      "Only the process creator or an administrator can manage milestones.",
    );
}
export async function POST(req: NextRequest) {
  try {
    const user = await apiUser();
    const data = z
      .object({
        processId: z.string().max(100),
        proposalId: z.string().max(100).nullish(),
        projectId: z.string().max(100).nullish(),
        title: z.string().trim().min(1).max(200),
        description: z.string().max(5000).nullish(),
        dueDate: z.string().datetime().nullish(),
      })
      .parse(await req.json());
    await processManager(data.processId, user);
    if (
      data.proposalId &&
      !(await db.processProposal.findFirst({
        where: { id: data.proposalId, processId: data.processId },
      }))
    )
      throw new ApiError(400, "The proposal must belong to this process.");
    if (
      data.projectId &&
      !(await db.budgetProject.findFirst({
        where: { id: data.projectId, processId: data.processId },
      }))
    )
      throw new ApiError(400, "The project must belong to this process.");
    return NextResponse.json(
      {
        milestone: await db.implementationMilestone.create({
          data: {
            ...data,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            createdBy: user.id,
          },
          include,
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    return apiFailure(error);
  }
}
export async function PATCH(req: NextRequest) {
  try {
    const user = await apiUser();
    const { id, evidence, completedAt, ...data } = z
      .object({
        id: z.string().max(100),
        status: z
          .enum(["pending", "in_progress", "completed", "delayed", "cancelled"])
          .optional(),
        progress: z.number().int().min(0).max(100).optional(),
        evidence: evidenceSchema.optional(),
        completedAt: z.string().datetime().optional(),
      })
      .strict()
      .parse(await req.json());
    const milestone = await db.implementationMilestone.findUnique({
      where: { id },
    });
    if (!milestone) throw new ApiError(404, "Milestone not found.");
    await processManager(milestone.processId, user);
    let previousEvidence: unknown;
    try {
      previousEvidence = JSON.parse(milestone.evidence);
    } catch {
      previousEvidence = [];
    }
    const finalEvidence =
      evidence || (Array.isArray(previousEvidence) ? previousEvidence : []);
    if (
      (data.status || milestone.status) === "completed" &&
      !finalEvidence.length
    )
      throw new ApiError(
        400,
        "Add evidence before marking this milestone complete.",
      );
    return NextResponse.json({
      milestone: await db.implementationMilestone.update({
        where: { id },
        data: {
          ...data,
          ...(evidence ? { evidence: JSON.stringify(evidence) } : {}),
          ...(data.status === "completed"
            ? { completedAt: new Date(), progress: 100 }
            : completedAt
              ? { completedAt: new Date(completedAt) }
              : {}),
        },
        include,
      }),
    });
  } catch (error) {
    return apiFailure(error);
  }
}
