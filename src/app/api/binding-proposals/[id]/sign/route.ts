import { NextRequest, NextResponse } from "next/server";
import { requireVerified } from '@/lib/email-verification';
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  apiUser,
  apiFailure,
  ApiError,
  rateLimit,
  canReadProcess,
} from "@/lib/api-server";
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await apiUser();
    requireVerified(user);
    await rateLimit("binding-signature", user.id, 30, 3600);
    const { id } = await params;
    const { comment } = z
      .object({ comment: z.string().trim().max(2000).optional() })
      .parse(await req.json());
    const proposal = await db.bindingProposal.findUnique({
      where: { id },
      include: { process: true },
    });
    if (
      !proposal ||
      (proposal.process && !(await canReadProcess(proposal.process, user.id)))
    )
      throw new ApiError(404, "Proposal not found.");
    const result = await db.$transaction(
      async (tx) => {
        const current = await tx.bindingProposal.update({
          where: { id },
          data: { updatedAt: new Date() },
        });
        if (
          current.status !== "collecting" ||
          (current.closesAt && current.closesAt <= new Date())
        )
          throw new ApiError(
            409,
            "This proposal is no longer collecting signatures.",
          );
        if (
          await tx.bindingProposalSignature.findUnique({
            where: { proposalId_userId: { proposalId: id, userId: user.id } },
          })
        )
          throw new ApiError(409, "You have already signed this proposal.");
        const signature = await tx.bindingProposalSignature.create({
          data: { proposalId: id, userId: user.id, comment: comment || null },
        });
        const verified = await tx.bindingProposalSignature.count({
          where: { proposalId: id, verified: true },
        });
        await tx.bindingProposal.update({
          where: { id },
          data: { signatureCount: verified },
        });
        return {
          signature,
          signatureCount: verified,
          thresholdReached: false,
          awaitingVerification: true,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiFailure(error);
  }
}
