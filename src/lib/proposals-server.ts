import { Prisma } from "@prisma/client";
import { db } from "./db";
import { ApiError } from "./api-server";
export const proposalVisibility = (
  userId: string,
): Prisma.ProposalWhereInput => ({
  OR: [
    { organizationId: null },
    { organization: { memberships: { some: { userId } } } },
  ],
});
export async function accessProposal(id: string, userId: string) {
  const proposal = await db.proposal.findFirst({
    where: { id, ...proposalVisibility(userId) },
  });
  if (!proposal) throw new ApiError(404, "Proposal not found.");
  const member = proposal.organizationId
    ? await db.membership.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: proposal.organizationId,
          },
        },
      })
    : null;
  return {
    proposal,
    canManage:
      proposal.createdBy === userId ||
      ["admin", "moderator"].includes(member?.role || ""),
  };
}
export async function proposalResults(ids: string[]) {
  return db.vote.groupBy({
    by: ["proposalId", "option"],
    where: { proposalId: { in: ids } },
    _count: { _all: true },
  });
}
export function voteTotals(
  rows: Awaited<ReturnType<typeof proposalResults>>,
  id: string,
) {
  return rows
    .filter((row) => row.proposalId === id)
    .map((row) => ({ option: row.option, count: row._count._all }));
}
