"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { PRIORITIES } from "@/lib/games/priorities";

interface Board {
  scope: string | null;
  total: number;
  points: Record<string, number>;
}
const label = (id: string) => PRIORITIES.find((p) => p.id === id)!;
const HEIGHTS = [150, 112, 84];
const PLACE_ORDER = [1, 0, 2]; // draw 2nd, 1st, 3rd from left to right

function Podium({ ids, title }: { ids: string[]; title: string }) {
  return (
    <div className="tt-podium" aria-label={title}>
      {PLACE_ORDER.map((rank) => {
        const id = ids[rank];
        return (
          <div key={rank} className={`tt-step rank-${rank + 1}`}>
            <AnimatePresence mode="popLayout">
              {id && (
                <motion.div key={id} className="tt-token" initial={{ y: -90, opacity: 0, rotateX: 60 }} animate={{ y: 0, opacity: 1, rotateX: 0 }} exit={{ y: -40, opacity: 0 }} transition={{ type: "spring", stiffness: 240, damping: 14 }}>
                  <span className="tt-emoji" aria-hidden="true">{label(id).emoji}</span>
                  <span>{label(id).label}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div className="tt-block" initial={{ height: 0 }} animate={{ height: HEIGHTS[rank] }} transition={{ type: "spring", stiffness: 80, damping: 12, delay: 0.1 * rank }}>
              <strong>{rank + 1}</strong>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

/** Pick your three priorities, then see the neighbourhood's. Not a vote, no points. */
export default function TopThree() {
  const [picks, setPicks] = useState<string[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const [view, setView] = useState<"pick" | "board">("pick");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/games/top-three")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setBoard(d.board);
        if (d.mine) setPicks(d.mine);
      })
      .catch(() => {});
  }, []);

  const toggle = (id: string) => {
    if (picks.includes(id)) setPicks(picks.filter((p) => p !== id));
    else if (picks.length < 3) setPicks([...picks, id]);
  };

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/games/top-three", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ picks }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Your choices couldn't be added.");
      setBoard(data.board);
      setView("board");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your choices couldn't be added.");
    }
    setBusy(false);
  };

  const ranked = useMemo(() => (board ? Object.entries(board.points).sort((a, b) => b[1] - a[1]) : []), [board]);
  const maxPts = ranked[0]?.[1] ?? 1;

  return (
    <div className="gp tint-peach">
      <Link href="/dashboard/games" className="workspace-back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Civic games
      </Link>
      <header className="ds-head">
        <span className="tool-hero-eyebrow">Have your say</span>
        <h1>My top three</h1>
        <p>What matters most where you live? Put three priorities on your podium, in order, and see what your neighbours chose. It isn&apos;t a vote and earns no points; it helps organisers see where to start.</p>
      </header>
      <AnimatePresence mode="wait">
        {view === "pick" ? (
          <motion.section key="pick" className="ds-build" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}>
            <Podium ids={picks} title="Your podium" />
            <p className="ds-space">{picks.length < 3 ? `Tap ${3 - picks.length} more, in order of importance.` : "Your podium is ready. Tap one to take it off."}</p>
            <div className="tt-grid">
              {PRIORITIES.map((p, i) => {
                const rank = picks.indexOf(p.id);
                return (
                  <motion.button key={p.id} type="button" className={`tt-card${rank >= 0 ? " on" : ""}`} onClick={() => toggle(p.id)} disabled={rank < 0 && picks.length >= 3} aria-pressed={rank >= 0} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }} whileHover={{ y: -4, rotate: -1 }} whileTap={{ scale: 0.94 }}>
                    <span className="tt-emoji" aria-hidden="true">{p.emoji}</span>
                    <span>{p.label}</span>
                    {rank >= 0 && <span className="tt-rank">{rank + 1}</span>}
                  </motion.button>
                );
              })}
            </div>
            {error && <p role="alert" className="form-error">{error}</p>}
            <div className="gp-actions">
              <button className="civic-button" onClick={save} disabled={busy || picks.length !== 3}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Add my top three
              </button>
              {board && board.total > 0 && (
                <button className="civic-button outline" type="button" onClick={() => setView("board")}>See the neighbourhood&apos;s</button>
              )}
            </div>
          </motion.section>
        ) : (
          <motion.section key="board" className="ds-wall" initial={{ opacity: 0, rotateX: -20 }} animate={{ opacity: 1, rotateX: 0 }}>
            <h2>{board?.scope ? `${board.scope}'s top three` : "The neighbourhood's top three"}</h2>
            <p className="gp-small">
              {board?.total ?? 0} {board?.total === 1 ? "person" : "people"} took part{board?.scope ? "" : " (shown across Cosmogov until five neighbours in your town take part)"} · 3 points for a first choice, 2 for second, 1 for third · totals only, no names
            </p>
            <Podium ids={ranked.slice(0, 3).map(([id]) => id)} title="Community podium" />
            <div className="ds-bars">
              {ranked.map(([id, pts], i) => (
                <motion.div key={id} className={`ds-bar${picks.includes(id) ? " mine" : ""}`} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 * i }}>
                  <span className="tt-emoji" aria-hidden="true">{label(id).emoji}</span>
                  <div className="ds-bar-body">
                    <span>{label(id).label} {picks.includes(id) && <em>· one of yours</em>}</span>
                    <div className="ds-bar-track"><motion.div initial={{ width: 0 }} animate={{ width: `${(pts / maxPts) * 100}%` }} transition={{ delay: 0.2 + 0.06 * i, type: "spring", stiffness: 60, damping: 14 }} /></div>
                  </div>
                  <strong>{pts}</strong>
                </motion.div>
              ))}
            </div>
            <div className="gp-actions">
              <Link className="civic-button" href={`/dashboard/proposals/new?title=${encodeURIComponent(`Let's work on: ${label(picks[0] ?? "green").label.toLowerCase()}`)}`}>
                Start a proposal on my first choice <ArrowRight size={16} />
              </Link>
              <button className="civic-button outline" type="button" onClick={() => setView("pick")}><RotateCcw size={16} /> Change my three</button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
