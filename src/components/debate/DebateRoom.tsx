'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Link2, Loader2, MessageSquare, Send, Users } from 'lucide-react';
import ToolArt from '@/components/ToolArt';
import HelperBadge, { isHelperType } from '@/components/helpers/HelperBadge';
import { HELPER_INFO } from '@/components/helpers/helper-info';
import { HELPER_LANGUAGES, HELPER_TYPES, type HelperLanguage, type HelperType } from '@/lib/helper-languages';

export interface RoomMessage {
  id: string;
  content: string;
  agentType: string | null;
  createdAt: string;
  targetLang?: string | null;
  participant?: { displayName: string } | null;
  user?: { id: string; name: string | null } | null;
}

export interface RoomDebate {
  id: string;
  title: string;
  topic: string;
  description?: string | null;
}

const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

function Message({ m }: { m: RoomMessage }) {
  const helper = isHelperType(m.agentType) ? m.agentType : null;
  const name = helper ? HELPER_INFO[helper].name : m.participant?.displayName || m.user?.name || 'A neighbour';
  const language = m.targetLang && m.targetLang in HELPER_LANGUAGES ? HELPER_LANGUAGES[m.targetLang as HelperLanguage] : null;
  return (
    <article className={`debate-msg${helper ? ' is-helper' : ''}`}>
      {helper ? (
        <HelperBadge type={helper} size={32} />
      ) : (
        <span className="org-avatar" aria-hidden="true">
          {name[0].toUpperCase()}
        </span>
      )}
      <div className="debate-msg-body">
        <header>
          <strong>{name}</strong>
          {helper && <span className="debate-ai-tag">AI helper{language ? ` · ${language}` : ''}</span>}
          <time dateTime={m.createdAt}>{clock(m.createdAt)}</time>
        </header>
        <p>{m.content}</p>
      </div>
    </article>
  );
}

/**
 * One debate: the conversation on the left, the six helpers on the right.
 * Helpers only answer when someone presses their button.
 */
export default function DebateRoom({ debate, onLeave }: { debate: RoomDebate; onLeave: () => void }) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [asking, setAsking] = useState<HelperType | null>(null);
  const [language, setLanguage] = useState<HelperLanguage>('fr');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/ai/debate/${debate.id}/messages`);
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setMessages(data);
  }, [debate.id]);

  useEffect(() => {
    let alive = true;
    refresh()
      .catch(() => {})
      .finally(() => {
        if (alive) setLoaded(true);
      });
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh().catch(() => {});
    }, 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [refresh]);

  // Keep the newest message in view inside the conversation box (not the page).
  useEffect(() => {
    const box = listRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages.length]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`/api/ai/debate/${debate.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type: 'statement' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Your message didn’t go through. Try again.');
      setInput('');
      if (data.userMessage) setMessages((prev) => [...prev, data.userMessage]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const ask = async (helper: HelperType) => {
    setAsking(helper);
    setError('');
    try {
      const res = await fetch(`/api/ai/debate/${debate.id}/helper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helper, language: helper === 'translator' ? language : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'The helper couldn’t answer. Try again.');
      setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAsking(null);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/dashboard/assembly-hall?debate=${debate.id}`);
      setCopied(true);
    } catch {
      setError('Copying didn’t work here. Copy the address from your browser instead.');
    }
  };

  const people = new Set(messages.filter((m) => !m.agentType).map((m) => m.participant?.displayName ?? m.user?.id)).size;
  const someoneSpoke = messages.some((m) => !m.agentType);

  return (
    <div className="debate-room">
      <button type="button" className="workspace-back-link" onClick={onLeave}>
        <ArrowLeft size={16} aria-hidden="true" /> Assembly hall
      </button>
      <header className="workspace-heading tool-hero compact-hero tint-sky" data-look="debates">
        <div className="tool-hero-panel">
          <div className="tool-hero-text">
            <span className="tool-hero-eyebrow">Debate</span>
            <h1>{debate.title}</h1>
            <p>{debate.topic}</p>
            <div className="detail-hero-meta">
              <span>
                <Users size={13} aria-hidden="true" /> {people} {people === 1 ? 'person has' : 'people have'} spoken
              </span>
              <span>
                <MessageSquare size={13} aria-hidden="true" /> {messages.length} {messages.length === 1 ? 'message' : 'messages'}
              </span>
            </div>
            <div className="tool-hero-actions">
              <button type="button" className="civic-button outline" onClick={copyLink}>
                {copied ? <Check size={15} aria-hidden="true" /> : <Link2 size={15} aria-hidden="true" />}
                {copied ? 'Link copied' : 'Copy link to invite people'}
              </button>
            </div>
          </div>
          <ToolArt name="debates" className="tool-hero-art" />
        </div>
      </header>

      <div className="debate-grid">
        <section className="org-panel debate-chat" aria-labelledby="debate-chat-title">
          <h2 id="debate-chat-title">Conversation</h2>
          <div className="debate-messages" ref={listRef} role="log" aria-label="Messages" tabIndex={0}>
            {!loaded ? (
              <p className="org-panel-note" role="status">
                Loading the conversation…
              </p>
            ) : messages.length === 0 ? (
              <p className="org-panel-note">
                Nobody has spoken yet. Say what you think, or ask a question to get things going.
              </p>
            ) : (
              messages.map((m) => <Message key={m.id} m={m} />)
            )}
          </div>
          <form
            className="debate-composer"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <label htmlFor="debate-input" className="sr-only">
              Your message
            </label>
            <textarea
              id="debate-input"
              rows={2}
              maxLength={2000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Say what you think, or ask a question…"
            />
            <button type="submit" className="civic-button" disabled={!input.trim() || sending}>
              {sending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}
              Send
            </button>
          </form>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </section>

        <aside className="org-panel debate-helpers" aria-labelledby="debate-helpers-title">
          <h2 id="debate-helpers-title">Ask a helper</h2>
          <p className="org-panel-note">
            Helpers only speak when someone asks. The answer appears in the conversation for everyone, marked as AI.
            It can be wrong, and people make every decision.
          </p>
          <ul>
            {HELPER_TYPES.map((type) => {
              const info = HELPER_INFO[type];
              return (
                <li key={type} className="debate-helper">
                  <HelperBadge type={type} size={38} />
                  <div className="debate-helper-text">
                    <strong>{info.ask}</strong>
                    <span>
                      {info.name}: {info.askHint}
                    </span>
                    {type === 'translator' && (
                      <select
                        aria-label="Language to translate into"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as HelperLanguage)}
                      >
                        {Object.entries(HELPER_LANGUAGES).map(([code, name]) => (
                          <option key={code} value={code}>
                            {name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <button
                    type="button"
                    className="debate-helper-go"
                    onClick={() => ask(type)}
                    disabled={asking !== null || !someoneSpoke}
                    aria-label={`${info.ask} (${info.name})`}
                  >
                    {asking === type ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : 'Ask'}
                  </button>
                </li>
              );
            })}
          </ul>
          {!someoneSpoke && loaded && <p className="org-panel-note debate-helpers-wait">The helpers wake up once someone has spoken.</p>}
        </aside>
      </div>
    </div>
  );
}
