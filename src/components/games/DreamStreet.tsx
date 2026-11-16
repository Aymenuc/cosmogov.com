"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { STREET_ITEMS, STREET_SPACE, VIBES } from "@/lib/games/street-items";
import StreetIcon from "./StreetIcon";

interface Wall {
  scope: string | null;
  total: number;
  items: Record<string, number>;
  vibes: Record<string, number>;
}
const item = (id: string) => STREET_ITEMS.find((i) => i.id === id)!;

/** Build your ideal street, then see what the neighbourhood dreams of. */
export default function DreamStreet() {
  const reduce = useReducedMotion();
  const [placed, setPlaced] = useState<string[]>([]);
  const [vibe, setVibe] = useState<(typeof VIBES)[number]>("Green");
  const [note, setNote] = useState("");
  const [wall, setWall] = useState<Wall | null>(null);
  const [view, setView] = useState<"build" | "wall">("build");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/games/dream-street")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setWall(d.wall);
        if (d.mine) {
          setPlaced(d.mine.items);
          setVibe(d.mine.vibe);
          setNote(d.mine.note);
        }
      })
      .catch(() => {});
  }, []);

  const used = placed.reduce((s, id) => s + item(id).space, 0);
  const left = STREET_SPACE - used;

  const add = (id: string) => {
    if (placed.includes(id) || item(id).space > left) return;
    setPlaced([...placed, id]);
  };
  const remove = (id: string) => setPlaced(placed.filter((x) => x !== id));

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/games/dream-street", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: placed, vibe, note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Your street couldn't be added.");
      setWall(data.wall);
      setView("wall");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your street couldn't be added.");
    }
    setBusy(false);
  };

  const top = useMemo(
    () =>
      wall
        ? Object.entries(wall.items)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
        : [],
    [wall],
  );
  const proposalHref = `/dashboard/proposals/new?title=${encodeURIComponent(`A ${vibe.toLowerCase()} street: ${placed.map((id) => item(id).label.toLowerCase()).slice(0, 3).join(", ")}`)}&description=${encodeURIComponent(
    `I'd like our street to be ${vibe.toLowerCase()}, with: ${placed.map((id) => item(id).label.toLowerCase()).join(", ")}.${note.trim() ? `\n\nWhy: ${note.trim()}` : ""}`,
  )}`;

  return (
    <div className="gp tint-sky ds">
      <Link href="/dashboard/games" className="workspace-back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Civic games
      </Link>
      <header className="ds-head">
        <span className="tool-hero-eyebrow">Have your say</span>
        <h1>Dream street</h1>
        <p>
          Build the street you&apos;d love to live on. Tap things to place them, pick a vibe, and add it to your
          neighbourhood&apos;s wish wall. It isn&apos;t a vote: it shows organisers what people dream of, and you can
          turn it into a proposal.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {view === "build" ? (
          <motion.section key="build" className="ds-build" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}>
            <div className={`ds-scene vibe-${vibe.toLowerCase()}`}>
              <svg className="ds-houses" viewBox="0 0 800 160" preserveAspectRatio="none" aria-hidden="true">
                {[0, 110, 230, 330, 450, 560, 680].map((x, i) => (
                  <g key={x}>
                    <rect x={x + 10} y={60 + (i % 3) * 14} width="90" height={100 - (i % 3) * 14} fill={["#ffe5dc", "#fff1c6", "#ece5ff", "#dff5e8"][i % 4]} stroke="#29223d" strokeWidth="2.5" />
                    <path d={`M${x + 4} ${62 + (i % 3) * 14} L${x + 55} ${26 + (i % 3) * 14} L${x + 106} ${62 + (i % 3) * 14}Z`} fill={["#ff785f", "#6741d9", "#28745b", "#a44231"][i % 4]} stroke="#29223d" strokeWidth="2.5" />
                    <rect x={x + 30} y={110} width="16" height="22" fill="#9fd8f5" stroke="#29223d" strokeWidth="2" />
                    <rect x={x + 62} y={110} width="16" height="22" fill="#9fd8f5" stroke="#29223d" strokeWidth="2" />
                  </g>
                ))}
              </svg>
              <div className="ds-pavement" role="list" aria-label={`Your street: ${used} of ${STREET_SPACE} spaces used`}>
                {placed.map((id, i) => (
                  <motion.button
                    key={id}
                    role="listitem"
                    type="button"
                    className="ds-placed"
                    style={{ gridColumn: `span ${item(id).space}` }}
                    onClick={() => remove(id)}
                    aria-label={`Remove ${item(id).label}`}
                    initial={reduce ? false : { y: -120, rotateX: 70, opacity: 0 }}
                    animate={{ y: 0, rotateX: 0, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.02 * i }}
                    whileHover={{ y: -4 }}
                  >
                    <StreetIcon id={id} size={item(id).space === 2 ? 72 : 56} />
                    <span>{item(id).label}</span>
                  </motion.button>
                ))}
                {Array.from({ length: left }, (_, i) => (
                  <span key={`empty-${i}`} className="ds-empty" aria-hidden="true">+</span>
                ))}
              </div>
              <div className="ds-road" aria-hidden="true">
                <span className="ds-stripes" />
                {placed.includes("bikes") && !reduce && (
                  <motion.span className="ds-mover" initial={{ x: "-10%" }} animate={{ x: "110%" }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }}>
                    <StreetIcon id="bikes" size={34} />
                  </motion.span>
                )}
              </div>
            </div>

            <p className="ds-space">
              <strong>{left}</strong> of {STREET_SPACE} spaces left · tap something on the street to remove it
            </p>
            <div className="ds-palette">
              {STREET_ITEMS.map((it, i) => {
                const on = placed.includes(it.id);
                const fits = it.space <= left;
                return (
                  <motion.button
                    key={it.id}
                    type="button"
                    className={`ds-item${on ? " on" : ""}`}
                    disabled={on || !fits}
                    onClick={() => add(it.id)}
                    aria-label={`${it.label}, takes ${it.space} ${it.space === 1 ? "space" : "spaces"}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * i }}
                    whileHover={on || !fits ? undefined : { y: -4, rotate: -2 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <StreetIcon id={it.id} size={44} />
                    <span>{it.label}</span>
                    <small>{on ? <Check size={12} /> : `${it.space} ${it.space === 1 ? "space" : "spaces"}`}</small>
                  </motion.button>
                );
              })}
            </div>

            <fieldset className="ds-vibes">
              <legend>The feel of your street</legend>
              {VIBES.map((v) => (
                <button key={v} type="button" className={vibe === v ? "on" : ""} aria-pressed={vibe === v} onClick={() => setVibe(v)}>
                  {v}
                </button>
              ))}
            </fieldset>
            <label className="ds-note">
              <span>One line about why (optional, only organisers see it)</span>
              <input value={note} maxLength={160} onChange={(e) => setNote(e.target.value)} placeholder="So kids can walk to school safely…" />
            </label>
            {error && <p role="alert" className="form-error">{error}</p>}
            <div className="gp-actions">
              <button className="civic-button" onClick={save} disabled={busy || placed.length === 0}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Add my street to the wall
              </button>
              {wall && wall.total > 0 && (
                <button className="civic-button outline" type="button" onClick={() => setView("wall")}>
                  See the wish wall
                </button>
              )}
            </div>
          </motion.section>
        ) : (
          <motion.section key="wall" className="ds-wall" initial={{ opacity: 0, rotateX: -20 }} animate={{ opacity: 1, rotateX: 0 }} transition={{ type: "spring", stiffness: 90, damping: 14 }}>
            <h2>
              {wall?.scope ? `What ${wall.scope} dreams of` : "What neighbours dream of"}
            </h2>
            <p className="gp-small">
              {wall?.total ?? 0} {wall?.total === 1 ? "street" : "streets"} so far
              {wall?.scope ? "" : " (shown across Cosmogov until five neighbours in your town take part)"} · counts only, no names
            </p>
            <div className="ds-bars">
              {top.map(([id, n], i) => {
                const pct = wall && wall.total ? Math.round((n / wall.total) * 100) : 0;
                return (
                  <motion.div key={id} className={`ds-bar${placed.includes(id) ? " mine" : ""}`} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 * i }}>
                    <StreetIcon id={id} size={40} />
                    <div className="ds-bar-body">
                      <span>
                        {item(id).label} {placed.includes(id) && <em>· on your street</em>}
                      </span>
                      <div className="ds-bar-track">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.2 + 0.08 * i, type: "spring", stiffness: 60, damping: 14 }} />
                      </div>
                    </div>
                    <strong>{pct}%</strong>
                  </motion.div>
                );
              })}
            </div>
            {wall && Object.keys(wall.vibes).length > 0 && (
              <p className="ds-vibe-line">
                Favourite feel:{" "}
                {Object.entries(wall.vibes)
                  .sort((a, b) => b[1] - a[1])
                  .map(([v, n]) => `${v} (${n})`)
                  .join(" · ")}
              </p>
            )}
            <div className="gp-actions">
              <Link className="civic-button" href={proposalHref}>
                Turn my street into a proposal <ArrowRight size={16} />
              </Link>
              <button className="civic-button outline" type="button" onClick={() => setView("build")}>
                <RotateCcw size={16} /> Change my street
              </button>
            </div>
            <p className="gp-small">Dream street never counts as a vote and earns no points. Your street replaces your earlier one.</p>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
