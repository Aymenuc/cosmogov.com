import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { missionVisibility } from "@/lib/missions/coordination-server";
import { missionUser, missionFailure } from "@/lib/missions/server";
export async function GET() {
  try {
    const user = await missionUser();
    const [tasks, requests] = await Promise.all([
      db.missionTask.findMany({
        where: {
          status: "done",
          evidence: { not: [] },
          mission: missionVisibility(user.id),
        },
        select: {
          id: true,
          title: true,
          evidence: true,
          updatedAt: true,
          assignee: { select: { name: true } },
          mission: { select: { id: true, title: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
      db.bindingProposal.findMany({
        where: {
          governmentResponse: null,
          status: { in: ["threshold_reached", "government_review"] },
          OR: [
            { processId: null },
            {
              process: {
                OR: [
                  { isPublic: true },
                  { createdBy: user.id },
                  {
                    organization: {
                      memberships: { some: { userId: user.id } },
                    },
                  },
                ],
              },
            },
          ],
        },
        select: { id: true, title: true, responseDeadline: true },
        orderBy: { responseDeadline: "asc" },
        take: 50,
      }),
    ]);
    return NextResponse.json(
      {
        outcomes: tasks.filter(
          (task) => Array.isArray(task.evidence) && task.evidence.length,
        ),
        responseRequests: requests.map((request) => ({
          ...request,
          overdue: Boolean(
            request.responseDeadline && request.responseDeadline < new Date(),
          ),
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return missionFailure(error);
  }
}
