import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiAdmin, apiFailure, ApiError, rateLimit } from "@/lib/api-server";
export async function GET() {
  try {
    await apiAdmin();
    return NextResponse.json(
      await db.bindingProposalSignature.findMany({
        include: {
          user: { select: { name: true, email: true } },
          proposal: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    );
  } catch (error) {
    return apiFailure(error);
  }
}
export async function PATCH(req: NextRequest) {
  try {
    const admin = await apiAdmin();
    await rateLimit("signature-review", admin.id, 120, 3600);
    const { id, verified, reason } = z
      .object({
        id: z.string().max(100),
        verified: z.boolean(),
        reason: z.string().trim().min(10).max(1000),
      })
      .parse(await req.json());
    await db.$transaction(
      async (tx) => {
        const signature = await tx.bindingProposalSignature.findUnique({
          where: { id },
        });
        if (!signature) throw new ApiError(404, "Signature not found.");
        const proposal = await tx.bindingProposal.update({
          where: { id: signature.proposalId },
          data: { updatedAt: new Date() },
        });
        await tx.bindingProposalSignature.update({
          where: { id },
          data: {
            verified,
            verifiedAt: verified ? new Date() : null,
            verificationNote: `Reviewed by ${admin.id}: ${reason}`,
          },
        });
        const count = await tx.bindingProposalSignature.count({
          where: { proposalId: proposal.id, verified: true },
        });
        await tx.bindingProposal.update({
          where: { id: proposal.id },
          data: {
            signatureCount: count,
            ...(["collecting", "threshold_reached"].includes(proposal.status)
              ? {
                  status:
                    count >= proposal.signatureGoal
                      ? "threshold_reached"
                      : "collecting",
                }
              : {}),
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiFailure(error);
  }
}
