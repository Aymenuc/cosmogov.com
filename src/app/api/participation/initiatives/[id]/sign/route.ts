import { NextRequest, NextResponse } from "next/server";
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
    await rateLimit("initiative-signature", user.id, 30, 3600);
    const { id } = await params;
    const { comment } = z
      .object({ comment: z.string().trim().max(2000).optional() })
      .parse(await req.json());
    const initiative = await db.citizenInitiative.findUnique({
      where: { id },
      include: { process: true },
    });
    if (
      !initiative ||
      (initiative.process &&
        !(await canReadProcess(initiative.process, user.id)))
    )
      throw new ApiError(404, "Initiative not found.");
    const result = await db.$transaction(
      async (tx) => {
        const current = await tx.citizenInitiative.update({
          where: { id },
          data: { updatedAt: new Date() },
        });
        if (
          !["collecting", "threshold_reached"].includes(current.status) ||
          (current.closesAt && current.closesAt <= new Date())
        )
          throw new ApiError(
            409,
            "This initiative is no longer accepting signatures.",
          );
        const signature = await tx.initiativeSignature.create({
          data: { initiativeId: id, userId: user.id, comment: comment || null },
        });
        const count = await tx.initiativeSignature.count({
          where: { initiativeId: id },
        });
        const reached = count >= current.signatureGoal;
        await tx.citizenInitiative.update({
          where: { id },
          data: {
            signatureCount: count,
            status: reached ? "threshold_reached" : "collecting",
          },
        });
        return { signature, signatureCount: count, thresholdReached: reached };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiFailure(error);
  }
}
