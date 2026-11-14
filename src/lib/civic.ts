export interface CivicProposal {
  id: string;
  title: string;
  description: string;
  status: string;
  votingType: string;
  category: string | null;
  createdAt: string;
  closesAt?: string | null;
  quorum?: number;
  creator?: { name: string | null };
  organization?: { name: string; slug: string } | null;
  _count?: { votes: number; comments: number };
  voteTotals?: { option: string; count: number }[];
  votes?: { voterId: string; option: string }[];
}
export function isOpen(proposal: CivicProposal) {
  return (
    proposal.status === "active" &&
    (!proposal.closesAt || new Date(proposal.closesAt).getTime() > Date.now())
  );
}
export function deadlineLabel(value?: string | null) {
  if (!value) return "No closing date";
  const remaining = new Date(value).getTime() - Date.now();
  if (remaining <= 0) return "Voting ended";
  if (remaining < 3600000) return "Closes in under an hour";
  if (remaining < 86400000)
    return `Closes in ${Math.ceil(remaining / 3600000)}h`;
  return `Closes in ${Math.ceil(remaining / 86400000)} days`;
}
export const voteLabel: Record<string, string> = {
  yes_no: "Yes / no vote",
  multiple_choice: "Council vote",
  ranked_choice: "Ranked choice",
};
