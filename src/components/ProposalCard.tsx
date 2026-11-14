"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Clock,
  MessageCircle,
  Vote,
} from "lucide-react";
import { getCategory, resolveCategory } from "@/lib/categories";
import { type CivicProposal, deadlineLabel, isOpen } from "@/lib/civic";
import { useWorkspace } from "./WorkspaceContext";
export default function ProposalCard({
  proposal: p,
}: {
  proposal: CivicProposal;
}) {
  const { user, saved, toggleSaved } = useWorkspace();
  const category = getCategory(resolveCategory(p.category));
  const Icon = category.icon;
  const voted = p.votes?.some((vote) => vote.voterId === user?.id);
  const open = isOpen(p);
  const isSaved = saved.includes(p.id);
  return (
    <article className="proposal-card" data-topic={category.id}>
      <div className="proposal-card-top">
        <span className="proposal-category">
          <Icon size={13} />
          {category.label}
        </span>
        <button
          aria-label={`${isSaved ? "Unfollow" : "Follow"} ${p.title}`}
          aria-pressed={isSaved}
          className={`save-proposal ${isSaved ? "saved" : ""}`}
          onClick={() => toggleSaved(p.id)}
        >
          <Bookmark size={17} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="proposal-card-main">
        <Link href={`/dashboard/proposals/${p.id}`}>
          <h3>{p.title}</h3>
        </Link>
        <p>{p.description}</p>
      </div>
      <div className="proposal-card-origin">
        <span className="origin-initial">
          {(p.organization?.name || p.creator?.name || "C")[0]}
        </span>
        {p.organization?.name || p.creator?.name || "Community proposal"}
      </div>
      <div className="proposal-card-footer">
        <span className={`proposal-status ${open ? "open" : ""}`}>
          <span className="status-dot" />
          {open
            ? "Voting open"
            : p.status === "active"
              ? "Voting ended"
              : p.status === "closed"
                ? "Closed"
                : "Draft"}
        </span>
        <span>
          <Clock size={12} />
          {deadlineLabel(p.closesAt)}
        </span>
      </div>
      <div className="proposal-card-action">
        <div>
          <span>
            <Vote size={13} />
            {p._count?.votes ?? p.votes?.length ?? 0}
          </span>
          <span>
            <MessageCircle size={13} />
            {p._count?.comments ?? 0}
          </span>
          {voted && (
            <span className="voted-label">
              <Check size={12} />
              Voted
            </span>
          )}
        </div>
        <Link href={`/dashboard/proposals/${p.id}`}>
          {open
            ? voted
              ? "View discussion"
              : "Have your say"
            : "View decision"}
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </article>
  );
}
