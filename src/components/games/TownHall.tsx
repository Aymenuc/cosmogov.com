"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Copy, Crown, Ear, Leaf, Loader2, Newspaper, Users, Wallet, HeartHandshake } from "lucide-react";
import {
  ASK_COST,
  DISTRICTS,
  GROUPS,
  GROUP_INFO,
  MONTHS,
  applyDecision,
  startState,
  yearOf,
  type Dilemma,
  type Group,
  type TownState,
  type Verdict,
} from "@/lib/games/townhall";

/* ─── Shared pieces ──────────────────────────────────────────────── */

const BUILD_LOOK: Record<string, { color: string; h: number; label: string }> = {
  park: { color: "#3e9b6e", h: 10, label: "Park" },
  housing: { color: "#ff785f", h: 46, label: "Homes" },
  clinic: { color: "#9fd8f5", h: 30, label: "Clinic" },
  market: { color: "#ffcf4d", h: 18, label: "Market" },
  youth: { color: "#9b7bff", h: 16, label: "Youth space" },
  bus: { color: "#226784", h: 22, label: "Bus hub" },
  factory: { color: "#7a6f86", h: 40, label: "Factory" },
  plaza: { color: "#f0b48e", h: 12, label: "Pop-up plaza" },
};

function Meter({ icon, label, value, max = 100, warn }: { icon: React.ReactNode; label: string; value: number; max?: number; warn?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`th-meter${warn ? " warn" : ""}`}>
      <span className="th-meter-label">{icon} {label}</span>
      <div className="th-meter-track"><motion.div animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 80, damping: 16 }} /></div>
      <motion.strong key={value} initial={{ scale: 1.4 }} animate={{ scale: 1 }}>{value}</motion.strong>
    </div>
  );
}

function face(m: number) {
  return m >= 70 ? "😄" : m >= 55 ? "🙂" : m >= 40 ? "😐" : m >= 25 ? "😟" : "😠";
}

function Moods({ state, highlight }: { state: TownState; highlight?: Group | null }) {
  return (
    <div className="th-moods">
      {GROUPS.map((g) => (
        <div key={g} className={`th-mood${highlight === g ? " me" : ""}`} style={{ borderColor: GROUP_INFO[g].color }}>
          <motion.span key={face(state.mood[g])} className="th-face" initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 12 }}>
            {face(state.mood[g])}
          </motion.span>
          <span className="th-mood-name">{GROUP_INFO[g].emoji} {GROUP_INFO[g].name}</span>
          <div className="th-meter-track small"><motion.div style={{ background: GROUP_INFO[g].color }} animate={{ width: `${state.mood[g]}%` }} transition={{ type: "spring", stiffness: 80, damping: 16 }} /></div>
        </div>
      ))}
    </div>
  );
}

