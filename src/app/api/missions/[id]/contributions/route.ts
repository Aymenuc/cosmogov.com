import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { contributionSchema } from "@/lib/missions/validation";
import {
  accessMission,
  missionUser,
  missionFailure,
  MissionError,
} from "@/lib/missions/server";
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await missionUser();
    const { id } = await params;
    await accessMission(id, user.id);
    const data = contributionSchema.parse(await req.json());
    const contribution = await db.$transaction(
      async (tx) => {
        if (
          (await tx.missionContribution.count({ where: { missionId: id } })) >=
          40
        )
          throw new MissionError(
            409,
            "This mission has 40 contributions. Remove outdated input before adding more.",
          );
        const item = await tx.missionContribution.create({
          data: {
            ...data,
            url: data.kind === "source" ? data.url || null : null,
            missionId: id,
            authorId: user.id,
          },
        });
        await tx.mission.update({
          where: { id },
          data: { revision: { increment: 1 } },
        });
        return item;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return NextResponse.json(contribution, { status: 201 });
  } catch (error) {
    return missionFailure(error);
  }
}
