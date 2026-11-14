import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  apiUser,
  apiFailure,
  ApiError,
  rateLimit,
  canReadProcess,
} from "@/lib/api-server";
export async function GET(req: NextRequest) {
  try {
    const user = await apiUser();
    const params = req.nextUrl.searchParams;
    const proposals = await db.bindingProposal.findMany({
      where: {
        OR: [
          { processId: null },
          {
            process: {
              OR: [
                { isPublic: true },
                { createdBy: user.id },
                {
                  organization: { memberships: { some: { userId: user.id } } },
                },
              ],
            },
          },
        ],
        ...(params.get("status") && params.get("status") !== "all"
          ? { status: params.get("status")! }
          : {}),
        ...(params.get("category") && params.get("category") !== "all"
          ? { category: params.get("category")! }
          : {}),
        ...(params.get("type") && params.get("type") !== "all"
          ? { type: params.get("type")! }
          : {}),
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        signatures: {
          where: { userId: user.id },
          select: {
            id: true,
            comment: true,
            createdAt: true,
            verified: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        _count: { select: { signatures: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const counts = await db.bindingProposalSignature.groupBy({
      by: ["proposalId"],
      where: { proposalId: { in: proposals.map((p) => p.id) }, verified: true },
      _count: { _all: true },
    });
    const safe = proposals.map((p) => ({
      ...p,
      isBinding: false,
      legalStatus: "not_verified",
      signatureCount:
        counts.find((count) => count.proposalId === p.id)?._count._all || 0,
    }));
    return NextResponse.json({
      proposals: safe,
      stats: {
        activeProposals: safe.filter((p) =>
          [
            "collecting",
            "threshold_reached",
            "government_review",
            "government_response",
            "scheduled_vote",
          ].includes(p.status),
        ).length,
        totalSignatures: safe.reduce((sum, p) => sum + p.signatureCount, 0),
        governmentResponses: safe.filter((p) => p.governmentResponse).length,
        enacted: safe.filter((p) => p.status === "enacted").length,
      },
    });
  } catch (error) {
    return apiFailure(error);
  }
}
export async function POST(req: NextRequest) {
  try {
    const user = await apiUser();
    await rateLimit("binding-create", user.id, 20, 3600);
    const data = z
      .object({
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().min(1).max(20000),
        category: z.string().max(50).nullish(),
        type: z
          .enum(["binding_proposal", "binding_referendum", "citizen_bill"])
          .default("binding_proposal"),
        signatureGoal: z.number().int().min(1).max(10000000).default(5000),
        legalReference: z.string().max(2000).nullish(),
        impactAssessment: z.string().max(10000).nullish(),
        responseDeadline: z.string().datetime().nullish(),
        closesAt: z.string().datetime().nullish(),
        processId: z.string().max(100).nullish(),
      })
      .parse(await req.json());
    if (data.processId) {
      const process = await db.participatoryProcess.findUnique({
        where: { id: data.processId },
      });
      if (!process || !(await canReadProcess(process, user.id)))
        throw new ApiError(404, "Process not found.");
    }
    const proposal = await db.bindingProposal.create({
      data: {
        ...data,
        responseDeadline: data.responseDeadline
          ? new Date(data.responseDeadline)
          : null,
        closesAt: data.closesAt ? new Date(data.closesAt) : null,
        createdBy: user.id,
        isBinding: false,
      },
    });
    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    return apiFailure(error);
  }
}
