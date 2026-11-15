import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  apiUser,
  apiFailure,
  ApiError,
  rateLimit,
  canReadProcess,
} from "@/lib/api-server";
export async function GET(req: NextRequest) {
  // Signed-in members only.
  const viewer = await getSession();
  if (!viewer) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  try {
    const user = await getSession();
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, Math.min(1000, Number(params.get("page")) || 1)),
      limit = Math.max(1, Math.min(100, Number(params.get("limit")) || 20));
    const processId = params.get("processId");
    const visibility: Prisma.ParticipatoryProcessWhereInput = {
      OR: [
        { isPublic: true },
        ...(user
          ? [
              { createdBy: user.id },
              { organization: { memberships: { some: { userId: user.id } } } },
            ]
          : []),
      ],
    };
    const where: Prisma.BudgetProjectWhereInput = {
      process: visibility,
      ...(processId ? { processId } : {}),
      ...(params.get("category") ? { category: params.get("category")! } : {}),
      ...(params.get("status") ? { status: params.get("status")! } : {}),
    };
    const [projects, total] = await Promise.all([
      db.budgetProject.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, avatarUrl: true } },
          process: {
            select: {
              id: true,
              title: true,
              totalBudget: true,
              currency: true,
              currentPhase: true,
            },
          },
          budgetVotes: {
            where: { userId: user?.id || "" },
            select: { amount: true, userId: true },
          },
          _count: { select: { budgetVotes: true, milestones: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.budgetProject.count({ where }),
    ]);
    const sums = await db.budgetVote.groupBy({
      by: ["projectId"],
      where: { projectId: { in: projects.map((p) => p.id) } },
      _sum: { amount: true },
    });
    const process = processId
      ? await db.participatoryProcess.findFirst({
          where: { id: processId, ...visibility },
        })
      : null;
    const mine =
      process && user
        ? await db.budgetVote.aggregate({
            where: { userId: user.id, project: { processId: process.id } },
            _sum: { amount: true },
          })
        : null;
    const allocated = mine?._sum.amount || 0;
    return NextResponse.json({
      projects: projects.map((project) => ({
        ...project,
        voteCount: project._count.budgetVotes,
        voterCount: project._count.budgetVotes,
        totalAllocated:
          sums.find((sum) => sum.projectId === project.id)?._sum.amount || 0,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      budgetPool: process
        ? {
            total: process.totalBudget,
            currency: process.currency,
            allocated,
            remaining: Math.max(0, process.totalBudget - allocated),
          }
        : null,
    });
  } catch (error) {
    return apiFailure(error);
  }
}
export async function POST(req: NextRequest) {
  try {
    const user = await apiUser();
    await rateLimit("budget-vote", user.id, 120, 3600);
    const { projectId, amount } = z
      .object({
        projectId: z.string().max(100),
        amount: z.number().int().min(0).max(2147483647),
      })
      .parse(await req.json());
    const project = await db.budgetProject.findUnique({
      where: { id: projectId },
      include: { process: true },
    });
    if (!project || !(await canReadProcess(project.process, user.id)))
      throw new ApiError(404, "Budget project not found.");
    const result = await db.$transaction(
      async (tx) => {
        // All allocations in this process lock the same row before checking totals.
        const process = await tx.participatoryProcess.update({
          where: { id: project.processId },
          data: { updatedAt: new Date() },
        });
        if (
          process.currentPhase !== "voting" ||
          process.totalBudget <= 0 ||
          (process.endsAt && process.endsAt <= new Date()) ||
          (process.startsAt && process.startsAt > new Date())
        )
          throw new ApiError(
            409,
            "Budget voting is not open for this process.",
          );
        const allocated = await tx.budgetVote.aggregate({
          where: {
            userId: user.id,
            project: { processId: process.id },
            projectId: { not: projectId },
          },
          _sum: { amount: true },
        });
        if ((allocated._sum.amount || 0) + amount > process.totalBudget)
          throw new ApiError(
            400,
            "Your allocations exceed your allowance. Reduce another allocation first.",
          );
        if (project.budgetRequested > 0 && amount > project.budgetRequested)
          throw new ApiError(
            400,
            "An allocation cannot exceed this project’s requested budget.",
          );
        if (amount === 0)
          await tx.budgetVote.deleteMany({
            where: { projectId, userId: user.id },
          });
        else
          await tx.budgetVote.upsert({
            where: { projectId_userId: { projectId, userId: user.id } },
            create: { projectId, userId: user.id, amount },
            update: { amount },
          });
        await tx.budgetProject.update({
          where: { id: projectId },
          data: {
            voteCount: await tx.budgetVote.count({ where: { projectId } }),
          },
        });
        return {
          amount,
          remaining:
            process.totalBudget - (allocated._sum.amount || 0) - amount,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return apiFailure(error);
  }
}