function TownMap({ state }: { state: TownState }) {
  const reduce = useReducedMotion();
  return (
    <div className="th-map-wrap" aria-label={`Town map with ${state.buildings.length} new buildings`} role="img">
      <motion.div className="th-map" initial={reduce ? false : { rotateX: 0, rotateZ: 0 }} animate={{ rotateX: 55, rotateZ: -42 }} transition={{ type: "spring", stiffness: 40, damping: 12 }}>
        {DISTRICTS.map((d, i) => (
          <div key={d} className={`th-district d${i}`}>
            <span className="th-district-name">{d}</span>
            {/* a few existing houses */}
            {[0, 1, 2].map((k) => (
              <span key={k} className="th-block existing" style={{ left: `${18 + k * 26}%`, top: `${20 + (k % 2) * 34}%`, ["--h" as string]: `${14 + ((i + k) % 3) * 8}px` }} />
            ))}
            {state.buildings
              .filter((b) => b.district === i)
              .map((b, k) => (
                <motion.span
                  key={`${b.kind}-${b.month}`}
                  className="th-block new"
                  title={BUILD_LOOK[b.kind].label}
                  style={{ left: `${30 + (k % 2) * 30}%`, top: `${44 + Math.floor(k / 2) * 22}%`, background: BUILD_LOOK[b.kind].color, ["--h" as string]: `${BUILD_LOOK[b.kind].h}px` }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 12 }}
                />
              ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function Delta({ v, unit = "" }: { v: number; unit?: string }) {
  if (!v) return null;
  return <span className={`th-delta ${v > 0 ? "up" : "down"}`}>{v > 0 ? "+" : ""}{v}{unit}</span>;
}

function Newspaper_({ v, state, extra }: { v: Verdict; state: TownState; extra?: React.ReactNode }) {
  return (
    <motion.section className="th-paper" initial={{ rotate: -8, scale: 0.6, opacity: 0 }} animate={{ rotate: -1.5, scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 90, damping: 12 }}>
      <header>
        <span>THE TOWN GAZETTE</span>
        <span>End of year edition</span>
      </header>
      <h2>{v.headline}</h2>
      <div className="th-paper-cols">
        <div>
          <p className="th-paper-score"><Newspaper size={18} /> Score <strong>{v.score}</strong></p>
          <p>Average mood {v.average} · lowest: {GROUP_INFO[v.lowest.group].name} ({v.lowest.mood}) · trust {state.trust} · environment {state.env} · budget €{state.budget}k</p>
          <h3>Lessons from the year</h3>
          <ul>{v.lessons.map((l) => <li key={l}>{l}</li>)}</ul>
        </div>
        <div className="th-paper-map"><TownMap state={state} /></div>
      </div>
      <h3>The year in brief</h3>
      <ol className="th-paper-log">
        {state.log.map((l) => (
          <li key={l.month}><strong>{MONTHS[l.month]}</strong>: {l.title}. {l.choice}.{l.asked ? " (Residents were asked first.)" : ""}</li>
        ))}
      </ol>
      {extra}
    </motion.section>
  );
}

/* ─── Solo ───────────────────────────────────────────────────────── */

function Solo() {
  const [seed, setSeed] = useState<number | null>(null);
  const [token, setToken] = useState("");
  const [state, setState] = useState<TownState>(startState());
  const [asked, setAsked] = useState(false);
  const [last, setLast] = useState<{ before: TownState; option: number } | null>(null);
  const [decisions, setDecisions] = useState<{ choice: number; asked: boolean }[]>([]);
  const [result, setResult] = useState<(Verdict & { xpEarned: number; newBest: boolean }) | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const year = useMemo(() => (seed ? yearOf(seed) : []), [seed]);
  // While showing the outcome, stay on the month just decided.
  const dilemma: Dilemma | undefined = last ? year[state.month - 1] : year[state.month];

  const begin = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/games/town-hall/start", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Couldn't start the year.");
      setSeed(d.seed);
      setToken(d.token);
      setState(startState());
      setDecisions([]);
      setResult(null);
      setLast(null);
      setAsked(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start the year.");
    }
    setBusy(false);
  };

  const choose = (i: number) => {
    if (!dilemma || last) return;
    const before = state;
    setState(applyDecision(state, dilemma, i, asked));
    setDecisions((d) => [...d, { choice: i, asked }]);
    setLast({ before, option: i });
  };

  const nextMonth = async () => {
    setLast(null);
    setAsked(false);
    if (decisions.length === 12) {
      setBusy(true);
      try {
        const res = await fetch("/api/games/town-hall/finish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, decisions }) });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Your year couldn't be saved.");
        setResult(d);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Your year couldn't be saved.");
      }
      setBusy(false);
    }
  };

  if (!seed)
    return (
      <div className="th-intro-actions">
        {error && <p role="alert" className="form-error">{error}</p>}
        <button className="civic-button" onClick={begin} disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : null} Start my year</button>
      </div>
    );

  if (result) return <Newspaper_ v={result} state={state} extra={<div className="gp-intro-actions"><button className="civic-button" onClick={begin}>Play another year</button><Link className="civic-button outline" href="/dashboard/games">More games</Link></div>} />;

  return (
    <div className="th-game">
      <div className="th-top">
        <ol className="th-months" aria-label={`Month ${Math.min(12, state.month + 1)} of 12`}>
          {MONTHS.map((m, i) => <li key={m} className={i < state.month ? "done" : i === state.month ? "now" : ""} title={m}>{m.slice(0, 1)}</li>)}
        </ol>
        <div className="th-meters">
          <Meter icon={<Wallet size={14} />} label="Budget €k" value={state.budget} max={120} warn={state.budget < 10} />
          <Meter icon={<HeartHandshake size={14} />} label="Trust" value={state.trust} />
          <Meter icon={<Leaf size={14} />} label="Environment" value={state.env} />
        </div>
      </div>
      <div className="th-main">
        <div className="th-left">
          <TownMap state={state} />
          <Moods state={state} />
        </div>
        <AnimatePresence mode="wait">
          {dilemma && (
            <motion.div key={dilemma.id} className="th-card" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -90, opacity: 0 }} transition={{ type: "spring", stiffness: 90, damping: 16 }}>
              <span className="th-card-month">{MONTHS[last ? state.month - 1 : state.month]}</span>
              <h2>{dilemma.title}</h2>
              <p>{dilemma.text}</p>
              {!last && (
                <button className={`th-ask${asked ? " on" : ""}`} onClick={() => setAsked(true)} disabled={asked}>
                  <Ear size={16} /> {asked ? "You asked residents: here's how each group feels" : `Ask residents first (−€${ASK_COST}k, builds trust)`}
                </button>
              )}
              <div className="th-options">
                {dilemma.options.map((o, i) => {
                  const show = asked || last;
                  return (
                    <motion.button key={o.label} className={`th-option${last?.option === i ? " chosen" : ""}`} onClick={() => choose(i)} disabled={Boolean(last)} whileHover={last ? undefined : { y: -4 }} whileTap={{ scale: 0.97 }}>
                      <strong>{o.label}</strong>
                      <span className="th-effects">
                        <Delta v={o.effect.budget ?? 0} unit="k €" />
                        <Delta v={o.effect.env ?? 0} unit=" env" />
                        {show ? (
                          GROUPS.map((g) => (o.effect.mood?.[g] ? <motion.span key={g} initial={{ scale: 0 }} animate={{ scale: 1 }} className={`th-delta ${(o.effect.mood?.[g] ?? 0) > 0 ? "up" : "down"}`}>{GROUP_INFO[g].emoji} {(o.effect.mood?.[g] ?? 0) > 0 ? "+" : ""}{o.effect.mood?.[g]}</motion.span> : null))
                        ) : (
                          <span className="th-delta unknown">Who's affected? Ask residents</span>
                        )}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              {last && (
                <motion.div className="th-result" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                  <p>{dilemma.options[last.option].effect.note}</p>
                  <button className="civic-button" onClick={nextMonth} disabled={busy}>
                    {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                    {decisions.length === 12 ? "Read the year-end paper" : `On to ${MONTHS[state.month]}`} <ArrowRight size={16} />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && <p role="alert" className="form-error">{error}</p>}
    </div>
  );
}

/* ─── Council (play together) ────────────────────────────────────── */

type RoomView = {
  code: string;
  status: "lobby" | "playing" | "done";
  isHost: boolean;
  me: { name: string; group: Group } | null;
  players: { name: string; group: Group; voted: boolean; isHost: boolean }[];
  missing: Group[];
  month: number;
  state: TownState;
  dilemma: { id: string; title: string; text: string; options: { label: string; budget: number; env: number; trust: number; mine: number | null }[] } | null;
  reactions: Record<string, Record<string, "good" | "ok" | "bad">>;
  tally: number[];
  myVote: number | null;
  verdict: Verdict | null;
};

function Council() {
  const [room, setRoom] = useState<RoomView | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const act = useCallback(async (body: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/games/council", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "That didn't work.");
      setRoom(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work.");
    }
    setBusy(false);
  }, []);

  // Keep the room in sync with the other players.
  useEffect(() => {
    if (!room || room.status === "done") return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/games/council?code=${room.code}`).catch(() => null);
      if (res?.ok) setRoom(await res.json());
    }, 2000);
    return () => clearInterval(t);
  }, [room]);

  if (!room)
    return (
      <div className="th-lobby">
        <div className="th-lobby-card">
          <h3><Crown size={18} /> Open a council</h3>
          <p>You&apos;ll get a code to share with up to three neighbours.</p>
          <button className="civic-button" onClick={() => act({ type: "create" })} disabled={busy}>Open a council</button>
        </div>
        <div className="th-lobby-card">
          <h3><Users size={18} /> Join a council</h3>
          <p>Enter the code a neighbour shared with you.</p>
          <form onSubmit={(e) => { e.preventDefault(); act({ type: "join", code }); }} className="th-join">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))} placeholder="ABC234" aria-label="Council code" />
            <button className="civic-button" disabled={busy || code.length < 6}>Join</button>
          </form>
        </div>
        {error && <p role="alert" className="form-error">{error}</p>}
      </div>
    );

  if (room.status === "done" && room.verdict) return <Newspaper_ v={room.verdict} state={room.state} extra={<p className="gp-small">Played together by {room.players.map((p) => p.name).join(", ")}. Everyone in the council got this result.</p>} />;

  const share = () => {
    navigator.clipboard?.writeText(room.code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  };

  return (
    <div className="th-game">
      <div className="th-roombar">
        <span className="th-code">Council code <strong>{room.code}</strong> <button onClick={share} aria-label="Copy code"><Copy size={14} /></button>{copied && " copied"}</span>
        <div className="th-players">
          {room.players.map((p) => (
            <span key={p.group} className={`th-player${p.voted ? " voted" : ""}`} style={{ borderColor: GROUP_INFO[p.group].color }}>
              {GROUP_INFO[p.group].emoji} {p.name}{p.isHost ? " (host)" : ""}{room.status === "playing" && p.voted ? " ✓" : ""}
            </span>
          ))}
          {room.missing.map((g) => <span key={g} className="th-player missing">{GROUP_INFO[g].emoji} nobody for {GROUP_INFO[g].name.toLowerCase()}</span>)}
        </div>
      </div>
      {room.me && <p className="th-role">You speak for <strong style={{ color: GROUP_INFO[room.me.group].color }}>{GROUP_INFO[room.me.group].emoji} {GROUP_INFO[room.me.group].name}</strong>. Only you can see how each option affects them, so speak up!</p>}

      {room.status === "lobby" ? (
        <div className="th-lobby-wait">
          <p>Waiting for neighbours. Share the code <strong>{room.code}</strong>. {room.missing.length ? `Groups with no player still count, but nobody will speak for them.` : "All four groups have a voice."}</p>
          {room.isHost ? <button className="civic-button" onClick={() => act({ type: "start", code: room.code })} disabled={busy}>Start the year with {room.players.length} {room.players.length === 1 ? "player" : "players"}</button> : <p className="gp-small">The host will start the year.</p>}
        </div>
      ) : (
        <>
          <div className="th-top">
            <ol className="th-months">{MONTHS.map((m, i) => <li key={m} className={i < room.month ? "done" : i === room.month ? "now" : ""}>{m.slice(0, 1)}</li>)}</ol>
            <div className="th-meters">
              <Meter icon={<Wallet size={14} />} label="Budget €k" value={room.state.budget} max={120} warn={room.state.budget < 10} />
              <Meter icon={<HeartHandshake size={14} />} label="Trust" value={room.state.trust} />
              <Meter icon={<Leaf size={14} />} label="Environment" value={room.state.env} />
            </div>
          </div>
          <div className="th-main">
            <div className="th-left">
              <TownMap state={room.state} />
              <Moods state={room.state} highlight={room.me?.group} />
            </div>
            {room.dilemma && (
              <AnimatePresence mode="wait">
                <motion.div key={room.dilemma.id} className="th-card" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -90, opacity: 0 }}>
                  <span className="th-card-month">{MONTHS[room.month]}</span>
                  <h2>{room.dilemma.title}</h2>
                  <p>{room.dilemma.text}</p>
                  <div className="th-options">
                    {room.dilemma.options.map((o, i) => (
                      <div key={o.label} className={`th-option council${room.myVote === i ? " chosen" : ""}`}>
                        <strong>{o.label}</strong>
                        <span className="th-effects">
                          <Delta v={o.budget} unit="k €" />
                          <Delta v={o.env} unit=" env" />
                          {o.mine !== null && room.me && <span className={`th-delta ${o.mine > 0 ? "up" : o.mine < 0 ? "down" : ""}`}>{GROUP_INFO[room.me.group].emoji} {o.mine > 0 ? "+" : ""}{o.mine} for your group (only you see this)</span>}
                        </span>
                        <span className="th-voices">
                          {Object.entries(room.reactions).map(([g, r]) => r[i] ? <span key={g} className={`th-voice ${r[i]}`} title={`${GROUP_INFO[g as Group]?.name}: ${r[i]}`}>{GROUP_INFO[g as Group]?.emoji} {r[i] === "good" ? "👍" : r[i] === "bad" ? "👎" : "🤷"}</span> : null)}
                        </span>
                        <span className="th-react">
                          {(["good", "ok", "bad"] as const).map((val) => (
                            <button key={val} onClick={() => act({ type: "react", code: room.code, option: i, value: val })} disabled={busy} aria-label={`For my group this is ${val}`}>{val === "good" ? "👍" : val === "ok" ? "🤷" : "👎"}</button>
                          ))}
                          <button className="th-vote" onClick={() => act({ type: "vote", code: room.code, option: i })} disabled={busy}>
                            {room.myVote === i ? "Your vote" : "Vote"} · {room.tally[i] ?? 0}
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="gp-small">Speak up with 👍 🤷 👎 for your group, then vote. The council decides when everyone has voted{room.isHost ? ", or you can close the vote" : ""}. Most votes wins.</p>
                  {room.isHost && <button className="civic-button outline" onClick={() => act({ type: "decide", code: room.code })} disabled={busy}>Close the vote now</button>}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </>
      )}
      {error && <p role="alert" className="form-error">{error}</p>}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function TownHall() {
  const [mode, setMode] = useState<"pick" | "solo" | "council">("pick");
  const preview = useMemo(() => {
    let s = startState();
    const y = yearOf(7);
    [0, 1, 2, 0, 1].forEach((c, i) => (s = applyDecision(s, y[i], Math.min(c, y[i].options.length - 1), true)));
    return s;
  }, []);

  return (
    <div className="gp tint-lilac th">
      <Link href="/dashboard/games" className="workspace-back-link"><ArrowLeft size={16} aria-hidden="true" /> Civic games</Link>
      {mode === "pick" ? (
        <section className="gp-intro">
          <div className="gp-intro-text">
            <span className="tool-hero-eyebrow">Strategy · 12 months</span>
            <h1>A year at the town hall</h1>
            <p className="gp-tagline">Run a town for a year. Keep it fair.</p>
            <p>Every month brings a real dilemma. Balance the budget, trust and the environment, and keep four groups of residents on side: families, older residents, young people and local businesses. Ask residents before you decide, or don&apos;t, and live with it.</p>
            <p className="gp-learn"><Ear size={16} aria-hidden="true" /> <span><strong>You&apos;ll learn:</strong> why listening before deciding matters, and why a fair town watches its least happy group, not just the average.</span></p>
            <div className="gp-intro-actions">
              <button className="civic-button" onClick={() => setMode("solo")}>Play solo</button>
              <button className="civic-button outline" onClick={() => setMode("council")}><Users size={16} /> Play with neighbours</button>
            </div>
            <p className="gp-small">With neighbours, each of you speaks for one group and only you see how options affect it. Up to four players.</p>
          </div>
          <div className="th-intro-map"><TownMap state={preview} /></div>
        </section>
      ) : mode === "solo" ? (
        <Solo />
      ) : (
        <Council />
      )}
    </div>
  );
}
