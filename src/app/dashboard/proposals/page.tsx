"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  Plus,
  Search,
  SlidersHorizontal,
  Vote,
  X,
} from "lucide-react";
import { GOVERNANCE_CATEGORIES } from "@/lib/categories";
import { type CivicProposal, isOpen } from "@/lib/civic";
import { useWorkspace } from "@/components/WorkspaceContext";
import ProposalCard from "@/components/ProposalCard";
export default function ProposalsPage() {
  const { saved, user } = useWorkspace();
  const [proposals, setProposals] = useState<CivicProposal[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("active");
  const [category, setCategory] = useState("all");
  const [following, setFollowing] = useState(false);
  const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (category !== "all") params.set("category", category);
    if (query.trim()) params.set("search", query.trim());
    const timer = setTimeout(() => {
      fetch(`/api/proposals?${params}`)
        .then(async (res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          if (!cancelled) setProposals(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          if (!cancelled)
            setError("We couldn’t load proposals. Please try again.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [status, category, query, retry]);
  const filtered = proposals
    .filter((p) => (!following || saved.includes(p.id)) && (status !== "active" || isOpen(p)))
    .sort((a, b) =>
      sort === "closing"
        ? (a.closesAt ? new Date(a.closesAt).getTime() : Infinity) -
          (b.closesAt ? new Date(b.closesAt).getTime() : Infinity)
        : sort === "discussed"
          ? (b._count?.comments || 0) - (a._count?.comments || 0)
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  return (
    <div>
      <div className="app-page-heading">
        <div>
          <div className="eyebrow">
            <span className="status-dot" /> IDEAS THAT MOVE US FORWARD
          </div>
          <h1>A good idea deserves a conversation.</h1>
          <p>
            Explore the proposals shaping your community. Bring your
            perspective.
          </p>
        </div>
        <Link href="/dashboard/proposals/new" className="civic-button">
          <Plus size={15} />
          New proposal
        </Link>
      </div>
      <div className="proposal-intro-strip">
        <Vote size={20} />
        <p>
          <strong>Your perspective adds something no one else can.</strong> Read
          the brief, join the discussion, then make your choice.
        </p>
        <span>DISCOVER → DISCUSS → DECIDE</span>
      </div>
      <div className="proposal-toolbar">
        <div className="app-search">
          <Search size={17} />
          <input
            aria-label="Search proposals"
            placeholder="Find an idea that matters to you..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button aria-label="Clear search" onClick={() => setQuery("")}>
              <X size={15} />
            </button>
          )}
        </div>
        <button
          className={`following-filter ${following ? "active" : ""}`}
          aria-pressed={following}
          onClick={() => setFollowing((v) => !v)}
        >
          <Bookmark size={15} fill={following ? "currentColor" : "none"} />
          Following
        </button>
        <label className="sort-select">
          <SlidersHorizontal size={14} />
          <span className="sr-only">Sort proposals</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">Most recent</option>
            <option value="closing">Closing soon</option>
            <option value="discussed">Most discussed</option>
          </select>
        </label>
      </div>
      <div className="category-chips" aria-label="Filter by topic">
        <button
          aria-pressed={category === "all"}
          onClick={() => setCategory("all")}
          className={category === "all" ? "active" : ""}
        >
          All topics
        </button>
        {GOVERNANCE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={category === cat.id ? "active" : ""}
            aria-pressed={category === cat.id}
            onClick={() => setCategory(cat.id)}
          >
            <cat.icon size={12} />
            {cat.label}
          </button>
        ))}
      </div>
      <div className="proposal-list-heading">
        <div className="desk-tabs" aria-label="Proposal status">
          {[
            { id: "active", label: "Open for voting" },
            { id: "closed", label: "Closed" },
            { id: "draft", label: "Drafts" },
            { id: "all", label: "All proposals" },
          ].map((tab) => (
            <button
              key={tab.id}
              aria-pressed={status === tab.id}
              onClick={() => setStatus(tab.id)}
              className={status === tab.id ? "active" : ""}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span aria-live="polite">
          {loading
            ? "Finding ideas…"
            : `${filtered.length} ${filtered.length === 1 ? "proposal" : "proposals"}`}
        </span>
      </div>
      {error ? (
        <div className="empty-state" role="alert">
          <p>{error}</p>
          <button
            className="civic-button outline"
            onClick={() => setRetry((v) => v + 1)}
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="proposal-grid full">
          {[0, 1, 2].map((i) => (
            <div className="proposal-skeleton" key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            {following ? <Bookmark /> : <Vote />}
          </span>
          <h3>
            {following
              ? "Your next good idea is out there."
              : "Make room for the first idea."}
          </h3>
          <p>
            {following
              ? "Follow a proposal using its bookmark to keep it here. Following is saved on this browser."
              : query || category !== "all"
                ? "No proposals match these filters. Try another topic or a broader search."
                : "No proposals in this view yet. Share an idea your community can build on."}
          </p>
          {query || category !== "all" || following ? (
            <button
              className="civic-button outline"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setFollowing(false);
              }}
            >
              Reset filters
            </button>
          ) : (
            <Link
              href="/dashboard/proposals/new"
              className="civic-button outline"
            >
              Start a proposal <ArrowUpRight size={14} />
            </Link>
          )}
        </div>
      ) : (
        <div className="proposal-grid full">
          {filtered.map((p) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </div>
      )}
      <p className="feed-note">
        Up to 50 most recent matching proposals. Following is personal to this
        browser.
      </p>
    </div>
  );
}
