"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  FileText,
  Globe2,
  Plus,
  Search,
  Users,
} from "lucide-react";
interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  role: string;
  memberCount: number;
  proposalCount: number;
}
export default function OrganizationsPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/organizations")
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setCommunities(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled)
          setError("We couldn’t load your communities. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retry]);
  const filtered = communities.filter((c) =>
    `${c.name} ${c.description || ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div>
      <div className="app-page-heading">
        <div>
          <div className="eyebrow">
            <Users size={13} /> YOUR PEOPLE, YOUR POSSIBILITIES
          </div>
          <h1>Find a sense of together.</h1>
          <p>The places where your ideas meet people who care.</p>
        </div>
        <Link href="/dashboard/organizations/new" className="civic-button">
          <Plus size={15} />
          Create a community
        </Link>
      </div>
      <div className="proposal-toolbar">
        <div className="app-search">
          <Search size={16} />
          <input
            aria-label="Search your communities"
            placeholder="Search your communities..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Link href="/dashboard/explore" className="following-filter">
          <Globe2 size={15} />
          Explore more
        </Link>
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
        <div className="community-grid">
          {filtered.map((c, i) => (
            <Link
              href={`/dashboard/organizations/${c.slug}`}
              key={c.id}
              className="community-card"
            >
              <div className={`community-card-banner tone-${i % 3}`}>
                <span>{c.name[0]}</span>
                <span className="community-role">{c.role}</span>
                <Globe2 size={90} strokeWidth={0.7} />
              </div>
              <div className="community-card-copy">
                <h2>{c.name}</h2>
                <p>
                  {c.description ||
                    "A shared space to participate, discuss, and decide together."}
                </p>
                <div>
                  <span>
                    <Users size={13} />
                    {c.memberCount} members
                  </span>
                  <span>
                    <FileText size={13} />
                    {c.proposalCount} proposals
                  </span>
                </div>
                <span className="community-open">
                  Open community <ArrowUpRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">
            <Users />
          </span>
          <h3>
            {query
              ? "Your people might use a different name."
              : "A shared future needs a shared space."}
          </h3>
          <p>
            {query
              ? "Try another search to find one of your communities."
              : "Create a community for your neighborhood, organization, or group. Bring people in and start with one good question."}
          </p>
          <Link
            href={query ? "/dashboard/explore" : "/dashboard/organizations/new"}
            className="civic-button outline"
          >
            {query
              ? "Explore the wider community"
              : "Create your first community"}
            <ArrowUpRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
