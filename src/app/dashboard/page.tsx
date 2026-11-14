"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  CheckCheck,
  CircleCheck,
  Clock,
  Globe2,
  Leaf,
  Plus,
  Sparkles,
  Users,
  Vote,
  Wallet,
} from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";
import ProposalCard from "@/components/ProposalCard";
import CommonsArt from "@/components/CommonsArt";
import { StickerStrip } from "@/components/stickers/StickerBook";
import { type CivicProposal, isOpen } from "@/lib/civic";
interface Community {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
}
export default function OverviewPage() {
  const { user, saved } = useWorkspace();
  const [proposals, setProposals] = useState<CivicProposal[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("for-you");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([
      fetch("/api/proposals").then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      }),
      fetch("/api/organizations").then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      }),
    ])
      .then(([p, c]) => {
        if (!cancelled) {
          setProposals(Array.isArray(p) ? p : []);
          setCommunities(Array.isArray(c) ? c : []);
        }
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Your community activity couldn’t be loaded. Please try again.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retry]);
  const active = proposals.filter(isOpen);
  const needsVoice = active.filter(
    (p) => !p.votes?.some((v) => v.voterId === user?.id),
  );
  const following = proposals.filter((p) => saved.includes(p.id));
  const outcomes = proposals.filter(
    (p) => p.status === "closed" || (p.status === "active" && !isOpen(p)),
  );
  const visible = (
    view === "following"
      ? following
      : view === "outcomes"
        ? outcomes
        : needsVoice
  )
    .sort((a, b) => {
      if (isOpen(a) !== isOpen(b)) return isOpen(a) ? -1 : 1;
      return (
        (a.closesAt ? new Date(a.closesAt).getTime() : Infinity) -
        (b.closesAt ? new Date(b.closesAt).getTime() : Infinity)
      );
    })
    .slice(0, 6);
  const myVotes = proposals.filter((p) =>
    p.votes?.some((v) => v.voterId === user?.id),
  ).length;
  return (
    <div className="civic-desk">
      <div className="app-page-heading">
        <div>
          <div className="eyebrow">
            <span className="status-dot" /> YOUR LITTLE CORNER OF CHANGE
          </div>
          <h1>
            Hey{user?.name ? `, ${user.name.split(" ")[0]}` : " there"}. Let’s
            make a little change.
          </h1>
          <p>
            Fresh ideas, familiar faces, and a few things only you can bring.
          </p>
        </div>
        <Link href="/dashboard/missions" className="civic-button">
          <Plus size={15} />
          Start a mission
        </Link>
      </div>
      <section className="desk-welcome">
        <div className="desk-welcome-copy">
          <div className="eyebrow">GOOD THINGS START WITH “WHAT IF?”</div>
          <h2>
            {needsVoice.length > 0
              ? "Got five minutes? Something good starts with you."
              : "Your next good idea belongs here."}
          </h2>
          <p>
            {needsVoice.length > 0
              ? `${needsVoice.length} open ${needsVoice.length === 1 ? "decision is" : "decisions are"} waiting for your voice. Take a moment to explore the ideas shaping your community.`
              : "Find your people, share something worth discussing, and help shape what comes next."}
          </p>
          <Link
            href={
              needsVoice.length > 0
                ? "/dashboard/proposals"
                : "/dashboard/organizations"
            }
            className="text-link"
          >
            {needsVoice.length > 0
              ? "Let’s take a look"
              : "Find your community"}
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="desk-welcome-art" aria-hidden="true">
          <CommonsArt />
          <span className="desk-art-label">
            More voices. More possibility. <Sparkles size={15} />
          </span>
        </div>
      </section>
      <section
        className="desk-stats"
        aria-label="Your participation at a glance"
      >
        {[
          {
            icon: Vote,
            label: "Open decisions",
            value: active.length,
            note: "Available in your proposal feed",
          },
          {
            icon: CheckCheck,
            label: "Your contributions",
            value: myVotes,
            note: "Proposals you have voted on",
          },
          {
            icon: Users,
            label: "Your communities",
            value: communities.length,
            note: "Places where you belong",
          },
          {
            icon: Bookmark,
            label: "Following",
            value: following.length,
            note: "Saved on this browser",
          },
        ].map((stat) => (
          <div key={stat.label}>
            <div>
              <stat.icon size={16} />
              <span>{stat.label}</span>
            </div>
            <strong>{loading ? "—" : stat.value}</strong>
            <small>{stat.note}</small>
          </div>
        ))}
      </section>
      <StickerStrip />
      <div className="desk-columns">
        <section className="desk-agenda">
          <div className="app-section-heading">
            <div>
              <h2>A few things worth your voice.</h2>
              <p>Take part. Stay curious. Keep the thread.</p>
            </div>
            <Link className="text-link" href="/dashboard/proposals">
              See all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div
            className="desk-tabs"
            role="tablist"
            aria-label="Your participation feed"
          >
            {[
              {
                id: "for-you",
                label: "Needs your voice",
                count: needsVoice.length,
              },
              { id: "following", label: "Following", count: following.length },
              {
                id: "outcomes",
                label: "Closed decisions",
                count: outcomes.length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                id={`desk-${tab.id}`}
                role="tab"
                aria-controls="desk-feed"
                aria-selected={view === tab.id}
                className={view === tab.id ? "active" : ""}
                onClick={() => setView(tab.id)}
              >
                {tab.label}
                <span>{tab.count}</span>
              </button>
            ))}
          </div>
          <div id="desk-feed" role="tabpanel" aria-labelledby={`desk-${view}`}>
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
              <div className="proposal-grid">
                {[0, 1].map((i) => (
                  <div className="proposal-skeleton" key={i} />
                ))}
              </div>
            ) : visible.length > 0 ? (
              <div className="proposal-grid">
                {visible.map((p) => (
                  <ProposalCard key={p.id} proposal={p} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">
                  {view === "following" ? (
                    <Bookmark />
                  ) : view === "outcomes" ? (
                    <CheckCheck />
                  ) : (
                    <Leaf />
                  )}
                </span>
                <h3>
                  {view === "following"
                    ? "Keep the ideas you care about close."
                    : view === "outcomes"
                      ? "The story continues after a vote."
                      : "You’re ready for what comes next."}
                </h3>
                <p>
                  {view === "following"
                    ? "Select the bookmark on any proposal to follow it here. Your list is saved on this browser."
                    : view === "outcomes"
                      ? "Closed proposals will appear here. Follow implementation and official responses in Accountability."
                      : active.length
                        ? "You have voted on the open proposals in this feed. Explore more ways to participate."
                        : "There are no open proposals in this feed yet. Start a conversation or explore a community process."}
                </p>
                <Link
                  className="civic-button outline"
                  href={
                    view === "outcomes"
                      ? "/dashboard/participation/accountability"
                      : view === "following"
                        ? "/dashboard/proposals"
                        : "/dashboard/participation"
                  }
                >
                  {view === "outcomes"
                    ? "Follow community progress"
                    : view === "following"
                      ? "Browse proposals"
                      : "Explore participation"}
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            )}
          </div>
          <p className="feed-note">
            Showing the latest 50 proposals available in your feed. Following is
            stored on this browser.
          </p>
        </section>
        <aside className="desk-right">
          <section className="community-list">
            <div className="app-section-heading">
              <h2>Your people.</h2>
              <Link
                href="/dashboard/organizations"
                aria-label="View your communities"
              >
                <ArrowUpRight size={15} />
              </Link>
            </div>
            {communities.length > 0 ? (
              communities.slice(0, 3).map((c) => (
                <Link href={`/dashboard/organizations/${c.slug}`} key={c.id}>
                  <span className="community-avatar">{c.name[0]}</span>
                  <div>
                    <strong>{c.name}</strong>
                    <small>{c.memberCount} members</small>
                  </div>
                  <ArrowUpRight size={13} />
                </Link>
              ))
            ) : (
              <div className="community-empty">
                <Users size={24} />
                <p>A community makes every idea stronger.</p>
                <Link href="/dashboard/organizations/new" className="text-link">
                  Create your first community <Plus size={13} />
                </Link>
              </div>
            )}
          </section>
          <section className="ways-to-participate">
            <div className="eyebrow">FIND YOUR WAY IN</div>
            <h2>More than a vote.</h2>
            {[
              {
                icon: Wallet,
                title: "Shape a shared budget",
                copy: "Put priorities into practice.",
                href: "/dashboard/participation/budget",
              },
              {
                icon: Users,
                title: "Join an assembly",
                copy: "Make space for dialogue.",
                href: "/dashboard/participation/assemblies",
              },
              {
                icon: Globe2,
                title: "See the bigger picture",
                copy: "Discover activity on the map.",
                href: "/dashboard/cosmic-map",
              },
            ].map((item) => (
              <Link key={item.title} href={item.href}>
                <span>
                  <item.icon size={16} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.copy}</small>
                </div>
                <ArrowUpRight size={13} />
              </Link>
            ))}
          </section>
          <Link href="/dashboard/assistant" className="desk-ai">
            <Sparkles size={19} />
            <div>
              <h3>A clearer starting point.</h3>
              <p>Explore an idea with your AI assistant.</p>
              <span>
                Think it through <ArrowRight size={13} />
              </span>
            </div>
          </Link>
        </aside>
      </div>
    </div>
  );
}
