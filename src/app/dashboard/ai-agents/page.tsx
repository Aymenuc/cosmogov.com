'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, Copy, Loader2, Users } from 'lucide-react';
import WorkspaceHeading from '@/components/WorkspaceHeading';
import HelperBadge from '@/components/helpers/HelperBadge';
import { HELPER_INFO } from '@/components/helpers/helper-info';
import { HELPER_LANGUAGES, HELPER_TYPES, type HelperLanguage, type HelperType } from '@/lib/helper-languages';

const MAX_TEXT = 4000;

export default function AIHelpersPage() {
  const [helper, setHelper] = useState<HelperType>('accessibility');
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<HelperLanguage>('fr');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ helper: HelperType; content: string } | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const info = HELPER_INFO[helper];

  const choose = (type: HelperType) => {
    setHelper(type);
    setError('');
    setCopied(false);
    // On phones the text box sits below the six choices: bring it into view.
    if (window.matchMedia('(max-width: 900px)').matches)
      document.getElementById('helper-work')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      const res = await fetch('/api/ai/helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helper, text, language: helper === 'translator' ? language : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'The helper couldn’t answer. Try again.');
      setResult({ helper, content: data.content });
      if (typeof data.remainingToday === 'number') setLeft(data.remainingToday);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
    } catch {
      setError('Copying didn’t work here. Select the text and copy it by hand.');
    }
  };

  return (
    <div className="helpers-page">
      <WorkspaceHeading
        look="agents"
        title="AI helpers"
        description="Six AI helpers, each with one job. Use one on your own text right here, or ask them during a debate in the Assembly hall."
      >
        <Link href="/dashboard/assembly-hall" className="civic-button outline">
          <Users size={15} aria-hidden="true" /> Go to the Assembly hall
        </Link>
      </WorkspaceHeading>

      <section className="hall-section" aria-labelledby="helpers-use">
        <div className="hall-section-head">
          <h2 id="helpers-use">Use a helper</h2>
          <p>Pick one, paste your text, and get its help. Nothing is posted: the answer is only for you.</p>
        </div>

        <div className="helpers-bench">
          <div className="helpers-pick" role="radiogroup" aria-label="Choose a helper">
            {HELPER_TYPES.map((type) => {
              const h = HELPER_INFO[type];
              const on = type === helper;
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={`helpers-choice${on ? ' is-on' : ''}`}
                  onClick={() => choose(type)}
                >
                  <HelperBadge type={type} size={40} />
                  <span>
                    <strong>{h.tryLabel}</strong>
                    <span>
                      {h.name} · {h.role}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <form id="helper-work" className="org-panel helpers-work" onSubmit={run}>
            <div className="helpers-work-head">
              <HelperBadge type={helper} size={48} />
              <div>
                <h3>{info.tryLabel}</h3>
                <p>{info.tryHint}</p>
              </div>
            </div>

            <label htmlFor="helper-text" className="sr-only">
              Your text
            </label>
            <textarea
              id="helper-text"
              rows={7}
              maxLength={MAX_TEXT}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={info.placeholder}
            />
            <div className="helpers-work-row">
              {helper === 'translator' && (
                <label className="helpers-lang">
                  Into
                  <select value={language} onChange={(e) => setLanguage(e.target.value as HelperLanguage)}>
                    {Object.entries(HELPER_LANGUAGES).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <span className="helpers-count">
                {text.length.toLocaleString('en')} / {MAX_TEXT.toLocaleString('en')}
              </span>
              <button type="submit" className="civic-button" disabled={busy || !text.trim()}>
                {busy ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <HelperIcon type={helper} />}
                Ask {info.name}
              </button>
            </div>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            {result && (
              <div className="helpers-result" aria-live="polite">
                <div className="helpers-result-head">
                  <HelperBadge type={result.helper} size={30} />
                  <strong>{HELPER_INFO[result.helper].name}</strong>
                  <span className="debate-ai-tag">AI helper · check what matters</span>
                  <button type="button" className="org-text-button" onClick={copy}>
                    {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p>{result.content}</p>
              </div>
            )}
            {left !== null && <p className="helpers-left">{left} helper and assistant requests left today.</p>}
          </form>
        </div>
      </section>

      <section className="hall-section" aria-labelledby="helpers-debate">
        <div className="hall-section-head">
          <h2 id="helpers-debate">In a debate</h2>
          <p>
            In the Assembly hall, anyone taking part can ask a helper to sum up the conversation, find common ground, explain
            it to a newcomer, check the tone, simplify or translate. The answer appears for everyone, marked as AI.
          </p>
        </div>
        <Link href="/dashboard/assembly-hall" className="civic-button">
          Open the Assembly hall <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </section>

      <section className="org-panel helpers-rules" aria-labelledby="helpers-rules">
        <h2 id="helpers-rules">What the helpers won’t do</h2>
        <ul className="org-plain-list">
          <li>They never vote, sign or decide anything. People do.</li>
          <li>They only see the text you give them, or the latest messages of the debate you’re in. Never votes or private data.</li>
          <li>They help with community matters only, not general chat, homework or advice.</li>
          <li>They can be wrong. Check anything that matters before you rely on it.</li>
        </ul>
      </section>
    </div>
  );
}

function HelperIcon({ type }: { type: HelperType }) {
  const Icon = HELPER_INFO[type].icon;
  return <Icon size={15} aria-hidden="true" />;
}
