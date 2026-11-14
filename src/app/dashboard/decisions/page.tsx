"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCheck, ClipboardList, Search } from "lucide-react";
import type { CivicProposal } from "@/lib/civic";
import ProposalCard from "@/components/ProposalCard";
export default function DecisionsPage() {
  const [proposals, setProposals] = useState<CivicProposal[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/proposals?status=closed")
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setProposals(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Your decision record couldn’t be loaded. Please try again.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retry]);
  const filtered = proposals.filter(
    (p) =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.organization?.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div>
      <div className="app-page-heading">
        <div>
          <div className="eyebrow">
            <CheckCheck size={13} /> THE COMMUNITY RECORD
          </div>
          <h1>A vote is a beginning.</h1>
          <p>
            Revisit closed proposals. See the recorded choices. Stay connected
            to what happens next.
          </p>
        </div>
        <Link
          href="/dashboard/participation/accountability"
          className="civic-button outline"
        >
          Follow implementation <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="proposal-intro-strip">
        <ClipboardList size={21} />
        <p>
          <strong>A clear record, without assumptions.</strong> Closed voting
          doesn’t automatically mean a project is approved or implemented.
          Follow official responses and milestones in Accountability.
        </p>
      </div>
      <div className="app-search" style={{ marginBottom: 25 }}>
        <Search size={16} />
        <input
          aria-label="Search closed decisions"
          placeholder="Find a decision or community..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="proposal-grid full">
          {[0, 1, 2].map((i) => (
            <div className="proposal-skeleton" key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="empty-state" role="alert">
          <p>{error}</p>
          <button
            className="civic-button outline"
            onClick={() => {
              setLoading(true);
              setError("");
              setRetry((v) => v + 1);
            }}
          >
            Try again
          </button>
        </div>
      ) : filtered.length ? (
        <div className="proposal-grid full">
          {filtered.map((p) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">
            <CheckCheck />
          </span>
          <h3>
            {query
              ? "No decisions match your search."
              : "A shared history starts here."}
          </h3>
          <p>
            {query
              ? "Try a different title or community."
              : "When a proposal closes, its record will appear here. Explore an open conversation to add your perspective today."}
          </p>
          <Link href="/dashboard/proposals" className="civic-button outline">
            Explore proposals <ArrowUpRight size={14} />
          </Link>
        </div>
      )}
      <p className="feed-note">
        Showing up to 50 recently closed proposals. Results and implementation
        are separate stages.
      </p>
    </div>
  );
}
