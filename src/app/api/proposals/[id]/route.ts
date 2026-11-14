import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { apiUser, apiFailure, ApiError } from "@/lib/api-server";
import {
  accessProposal,
  proposalResults,
  voteTotals,
} from "@/lib/proposals-server";
import { proposalPatch } from "@/lib/proposal-validation";
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await apiUser();
    const { id } = await params;
    const { canManage } = await accessProposal(id, user.id);
    const proposal = await db.proposal.findUniqueOrThrow({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true, slug: true } },
        votes: {
          where: { voterId: user.id },
          select: {
            id: true,
            option: true,
            voterId: true,
            confidence: true,
            reasoning: true,
          },
        },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { votes: true, comments: true } },
      },
    });
    return NextResponse.json({
      ...proposal,
      canManage,
      voteTotals: voteTotals(await proposalResults([id]), id),
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
    const user = await apiUser();
    const { id } = await params;
    const { canManage } = await accessProposal(id, user.id);
    if (!canManage)
      throw new ApiError(
        403,
        "Only the creator or a community moderator can edit this proposal.",
      );
    const data = proposalPatch.parse(await req.json());
    const { options, closesAt, ...fields } = data;
    const result = await db.$transaction(
      async (tx) => {
        if (
          (await tx.vote.count({ where: { proposalId: id } })) &&
          Object.keys(data).some(key => key !== "status")
        )
          throw new ApiError(
            409,
            "The proposal content and voting rules are locked after the first ballot. You can close or cancel it.",
          );
        return tx.proposal.update({
          where: { id },
          data: {
            ...fields,
            ...(options ? { options: JSON.stringify(options) } : {}),
            ...(closesAt !== undefined
              ? { closesAt: closesAt ? new Date(closesAt) : null }
              : {}),
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json(result);
  } catch (error) {
    return apiFailure(error);
  }
}
