import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createMissionSchema } from "@/lib/missions/validation";
import {
  missionUser,
  missionFailure,
  MissionError,
} from "@/lib/missions/server";
export async function GET() {
  try {
    const user = await missionUser();
    const missions = await db.mission.findMany({
      where: {
        OR: [
          { createdBy: user.id, organizationId: null },
          { organization: { memberships: { some: { userId: user.id } } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        organization: { select: { name: true, slug: true } },
        _count: { select: { contributions: true, tasks: true } },
        runs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { stage: true, status: true },
        },
      },
    });
    return NextResponse.json(missions);
  } catch (error) {
    return missionFailure(error);
  }
}
export async function POST(req: NextRequest) {
  try {
    const user = await missionUser();
    const data = createMissionSchema.parse(await req.json());
    if (
      data.organizationId &&
      !(await db.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: data.organizationId,
          },
        },
      }))
    )
      throw new MissionError(
        403,
        "Join this community before starting a shared mission.",
      );
    const mission = await db.mission.create({
      data: { ...data, location: data.location || null, createdBy: user.id },
    });
    return NextResponse.json(mission, { status: 201 });
  } catch (error) {
    return missionFailure(error);
  }
}
