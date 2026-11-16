'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Loader2, MessageSquare, Rocket, Users, X } from 'lucide-react';
import WorkspaceHeading, { ToolEmpty } from '@/components/WorkspaceHeading';
import DebateRoom, { type RoomDebate } from '@/components/debate/DebateRoom';
import HelperBadge from '@/components/helpers/HelperBadge';
import { HELPER_INFO } from '@/components/helpers/helper-info';
import { HELPER_TYPES } from '@/lib/helper-languages';

interface DebateSummary extends RoomDebate {
  status: string;
  createdAt: string;
  participants?: { role: string }[];
  _count?: { messages: number };
}

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

function StartDebate({ onClose, onCreated }: { onClose: () => void; onCreated: (d: RoomDebate) => void }) {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/ai/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, topic, description, isPublic: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'We couldn’t start the debate. Try again.');
      onCreated(data);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div
      className="hall-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="start-debate-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="hall-modal-backdrop" onClick={onClose} aria-hidden="true" />
      <form className="org-panel hall-modal-card" onSubmit={submit}>
        <div className="hall-modal-head">
          <h2 id="start-debate-title">Start a debate</h2>
          <button type="button" className="hall-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <p className="org-panel-note">Pick one question your community faces. Everyone signed in can find it and take part.</p>
        <label htmlFor="debate-title">Title</label>
        <input
          id="debate-title"
          required
          autoFocus
          minLength={3}
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Should the high street close to cars on market days?"
        />
        <label htmlFor="debate-topic">The question, in one line</label>
        <input
          id="debate-topic"
          required
          minLength={3}
          maxLength={300}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Close the high street to cars every Saturday from 8 to 2"
        />
        <label htmlFor="debate-description">Background (optional)</label>
        <textarea
          id="debate-description"
          rows={3}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What people should know before they start: facts, who is affected, any deadline."
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="hall-modal-actions">
          <button type="button" className="civic-button outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="civic-button" disabled={busy || title.trim().length < 3 || topic.trim().length < 3}>
            {busy ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Rocket size={15} aria-hidden="true" />}
            Start the debate
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AssemblyHallPage() {
  const [debates, setDebates] = useState<DebateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<RoomDebate | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const loadDebates = useCallback(
    () =>
      fetch('/api/ai/debate')
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => setDebates(Array.isArray(d) ? d : []))
        .catch(() => setDebates([]))
        .finally(() => setLoading(false)),
    [],
  );

  const open = useCallback((debate: RoomDebate) => {
    setCurrent({ id: debate.id, title: debate.title, topic: debate.topic, description: debate.description });
    window.history.replaceState(null, '', `?debate=${encodeURIComponent(debate.id)}`);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    loadDebates();
    // A shared link (?debate=…) opens that debate straight away.
    const id = new URLSearchParams(window.location.search).get('debate');
    if (id)
      fetch(`/api/ai/debate/${encodeURIComponent(id)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.id) open(d);
          else setError('That debate isn’t available. It may be private or closed.');
        })
        .catch(() => setError('We couldn’t open that debate.'));
  }, [loadDebates, open]);

  const leave = () => {
    setCurrent(null);
    window.history.replaceState(null, '', window.location.pathname);
    loadDebates();
  };

  if (current) return <DebateRoom debate={current} onLeave={leave} />;

  const live = debates.filter((d) => d.status !== 'ended' && d.status !== 'closed');

  return (
    <div className="hall">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <WorkspaceHeading
        look="debates"
        title="Assembly hall"
        description="Talk an issue through with your neighbours. When it helps, ask an AI helper to sum up, find common ground, explain, check the tone, simplify or translate. People make every decision."
      >
        <button type="button" className="civic-button" onClick={() => setStarting(true)}>
          <Rocket size={15} aria-hidden="true" /> Start a debate
        </button>
      </WorkspaceHeading>

      <section className="hall-section" aria-labelledby="hall-debates">
        <div className="hall-section-head">
          <h2 id="hall-debates">Debates</h2>
          <p>Open one to read the conversation and take part.</p>
        </div>
        {loading ? (
          <p className="org-panel-note" role="status">
            Loading debates…
          </p>
        ) : live.length === 0 ? (
          <ToolEmpty look="debates">
            <button type="button" className="civic-button" onClick={() => setStarting(true)}>
              <Rocket size={15} aria-hidden="true" /> Start a debate
            </button>
          </ToolEmpty>
        ) : (
          <div className="hall-debates">
            {live.map((d) => {
              const people = d.participants?.filter((p) => p.role !== 'ai_agent').length ?? 0;
              return (
                <button key={d.id} type="button" className="hall-debate" onClick={() => open(d)}>
                  <strong>{d.title}</strong>
                  <span className="hall-debate-topic">{d.topic}</span>
                  <span className="hall-debate-meta">
                    <span>
                      <Users size={13} aria-hidden="true" /> {people} {people === 1 ? 'person' : 'people'}
                    </span>
                    <span>
                      <MessageSquare size={13} aria-hidden="true" /> {d._count?.messages ?? 0} messages
                    </span>
                    <span>Started {timeAgo(d.createdAt)}</span>
                  </span>
                  <span className="hall-debate-open">
                    Open <ArrowUpRight size={14} aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="hall-section" aria-labelledby="hall-helpers">
        <div className="hall-section-head">
          <h2 id="hall-helpers">The helpers</h2>
          <p>
            Six AI helpers, each with one job. They answer only when someone asks, and they never vote.{' '}
            <Link href="/dashboard/ai-agents">Try them on your own text</Link>
          </p>
        </div>
        <ul className="hall-helpers">
          {HELPER_TYPES.map((type) => (
            <li key={type}>
              <HelperBadge type={type} size={40} />
              <span>
                <strong>{HELPER_INFO[type].name}</strong>
                <span>{HELPER_INFO[type].role}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="hall-section" aria-labelledby="hall-how">
        <div className="hall-section-head">
          <h2 id="hall-how">How it works</h2>
        </div>
        <ol className="hall-steps">
          <li className="org-panel">
            <span className="hall-step-n" aria-hidden="true">1</span>
            <h3>Start or open a debate</h3>
            <p>Pick a question your community faces, or join one that’s already going.</p>
          </li>
          <li className="org-panel">
            <span className="hall-step-n" aria-hidden="true">2</span>
            <h3>Ask a helper when it helps</h3>
            <p>A summary when it gets long, common ground when it’s stuck, a translation for a neighbour.</p>
          </li>
          <li className="org-panel">
            <span className="hall-step-n" aria-hidden="true">3</span>
            <h3>People decide</h3>
            <p>Helpers never vote or decide. Take what you agree on to a proposal or a vote.</p>
          </li>
        </ol>
      </section>

      {starting && (
        <StartDebate
          onClose={() => setStarting(false)}
          onCreated={(d) => {
            setStarting(false);
            open(d);
          }}
        />
      )}
    </div>
  );
}
