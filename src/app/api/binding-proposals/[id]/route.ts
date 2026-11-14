import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  apiUser,
  apiAdmin,
  apiFailure,
  ApiError,
  canReadProcess,
} from "@/lib/api-server";
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await apiUser();
    const { id } = await params;
    const proposal = await db.bindingProposal.findUnique({
      where: { id },
      include: {
        process: true,
        creator: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
        signatures: {
          where: { userId: user.id },
          select: {
            id: true,
            comment: true,
            verified: true,
            verifiedAt: true,
            createdAt: true,
            userId: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        _count: { select: { signatures: true } },
      },
    });
    if (
      !proposal ||
      (proposal.process && !(await canReadProcess(proposal.process, user.id)))
    )
      throw new ApiError(404, "Proposal not found.");
    return NextResponse.json({
      proposal: {
        ...proposal,
        process: undefined,
        signatureCount: await db.bindingProposalSignature.count({
          where: { proposalId: id, verified: true },
        }),
        isBinding: false,
        legalStatus: "not_verified",
      },
    });
  } catch (error) {
    return apiFailure(error);
  }
}
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await apiAdmin();
    const { id } = await params;
    const data = z
      .object({
        status: z
          .enum([
            "collecting",
            "threshold_reached",
            "government_review",
            "government_response",
            "scheduled_vote",
            "passed",
            "rejected",
            "enacted",
          ])
          .optional(),
        governmentResponse: z.string().max(20000).optional(),
        voteDate: z.string().datetime().nullish(),
        enactmentDate: z.string().datetime().nullish(),
      })
      .strict()
      .parse(await req.json());
    const current = await db.bindingProposal.findUnique({ where: { id } });
    if (!current) throw new ApiError(404, "Proposal not found.");
    if (
      data.status &&
      ["threshold_reached", "government_review"].includes(data.status) &&
      (await db.bindingProposalSignature.count({
        where: { proposalId: id, verified: true },
      })) < current.signatureGoal
    )
      throw new ApiError(
        409,
        "The reviewed signature threshold has not been reached.",
      );
    const { voteDate, enactmentDate, ...fields } = data;
    return NextResponse.json({
      proposal: await db.bindingProposal.update({
        where: { id },
        data: {
          ...fields,
          ...(data.governmentResponse ? { responseDate: new Date() } : {}),
          ...(voteDate !== undefined
            ? { voteDate: voteDate ? new Date(voteDate) : null }
            : {}),
          ...(enactmentDate !== undefined
            ? { enactmentDate: enactmentDate ? new Date(enactmentDate) : null }
            : {}),
        },
      }),
    });
  } catch (error) {
    return apiFailure(error);
  }
}
