import { NextRequest, NextResponse } from "next/server";
import { requireVerified } from '@/lib/email-verification';
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiUser, apiFailure, ApiError, rateLimit } from "@/lib/api-server";
import { accessProposal } from "@/lib/proposals-server";
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await apiUser();
    requireVerified(user);
    await rateLimit("proposal-vote", user.id, 120, 3600);
    const { id } = await params;
    await accessProposal(id, user.id);
    const data = z
      .object({
        option: z.string().trim().min(1).max(160),
        confidence: z.number().int().min(1).max(5).nullish(),
        reasoning: z.string().trim().max(2000).nullish(),
      })
      .parse(await req.json());
    const vote = await db.$transaction(
      async (tx) => {
        const proposal = await tx.proposal.findUniqueOrThrow({ where: { id } });
        if (
          proposal.status !== "active" ||
          (proposal.closesAt && proposal.closesAt <= new Date())
        )
          throw new ApiError(
            409,
            "Voting is no longer open for this proposal.",
          );
        if (
          !["yes_no", "single_choice", "multiple_choice"].includes(
            proposal.votingType,
          )
        )
          throw new ApiError(
            409,
            "This voting method is not available. The organizer must select a supported method before voting.",
          );
        let options: unknown;
        try {
          options = JSON.parse(proposal.options);
        } catch {
          throw new ApiError(
            409,
            "This proposal’s voting options are unavailable.",
          );
        }
        if (!Array.isArray(options) || !options.includes(data.option))
          throw new ApiError(
            400,
            "Choose one of this proposal’s voting options.",
          );
        return tx.vote.upsert({
          where: { proposalId_voterId: { proposalId: id, voterId: user.id } },
          create: { proposalId: id, voterId: user.id, ...data },
          update: data,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json(vote);
  } catch (error) {
    return apiFailure(error);
  }
}
