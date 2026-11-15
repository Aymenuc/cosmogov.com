import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser, apiFailure } from "@/lib/api-server";
import { proposalVisibility } from "@/lib/proposals-server";

const DAY_MS = 86_400_000;

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Participation figures counted from the proposals this person can already
 * see (public proposals and those of communities they belong to). Totals
 * only: no ballot contents and no voter identities leave the server.
 */
export async function GET() {
  try {
    const user = await apiUser();
    const visible = proposalVisibility(user.id);

    const weekStart = new Date();
    weekStart.setUTCHours(0, 0, 0, 0);
    weekStart.setTime(weekStart.getTime() - 6 * DAY_MS);

    const [byStatus, ballots, recentBallots, voters, comments, closed] =
      await Promise.all([
        db.proposal.groupBy({
          by: ["status"],
          where: visible,
          _count: { _all: true },
        }),
        db.vote.count({ where: { proposal: visible } }),
        db.vote.findMany({
          where: { proposal: visible, createdAt: { gte: weekStart } },
          select: { createdAt: true },
        }),
        db.vote.groupBy({ by: ["voterId"], where: { proposal: visible } }),
        db.comment.count({ where: { proposal: visible } }),
        db.proposal.findMany({
          where: { ...visible, status: "closed" },
          select: {
            quorum: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { votes: true } },
          },
        }),
      ]);

    const statusCount = (status: string) =>
      byStatus.find((row) => row.status === status)?._count._all ?? 0;

    const days = Array.from({ length: 7 }, (_, i) => {
      const start = weekStart.getTime() + i * DAY_MS;
      return {
        date: new Date(start).toISOString().slice(0, 10),
        ballots: recentBallots.filter((b) => {
          const t = b.createdAt.getTime();
          return t >= start && t < start + DAY_MS;
        }).length,
      };
    });

    // A proposal closes by a status change, so its last update is when it
    // closed. Content is locked once ballots exist.
    const hoursOpen = closed.map(
      (p) => (p.updatedAt.getTime() - p.createdAt.getTime()) / 3_600_000,
    );

    return NextResponse.json({
      proposals: {
        active: statusCount("active"),
        closed: closed.length,
      },
      ballots,
      voters: voters.length,
      comments,
      lastSevenDays: days,
      closedProposals: {
        count: closed.length,
        reachedQuorum: closed.filter((p) => p._count.votes >= p.quorum).length,
        medianHoursOpen: median(hoursOpen),
      },
    });
  } catch (error) {
    return apiFailure(error);
  }
}
