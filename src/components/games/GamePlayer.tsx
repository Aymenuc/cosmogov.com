"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Flame, GraduationCap, Loader2, RotateCcw, Sparkles, Star, Trophy, X } from "lucide-react";
import type { Answer, Feedback, GameSlug, PublicRound } from "@/lib/games/catalogue";
import GameArt from "./GameArt";

type Phase = "intro" | "loading" | "playing" | "results";
interface Finish {
  score: number;
  max: number;
  base: number;
  bonus: number;
  accuracy: number;
  xpEarned: number;
  bestStreak: number;
  rounds: number[];
  personalBest: number;
  newBest: boolean;
}

export interface GameMeta {
  slug: GameSlug;
  name: string;
  tagline: string;
  how: string;
  skill: string;
  tint: string;
  rounds: number;
  learn: string;
  apply: { href: string; label: string };
}

/* ─── Little helpers ─────────────────────────────────────────────── */

function Confetti({ burst }: { burst: number }) {
  const reduce = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: `${burst}-${i}`,
        x: (Math.random() - 0.5) * 520,
        y: -120 - Math.random() * 220,
        r: Math.random() * 540 - 270,
        c: ["#6741D9", "#FF785F", "#FFCF4D", "#28745B", "#9FD8F5"][i % 5],
        s: 6 + Math.random() * 7,
      })),
    [burst],
  );
  if (!burst || reduce) return null;
  return (
    <div className="gp-confetti" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          style={{ background: p.c, width: p.s, height: p.s * 0.6 }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.x, y: [p.y, p.y + 420], rotate: p.r, opacity: [1, 1, 0] }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 600);
      setShown(Math.round(start + (value - start) * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{shown}</>;
}

const LETTERS = "ABCDEFGH";

/* ─── Boards ─────────────────────────────────────────────────────── */

function PetitionChart({ chart }: { chart: NonNullable<Extract<PublicRound, { kind: "choice" }>["chart"]> }) {
  const max = Math.max(...chart.values, 1);
  const w = 480;
  const h = 150;
  const bw = w / chart.values.length;
  return (
    <figure className="gp-chart">
      <svg viewBox={`0 0 ${w} ${h + 22}`} role="img" aria-label="Signatures per hour over the last 24 hours">
        {chart.values.map((v, i) => {
          const bh = (v / max) * (h - 8);
          const late = i > chart.closeAt;
          return (
            <motion.rect
              key={i}
              x={i * bw + 2}
              width={bw - 4}
              rx={3}
              fill={late ? "#FF785F" : "#6741D9"}
              initial={{ y: h, height: 0 }}
              animate={{ y: h - bh, height: bh }}
              transition={{ delay: i * 0.025, type: "spring", stiffness: 140, damping: 18 }}
            />
          );
        })}
        <line x1={(chart.closeAt + 1) * bw} x2={(chart.closeAt + 1) * bw} y1={0} y2={h} stroke="#29223d" strokeWidth={2} strokeDasharray="5 5" />
        <text x={(chart.closeAt + 1) * bw - 4} y={12} textAnchor="end" className="gp-chart-label">closes</text>
        {[0, 6, 12, 18].map((hr) => (
          <text key={hr} x={hr * bw + 2} y={h + 16} className="gp-chart-label">{`${hr}:00`}</text>
        ))}
      </svg>
      <figcaption>
        {chart.facts.map((f) => (
          <span key={f} className="gp-fact">{f}</span>
        ))}
      </figcaption>
    </figure>
  );
}

function ChoiceBoard({ round, picked, setPicked, feedback }: { round: Extract<PublicRound, { kind: "choice" }>; picked: number | null; setPicked: (i: number) => void; feedback: Feedback | null }) {
  return (
    <div className="gp-board">
      {round.context && (
        <motion.blockquote className="gp-quote" initial={{ rotateX: -70, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 120, damping: 14 }}>
          “{round.context}”
        </motion.blockquote>
      )}
      {round.chart && <PetitionChart chart={round.chart} />}
      <div className="gp-options">
        {round.options.map((opt, i) => {
          const isAnswer = feedback && feedback.answerIndex === i;
          const isWrongPick = feedback && picked === i && !feedback.correct;
          return (
            <motion.button
              key={opt}
              type="button"
              className={`gp-option${picked === i ? " picked" : ""}${isAnswer ? " right" : ""}${isWrongPick ? " wrong" : ""}`}
              onClick={() => !feedback && setPicked(i)}
              disabled={Boolean(feedback)}
              initial={{ opacity: 0, y: 14 }}
              animate={isWrongPick ? { x: [0, -8, 8, -6, 6, 0], opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
              transition={{ delay: feedback ? 0 : 0.08 * i }}
              whileHover={feedback ? undefined : { y: -3 }}
              whileTap={feedback ? undefined : { scale: 0.97 }}
            >
              <span className="gp-key">{isAnswer ? <Check size={16} /> : isWrongPick ? <X size={16} /> : LETTERS[i]}</span>
              <span>{opt}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function TimelineBoard({ round, picked, setPicked, feedback }: { round: Extract<PublicRound, { kind: "timeline" }>; picked: number | null; setPicked: (i: number) => void; feedback: Feedback | null }) {
  return (
    <div className="gp-board">
      <p className="gp-outcome">{round.context}</p>
      <ol className="gp-timeline">
        {round.events.map((e, i) => {
          const isAnswer = feedback && feedback.answerIndex === i;
          const isWrongPick = feedback && picked === i && !feedback.correct;
          return (
            <motion.li key={e} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}>
              <button
                type="button"
                className={`gp-stop${picked === i ? " picked" : ""}${isAnswer ? " right" : ""}${isWrongPick ? " wrong" : ""}`}
                onClick={() => !feedback && setPicked(i)}
                disabled={Boolean(feedback)}
              >
                <span className="gp-stop-dot">{isAnswer ? "⚑" : i + 1}</span>
                <span>{e}</span>
              </button>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

function AllocateBoard({ round, chosen, setChosen, feedback }: { round: Extract<PublicRound, { kind: "allocate" }>; chosen: string[]; setChosen: (ids: string[]) => void; feedback: Feedback | null }) {
  const cost = round.projects.filter((p) => chosen.includes(p.id)).reduce((s, p) => s + p.cost, 0);
  const helped = round.projects.filter((p) => chosen.includes(p.id)).reduce((s, p) => s + p.helps, 0);
  const over = cost > round.budget;
  const pct = Math.min(100, (cost / round.budget) * 100);
  return (
    <div className="gp-board">
      <div className={`gp-jar${over ? " over" : ""}`}>
        <div className="gp-jar-top">
          <strong>€{cost}k</strong> of €{round.budget}k
          <span className="gp-helped">
            <Sparkles size={14} aria-hidden="true" /> {helped} people helped
          </span>
        </div>
        <div className="gp-jar-bar" role="progressbar" aria-label="Budget used" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
        <div className="gp-areas">
          {round.areas.map((a) => {
            const served = round.projects.some((p) => p.area === a && chosen.includes(p.id));
            return (
              <motion.span key={a} className={`gp-area${served ? " served" : ""}`} animate={served ? { scale: [1, 1.15, 1] } : {}}>
                {served ? "✓" : "○"} {a}
              </motion.span>
            );
          })}
        </div>
      </div>
      <div className="gp-projects">
        {round.projects.map((p, i) => {
          const on = chosen.includes(p.id);
          return (
            <motion.button
              key={p.id}
              type="button"
              className={`gp-project area-${round.areas.indexOf(p.area)}${on ? " on" : ""}`}
              aria-pressed={on}
              disabled={Boolean(feedback)}
              onClick={() => setChosen(on ? chosen.filter((x) => x !== p.id) : [...chosen, p.id])}
              initial={{ opacity: 0, rotateY: -60 }}
              animate={{ opacity: 1, rotateY: 0, y: on ? -6 : 0 }}
              transition={{ delay: feedback ? 0 : 0.06 * i, type: "spring", stiffness: 160, damping: 16 }}
              whileHover={feedback ? undefined : { rotateX: 6, rotateY: -6 }}
            >
              <span className="gp-project-area">{p.area}</span>
              <strong>{p.name}</strong>
              <span className="gp-project-meta">
                <span>€{p.cost}k</span>
                <span>{p.helps} people</span>
              </span>
              {on && <span className="gp-project-tick"><Check size={14} /></span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function EstimateBoard({ round, guess, setGuess, feedback }: { round: Extract<PublicRound, { kind: "estimate" }>; guess: { value: number; spread: number }; setGuess: (g: { value: number; spread: number }) => void; feedback: Feedback | null }) {
  const yes = round.sample.filter(Boolean).length;
  const low = Math.max(0, guess.value - guess.spread);
  const high = Math.min(100, guess.value + guess.spread);
  const truth = feedback ? Number(/(\d+)%/.exec(feedback.headline)?.[1] ?? NaN) : NaN;
  const cols = round.sample.length <= 25 ? 10 : round.sample.length <= 100 ? 20 : 25;
  return (
    <div className="gp-board">
      <div className="gp-crowd" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 30px))` }} aria-label={`${yes} of ${round.sample.length} said yes`} role="img">
        {round.sample.map((s, i) => (
          <motion.span
            key={i}
            className={s ? "yes" : "no"}
            initial={{ y: -30, opacity: 0, scale: 0.4 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(1.2, i * 0.008), type: "spring", stiffness: 260, damping: 16 }}
          />
        ))}
      </div>
      <p className="gp-crowd-count">
        <span className="dot yes" /> {yes} said yes · <span className="dot no" /> {round.sample.length - yes} said no
      </p>
      <div className="gp-scale">
        <div className="gp-scale-track">
          <motion.div className="gp-scale-band" animate={{ left: `${low}%`, width: `${high - low}%` }} />
          <motion.div className="gp-scale-guess" animate={{ left: `${guess.value}%` }} />
          {Number.isFinite(truth) && (
            <motion.div className="gp-scale-truth" initial={{ left: "0%", opacity: 0 }} animate={{ left: `${truth}%`, opacity: 1 }} transition={{ type: "spring", stiffness: 70, damping: 14 }}>
              <span>{truth}%</span>
            </motion.div>
          )}
        </div>
        <div className="gp-scale-ticks" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
      </div>
      <label className="gp-slider">
        <span>Your best guess: <strong>{guess.value}%</strong></span>
        <input type="range" min={0} max={100} value={guess.value} disabled={Boolean(feedback)} onChange={(e) => setGuess({ ...guess, value: Number(e.target.value) })} />
      </label>
      <label className="gp-slider">
        <span>How sure? Range <strong>{low}–{high}%</strong></span>
        <input type="range" min={1} max={40} value={guess.spread} disabled={Boolean(feedback)} onChange={(e) => setGuess({ ...guess, spread: Number(e.target.value) })} />
      </label>
    </div>
  );
}

const AVATAR = ["#6741D9", "#FF785F", "#28745B", "#226784", "#A44231", "#916500"];
function ResidentsBoard({ round, picked, setPicked, feedback }: { round: Extract<PublicRound, { kind: "residents" }>; picked: number | null; setPicked: (i: number) => void; feedback: Feedback | null }) {
  const accepts = (o: { features: string[] }, p: { wants: string; refuses: string }) => o.features.includes(p.wants) && !o.features.includes(p.refuses);
  return (
    <div className="gp-board">
      <div className="gp-residents">
        {round.residents.map((p, i) => (
          <motion.div key={p.name} className="gp-resident" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.07 * i, type: "spring" }}>
            <span className="gp-avatar" style={{ background: AVATAR[i % AVATAR.length] }}>{p.name[0]}</span>
            <strong>{p.name}</strong>
            <span className="want">+ {p.wants}</span>
            <span className="refuse">× {p.refuses}</span>
          </motion.div>
        ))}
      </div>
      <div className="gp-plans">
        {round.options.map((o, i) => {
          const isAnswer = feedback && feedback.answerIndex === i;
          return (
            <motion.button
              key={o.label}
              type="button"
              className={`gp-plan${picked === i ? " picked" : ""}${isAnswer ? " right" : ""}`}
              onClick={() => !feedback && setPicked(i)}
              disabled={Boolean(feedback)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + 0.08 * i }}
              whileHover={feedback ? undefined : { y: -4 }}
            >
              <strong>{o.label}</strong>
              <ul>{o.features.map((f) => <li key={f}>{f}</li>)}</ul>
              {feedback && (
                <div className="gp-plan-fans">
                  {round.residents.map((p, j) =>
                    accepts(o, p) ? (
                      <motion.span key={p.name} className="gp-avatar small" style={{ background: AVATAR[j % AVATAR.length] }} initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 * j, type: "spring", stiffness: 300, damping: 14 }} title={p.name}>
                        {p.name[0]}
                      </motion.span>
                    ) : null,
                  )}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── The player ─────────────────────────────────────────────────── */

export default function GamePlayer({ meta }: { meta: GameMeta }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [daily, setDaily] = useState(false);
  const [token, setToken] = useState("");
  const [rounds, setRounds] = useState<PublicRound[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [guess, setGuess] = useState({ value: 50, spread: 15 });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [burst, setBurst] = useState(0);
  const [result, setResult] = useState<Finish | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const round = rounds[index];

  const start = useCallback(
    async (mode: "daily" | "practice") => {
      setError("");
      setPhase("loading");
      try {
        const res = await fetch(`/api/games/play/${meta.slug}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "The game couldn't start.");
        setToken(data.token);
        setRounds(data.rounds);
        setDaily(Boolean(data.daily));
        setIndex(0);
        setAnswers([]);
        setScore(0);
        setStreak(0);
        setFeedback(null);
        setPicked(null);
        setChosen([]);
        setGuess({ value: 50, spread: 15 });
        setResult(null);
        setPhase("playing");
      } catch (e) {
        setError(e instanceof Error ? e.message : "The game couldn't start.");
        setPhase("intro");
      }
    },
    [meta.slug],
  );

  const currentAnswer = (): Answer | null => {
    if (!round) return null;
    if (round.kind === "allocate") return chosen;
    if (round.kind === "estimate") return { value: guess.value, low: Math.max(0, guess.value - guess.spread), high: Math.min(100, guess.value + guess.spread) };
    return picked;
  };

  const submit = async () => {
    const answer = currentAnswer();
    if (answer === null || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/games/play/${meta.slug}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, index, answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "That answer couldn't be checked.");
      const fb = data as Feedback;
      setFeedback(fb);
      setAnswers((a) => [...a, answer]);
      setScore((s) => s + fb.points);
      setStreak((s) => (fb.correct ? s + 1 : 0));
      if (fb.correct || fb.points >= 80) setBurst((b) => b + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That answer couldn't be checked.");
    }
    setBusy(false);
  };

  const next = async () => {
    if (index + 1 < rounds.length) {
      setIndex((i) => i + 1);
      setFeedback(null);
      setPicked(null);
      setChosen([]);
      setGuess({ value: 50, spread: 15 });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/games/play/${meta.slug}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Your result couldn't be saved.");
      setResult(data);
      setPhase("results");
      if (data.newBest) setBurst((b) => b + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your result couldn't be saved.");
    }
    setBusy(false);
  };

  // Keyboard: 1–8 picks an option, Enter checks or moves on.
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const n = Number(e.key);
      if (!feedback && n >= 1 && n <= 8 && round && (round.kind === "choice" || round.kind === "timeline" || round.kind === "residents")) {
        const max = round.kind === "timeline" ? round.events.length : round.options.length;
        if (n <= max) setPicked(n - 1);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (feedback) next();
        else submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const ready = round ? (round.kind === "allocate" ? chosen.length > 0 : round.kind === "estimate" ? true : picked !== null) : false;
  const stars = result ? (result.accuracy >= 0.85 ? 3 : result.accuracy >= 0.6 ? 2 : result.accuracy >= 0.3 ? 1 : 0) : 0;

  return (
    <div className={`gp tint-${meta.tint}`}>
      <Confetti burst={burst} />
      <Link href="/dashboard/games" className="workspace-back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Civic games
      </Link>

      <AnimatePresence mode="wait">
        {(phase === "intro" || phase === "loading") && (
          <motion.section key="intro" className="gp-intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="gp-intro-text">
              <span className="tool-hero-eyebrow">{meta.skill}</span>
              <h1>{meta.name}</h1>
              <p className="gp-tagline">{meta.tagline}</p>
              <p>{meta.how}</p>
              <p className="gp-learn"><GraduationCap size={16} aria-hidden="true" /> <span><strong>You&apos;ll learn:</strong> {meta.learn}</span></p>
              <p className="gp-small">{meta.rounds} rounds · answers checked on our side · streaks earn a bonus</p>
              {error && <p role="alert" className="form-error">{error}</p>}
              <div className="gp-intro-actions">
                <button className="civic-button" onClick={() => start("daily")} disabled={phase === "loading"}>
                  {phase === "loading" ? <Loader2 size={16} className="animate-spin" /> : <CalendarDays size={16} />} Today&apos;s challenge
                </button>
                <button className="civic-button outline" onClick={() => start("practice")} disabled={phase === "loading"}>
                  Practice round
                </button>
              </div>
              <p className="gp-small">Today&apos;s challenge is the same for everyone. Practice rounds are new every time.</p>
            </div>
            <motion.div className="gp-intro-art" initial={{ rotateY: -30, rotateX: 10 }} animate={{ rotateY: 0, rotateX: 0 }} transition={{ type: "spring", stiffness: 60, damping: 12 }}>
              <GameArt slug={meta.slug} />
            </motion.div>
          </motion.section>
        )}

        {phase === "playing" && round && (
          <motion.section key={`round-${index}`} className="gp-stage" initial={{ opacity: 0, rotateY: 25, x: 60 }} animate={{ opacity: 1, rotateY: 0, x: 0 }} exit={{ opacity: 0, rotateY: -25, x: -60 }} transition={{ type: "spring", stiffness: 110, damping: 18 }}>
            <header className="gp-hud">
              <div>
                <span className="gp-small">{daily ? "Today's challenge" : "Practice"} · {meta.name}</span>
                <h2>{round.prompt}</h2>
              </div>
              <div className="gp-hud-stats">
                <span className="gp-score" aria-label={`Score ${score}`}>
                  <Star size={16} aria-hidden="true" /> <CountUp value={score} />
                </span>
                <AnimatePresence>
                  {streak >= 2 && (
                    <motion.span className="gp-streak" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} key={streak}>
                      <Flame size={16} aria-hidden="true" /> {streak} in a row
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </header>
            <ol className="gp-path" aria-label={`Round ${index + 1} of ${rounds.length}`}>
              {rounds.map((_, i) => (
                <li key={i} className={i < index ? "done" : i === index ? "now" : ""} />
              ))}
            </ol>

            {round.kind === "choice" && <ChoiceBoard round={round} picked={picked} setPicked={setPicked} feedback={feedback} />}
            {round.kind === "timeline" && <TimelineBoard round={round} picked={picked} setPicked={setPicked} feedback={feedback} />}
            {round.kind === "allocate" && <AllocateBoard round={round} chosen={chosen} setChosen={setChosen} feedback={feedback} />}
            {round.kind === "estimate" && <EstimateBoard round={round} guess={guess} setGuess={setGuess} feedback={feedback} />}
            {round.kind === "residents" && <ResidentsBoard round={round} picked={picked} setPicked={setPicked} feedback={feedback} />}

            {error && <p role="alert" className="form-error">{error}</p>}

            <AnimatePresence>
              {feedback && (
                <motion.div className={`gp-feedback${feedback.correct ? " good" : feedback.points > 0 ? " ok" : " bad"}`} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} role="status">
                  <div className="gp-feedback-points">+{feedback.points}</div>
                  <div>
                    <strong>{feedback.headline}</strong>
                    <p>{feedback.explanation}</p>
                    {feedback.extra && <p className="gp-extra">{feedback.extra}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="gp-actions">
              {!feedback ? (
                <button className="civic-button" onClick={submit} disabled={!ready || busy}>
                  {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                  {round.kind === "allocate" ? "Fund this plan" : round.kind === "estimate" ? "Lock in my guess" : "Check"}
                </button>
              ) : (
                <button className="civic-button" onClick={next} disabled={busy}>
                  {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                  {index + 1 < rounds.length ? "Next round" : "See my result"} <ArrowRight size={16} />
                </button>
              )}
              <span className="gp-small">Tip: number keys pick, Enter confirms.</span>
            </div>
          </motion.section>
        )}

        {phase === "results" && result && (
          <motion.section key="results" className="gp-results" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 120, damping: 14 }}>
            <div className="gp-stars" aria-label={`${stars} of 3 stars`}>
              {[0, 1, 2].map((i) => (
                <motion.span key={i} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.25 + i * 0.2, type: "spring", stiffness: 260, damping: 12 }}>
                  <Star size={44} className={i < stars ? "lit" : ""} />
                </motion.span>
              ))}
            </div>
            <h2>{stars === 3 ? "Brilliant" : stars === 2 ? "Nicely done" : stars === 1 ? "Good start" : "Keep practising"}</h2>
            <p className="gp-final"><CountUp value={result.score} /> <span>points</span></p>
            <p className="gp-small">
              {result.base} for answers{result.bonus ? ` + ${result.bonus} streak bonus` : ""} · best streak {result.bestStreak} · +{result.xpEarned} XP
            </p>
            {result.newBest ? (
              <p className="gp-best"><Trophy size={16} /> New personal best!</p>
            ) : (
              <p className="gp-small">Your best: {result.personalBest}</p>
            )}
            <div className="gp-bars" aria-label="Points per round">
              {result.rounds.map((p, i) => (
                <div key={i} className="gp-bar">
                  <motion.span initial={{ height: 0 }} animate={{ height: `${Math.max(4, p)}%` }} transition={{ delay: 0.4 + i * 0.08, type: "spring" }} className={p >= 80 ? "good" : p > 0 ? "ok" : "bad"} />
                  <small>{i + 1}</small>
                </div>
              ))}
            </div>
            <div className="gp-lesson">
              <GraduationCap size={18} aria-hidden="true" />
              <div>
                <strong>What you practised</strong>
                <p>{meta.learn}</p>
                <Link href={meta.apply.href}>{meta.apply.label} <ArrowRight size={14} aria-hidden="true" /></Link>
              </div>
            </div>
            <div className="gp-intro-actions">
              <button className="civic-button" onClick={() => start("practice")}>
                <RotateCcw size={16} /> Play a practice round
              </button>
              <Link className="civic-button outline" href="/dashboard/games">More games</Link>
            </div>
            <p className="gp-small">Games build your game-skill score. They never change the weight of a vote.</p>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
