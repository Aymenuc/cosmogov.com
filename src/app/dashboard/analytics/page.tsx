'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, FileText, Loader2, Plus, Sprout, Vote } from 'lucide-react';
import WorkspaceHeading from '@/components/WorkspaceHeading';

interface Analytics {
  proposals: { active: number; closed: number };
  ballots: number;
  voters: number;
  comments: number;
  lastSevenDays: { date: string; ballots: number }[];
  closedProposals: {
    count: number;
    reachedQuorum: number;
    medianHoursOpen: number | null;
  };
}

interface Pulse {
  sentiment: { score: number; mood: string };
  metrics: { activeProposals: number; ballotsLast24h: number; votersLast7d: number };
  activityFeed: { id: string; type: 'vote' | 'proposal' | 'pass' | 'streak'; description: string; detail: string; timestamp: string }[];
}

const FEED_ICON = { vote: Vote, proposal: FileText, pass: CheckCircle2, streak: CheckCircle2 } as const;

function ago(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function formatDuration(hours: number) {
  if (hours < 1) return 'Under an hour';
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} days`;
}

function dayLabel(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return {
    weekday: d.toLocaleDateString('en', { weekday: 'short', timeZone: 'UTC' }),
    day: d.toLocaleDateString('en', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState('');
  const [pulse, setPulse] = useState<Pulse | null>(null);

  useEffect(() => {
    fetch('/api/analytics')
      .then(async (r) => {
        if (!r.ok) throw new Error();
        setData(await r.json());
      })
      .catch(() => setError('Analytics could not be loaded. Please refresh to try again.'));
    fetch('/api/pulse')
      .then((r) => (r.ok ? r.json() : null))
      .then(setPulse)
      .catch(() => setPulse(null));
  }, []);

  const week = data?.lastSevenDays ?? [];
  const weekTotal = week.reduce((sum, d) => sum + d.ballots, 0);
  const weekMax = Math.max(1, ...week.map((d) => d.ballots));
  const closed = data?.closedProposals;

  return (
    <div className="space-y-8">
      <WorkspaceHeading
        look="analytics"
        title="Analytics"
        description="How your communities are taking part. Every figure is counted from the proposals you can see, and no one's ballot is shown."
      >
        <Link href="/dashboard/proposals/new" className="civic-button">
          <Plus size={16} aria-hidden="true" /> New proposal
        </Link>
      </WorkspaceHeading>

      {error && <p role="alert" className="form-error">{error}</p>}

      {!data && !error ? (
        <div className="flex items-center justify-center py-16 text-cosmic-muted">
          <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading analytics" />
        </div>
      ) : data ? (
        <>
          <div className="workspace-tool-stats">
            {[
              { label: 'Open proposals', value: data.proposals.active },
              { label: 'Closed proposals', value: data.proposals.closed },
              { label: 'Ballots cast', value: data.ballots },
              { label: 'People who voted', value: data.voters },
            ].map((s) => (
              <div key={s.label} className="glass-card">
                <span className="text-xs text-cosmic-muted">{s.label}</span>
                <p className="font-heading text-2xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          <section id="this-week" className="analytics-week" aria-labelledby="this-week-heading">
            <div className="analytics-week-head">
              <h2 id="this-week-heading" className="font-heading text-base font-semibold">This week</h2>
              <span className="text-sm text-cosmic-muted">
                {pulse ? `${pulse.metrics.ballotsLast24h} ballots in the last 24 h · ${pulse.metrics.votersLast7d} people voted this week` : 'Loading…'}
              </span>
            </div>
            {pulse && (
              <div className="analytics-week-grid">
                <div className="analytics-lean">
                  <span className="text-xs text-cosmic-muted">Leaning on open proposals</span>
                  <p className="font-heading text-xl font-bold">{pulse.sentiment.mood}</p>
                  {pulse.sentiment.mood !== 'No ballots yet' ? (
                    <>
                      <div className="analytics-lean-bar" role="img" aria-label={`${pulse.sentiment.score}% of ballots on open proposals were for`}>
                        <span style={{ width: `${pulse.sentiment.score}%` }} />
                      </div>
                      <span className="text-xs text-cosmic-muted">{pulse.sentiment.score}% of ballots were &ldquo;for&rdquo;</span>
                    </>
                  ) : (
                    <span className="text-xs text-cosmic-muted">The bar fills once people vote on open proposals.</span>
                  )}
                </div>
                <ol className="analytics-feed">
                  {pulse.activityFeed.length === 0 && <li className="text-sm text-cosmic-muted">Nothing new yet this week.</li>}
                  {pulse.activityFeed.slice(0, 8).map((e) => {
                    const Icon = FEED_ICON[e.type] ?? FileText;
                    return (
                      <li key={e.id}>
                        <span className={`analytics-feed-icon ${e.type}`}><Icon size={15} aria-hidden="true" /></span>
                        <span className="analytics-feed-text">{e.description}</span>
                        <span className="text-xs text-cosmic-muted">{ago(e.timestamp)}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </section>

          <section className="glass-card rounded-2xl border border-border p-5 sm:p-6" aria-labelledby="week-heading">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="week-heading" className="font-heading text-base font-semibold">
                Ballots in the last 7 days
              </h2>
              <span className="text-sm text-cosmic-muted">{weekTotal} in total</span>
            </div>

            {weekTotal === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">
                  <Sprout aria-hidden="true" />
                </span>
                <h3>A quiet week so far</h3>
                <p>
                  Nobody has voted this week yet. A clear question gives neighbours a reason to show up,
                  and every proposal you open is added to your civic record.
                </p>
                <Link href="/dashboard/proposals/new" className="civic-button">
                  Ask your community something
                </Link>
              </div>
            ) : (
              <ol className="flex h-48 items-end gap-2 sm:gap-4" aria-label="Ballots per day">
                {week.map((d) => {
                  const label = dayLabel(d.date);
                  return (
                    <li key={d.date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                      <span className="text-xs font-semibold">{d.ballots}</span>
                      <div
                        className="w-full max-w-14 rounded-t-lg bg-[#6741d9]"
                        style={{
                          height: `${(d.ballots / weekMax) * 100}%`,
                          minHeight: d.ballots ? 6 : 2,
                          opacity: d.ballots ? 1 : 0.25,
                        }}
                        aria-hidden="true"
                      />
                      <span className="text-xs text-cosmic-muted" title={label.day}>
                        {label.weekday}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <div className="workspace-tool-stats">
            <div className="glass-card">
              <span className="text-xs text-cosmic-muted">Closed proposals that reached quorum</span>
              <p className="font-heading text-2xl font-bold">
                {closed && closed.count > 0
                  ? `${Math.round((closed.reachedQuorum / closed.count) * 100)}%`
                  : '—'}
              </p>
              <span className="text-xs text-cosmic-muted">
                {closed && closed.count > 0
                  ? `${closed.reachedQuorum} of ${closed.count}`
                  : 'No closed proposals yet'}
              </span>
            </div>
            <div className="glass-card">
              <span className="text-xs text-cosmic-muted">Median time from posting to closing</span>
              <p className="font-heading text-2xl font-bold">
                {closed?.medianHoursOpen != null ? formatDuration(closed.medianHoursOpen) : '—'}
              </p>
              <span className="text-xs text-cosmic-muted">
                {closed && closed.count > 0 ? `Across ${closed.count} closed` : 'No closed proposals yet'}
              </span>
            </div>
            <div className="glass-card">
              <span className="text-xs text-cosmic-muted">Comments on proposals</span>
              <p className="font-heading text-2xl font-bold">{data.comments}</p>
              <span className="text-xs text-cosmic-muted">Conversations that shape the vote</span>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
