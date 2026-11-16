"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Pause,
  Play,
  RotateCcw,
  Users,
  Trophy,
  Sparkles,
  Maximize2,
} from "lucide-react";
import {
  createParty,
  EMPTY_INPUT,
  COMMUNITY_BUDGET,
  PROJECTS,
  projectAt,
  communityProgress,
  communityComplete,
  learningSummary,
  type PartyGame,
  type PartyMode,
} from "@/lib/games/block-party";
import "./block-party.css";

const INFO = {
  rally: {
    title: "Rooftop Rally",
    line: "Big jumps. Tiny rooftops. Absolutely no dignity.",
    instruction:
      "You can jump; your neighbours need a continuous route. Collect golden materials. On the middle row, press F beside a gap to spend 2 materials on a bridge. Get all 3 neighbours across to win.",
    tip: "One collects, one builds. Four shared bridges let everyone cross—even people who cannot use your shortcuts.",
    target: 3,
  },
  bumpers: {
    title: "Bumper Buddies",
    line: "One giant ball. Two good intentions. Total chaos.",
    instruction:
      "Eight resource balls, four projects with different needs. Steer balls into the labelled goals. Meet every need to win; extra shots at a completed project bounce back.",
    tip: "Check who is still waiting before you shoot. The cool square needs 3 resources; the play street needs 1. Equal shares would leave an unmet need.",
    target: 4,
  },
};
type View = "lobby" | "playing" | "paused" | "result";
type Hud = {
  score: number;
  remaining: number;
  deliveries: number;
  assists: number;
  falls: number;
  message: string;
  event: number;
  cooldowns: number[];
  progress: number;
  won: boolean;
  materials: number;
  bridges: number;
  summary: string;
  projects: { name: string; need: number; reason: string; allocated: number }[];
};
const initialHud: Hud = {
  score: 0,
  remaining: 75,
  deliveries: 0,
  assists: 0,
  falls: 0,
  message: "",
  event: 0,
  cooldowns: [0, 0],
  progress: 0,
  won: false,
  materials: 0,
  bridges: 0,
  summary: "",
  projects: PROJECTS.map((p) => ({ ...p, allocated: 0 })),
};
const keyMap = [
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "Space",
  "KeyE",
  "ArrowUp",
  "ArrowLeft",
  "ArrowDown",
  "ArrowRight",
  "Enter",
  "ShiftRight",
  "KeyF",
  "ControlRight",
];

export default function BlockParty() {
  const [game, setGame] = useState<PartyGame>("rally");
  const [mode, setMode] = useState<PartyMode>("solo");
  const [practice, setPractice] = useState(false);
  const [view, setView] = useState<View>("lobby");
  const [run, setRun] = useState(0);
  const [hud, setHud] = useState<Hud>(initialHud);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [quiet, setQuiet] = useState(false);
  const [sound, setSound] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  const host = useRef<HTMLDivElement>(null),
    shell = useRef<HTMLDivElement>(null);
  const controls = useRef({
    active: false,
    reduced: false,
    inputs: [{ ...EMPTY_INPUT }, { ...EMPTY_INPUT }],
  });
  const keys = useRef(new Set<string>());
  const touches = useRef(new Map<number, string>());
  const currentView = useRef<View>("lobby");
  const soundEnabled = useRef(false);
  const audio = useRef<AudioContext | null>(null);
  const info = INFO[game];

  function changeView(next: View) {
    if (next === "playing") host.current?.focus({ preventScroll: true });
    currentView.current = next;
    controls.current.active = next === "playing";
    setView(next);
    keys.current.clear();
    touches.current.clear();
    controls.current.inputs = [{ ...EMPTY_INPUT }, { ...EMPTY_INPUT }];
  }
  function updateInputs() {
    const down = (code: string) =>
      keys.current.has(code) || [...touches.current.values()].includes(code);
    controls.current.inputs = [
      {
        x: Number(down("KeyD")) - Number(down("KeyA")),
        z: Number(down("KeyS")) - Number(down("KeyW")),
        jump: down("Space"),
        dash: down("KeyE"),
        build: down("KeyF"),
      },
      {
        x: Number(down("ArrowRight")) - Number(down("ArrowLeft")),
        z: Number(down("ArrowDown")) - Number(down("ArrowUp")),
        jump: down("Enter"),
        dash: down("ShiftRight"),
        build: down("ControlRight"),
      },
    ];
  }
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      controls.current.reduced = media.matches;
      setQuiet(media.matches);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    controls.current.reduced = quiet;
  }, [quiet]);
  useEffect(() => {
    let cancelled = false,
      cleanup: (() => void) | undefined;
    const state = createParty(game, mode, practice, run);
    let lastSound = 0;
    import("./party-scene")
      .then(({ mountPartyScene }) => {
        if (cancelled || !host.current) return;
        try {
          cleanup = mountPartyScene(
            host.current,
            state,
            controls.current,
            () => {
              if (cancelled) return;
              setHud({
                score: state.score,
                remaining: state.remaining,
                deliveries: state.deliveries,
                assists: state.assists,
                falls: state.players.reduce((s, p) => s + p.falls, 0),
                message: state.message,
                event: state.event,
                cooldowns: state.players.map((p) => p.cooldown),
                progress: communityProgress(state),
                won: communityComplete(state),
                materials: state.materials,
                bridges: state.bridges.filter(Boolean).length,
                summary: learningSummary(state),
                projects: state.allocations.map((allocated, i) => ({
                  ...projectAt(state, i),
                  allocated,
                })),
              });
              if (state.event !== lastSound) {
                lastSound = state.event;
                const ctx = audio.current;
                if (soundEnabled.current && ctx?.state === "running") {
                  const oscillator = ctx.createOscillator(),
                    gain = ctx.createGain();
                  oscillator.type = "sine";
                  oscillator.frequency.setValueAtTime(520, ctx.currentTime);
                  oscillator.frequency.exponentialRampToValueAtTime(
                    880,
                    ctx.currentTime + 0.1,
                  );
                  gain.gain.setValueAtTime(0.06, ctx.currentTime);
                  gain.gain.exponentialRampToValueAtTime(
                    0.001,
                    ctx.currentTime + 0.2,
                  );
                  oscillator.connect(gain);
                  gain.connect(ctx.destination);
                  oscillator.start();
                  oscillator.stop(ctx.currentTime + 0.22);
                  oscillator.onended = () => {
                    oscillator.disconnect();
                    gain.disconnect();
                  };
                }
              }
              if (
                state.status === "finished" &&
                currentView.current === "playing"
              )
                changeView("result");
            },
            () => {
              changeView("paused");
              setError(
                "The 3D view lost its connection. Reload the game to try again.",
              );
            },
          );
          setReady(true);
        } catch {
          setError(
            "This game needs WebGL. Try a browser with hardware acceleration enabled, or play one of the other civic games.",
          );
        }
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "The 3D game could not load. Check your connection and reload.",
          );
      });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [game, mode, practice, run]);
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (currentView.current !== "playing") return;
      if (e.code === "Escape" || e.code === "KeyP") {
        e.preventDefault();
        changeView("paused");
        return;
      }
      if (
        e.defaultPrevented ||
        (e.target instanceof HTMLElement &&
          e.target.closest("button, a, input, select, textarea"))
      )
        return;
      if (keyMap.includes(e.code)) {
        e.preventDefault();
        keys.current.add(e.code);
        updateInputs();
      }
    };
    const keyup = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
      updateInputs();
    };
    const blur = () => {
      if (currentView.current === "playing") changeView("paused");
    };
    const visibility = () => {
      if (document.hidden) blur();
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(
    () => () => {
      void audio.current?.close();
    },
    [],
  );
  function configure(g: PartyGame, m = mode, p = practice) {
    changeView("lobby");
    setReady(false);
    setError("");
    setHud(initialHud);
    setGame(g);
    setMode(m);
    setPractice(p);
    setRun((n) => n + 1);
  }
  function restart() {
    setHud(initialHud);
    setReady(false);
    changeView("lobby");
    setRun((n) => n + 1);
  }
  async function toggleSound() {
    if (!sound) {
      try {
        audio.current ??= new AudioContext();
        await audio.current.resume();
      } catch {
        return;
      }
    }
    soundEnabled.current = !sound;
    setSound(!sound);
  }
  const touchButton = (
    code: string,
    title: string,
    content: React.ReactNode,
  ) => (
    <button
      type="button"
      aria-label={title}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        touches.current.set(e.pointerId, code);
        updateInputs();
      }}
      onPointerUp={(e) => {
        touches.current.delete(e.pointerId);
        updateInputs();
      }}
      onPointerCancel={(e) => {
        touches.current.delete(e.pointerId);
        updateInputs();
      }}
      onLostPointerCapture={(e) => {
        touches.current.delete(e.pointerId);
        updateInputs();
      }}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          keys.current.add(code);
          updateInputs();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") {
          keys.current.delete(code);
          updateInputs();
        }
      }}
      onBlur={() => {
        keys.current.delete(code);
        updateInputs();
      }}
    >
      {content}
    </button>
  );
  return (
    <div className="bp-page" data-reduced-motion={quiet}>
      <div className="bp-topline">
        <Link href="/dashboard/games">
          <ArrowLeft size={16} /> All games
        </Link>
        <span>
          THE NEIGHBOURHOOD ARCADE{" "}
          <span className="bp-beta">NEW · LOCAL PLAY</span>
        </span>
      </div>
      <header className="bp-header">
        <div>
          <span className="bp-eyebrow">
            BETTER TOGETHER. FUNNIER WHEN YOU FALL.
          </span>
          <h1>
            Block <em>Party.</em>
            <span aria-hidden="true">✳</span>
          </h1>
          <p>Bring a neighbour. Pick a challenge. Make a glorious mess.</p>
        </div>
        <div className="bp-stamp">
          <Users size={23} />
          <strong>1–2 players</strong>
          <span>75 seconds · Real 3D</span>
        </div>
      </header>
      <div className="bp-tabs" role="group" aria-label="Choose minigame">
        <button
          aria-pressed={game === "rally"}
          disabled={view === "playing" || view === "paused"}
          onClick={() => configure("rally")}
        >
          <span>01</span>
          <div>
            <strong>Rooftop Rally</strong>
            <small>Jump · build · include</small>
          </div>
          <span aria-hidden="true">↗</span>
        </button>
        <button
          aria-pressed={game === "bumpers"}
          disabled={view === "playing" || view === "paused"}
          onClick={() => configure("bumpers")}
        >
          <span>02</span>
          <div>
            <strong>Bumper Buddies</strong>
            <small>Bounce · share · meet needs</small>
          </div>
          <span aria-hidden="true">◎</span>
        </button>
      </div>
      <section className="bp-machine" ref={shell} aria-label={info.title}>
        <div className="bp-machine-bar">
          <span>
            <span className="bp-light" /> {info.title}
          </span>
          <div>
            <button
              onClick={async () => {
                try {
                  if (document.fullscreenElement)
                    await document.exitFullscreen();
                  else await shell.current?.requestFullscreen();
                } catch {
                  setFullscreenError(
                    "Fullscreen is unavailable in this browser. The game still works here.",
                  );
                }
              }}
              aria-label="Toggle fullscreen"
            >
              <Maximize2 size={16} />
            </button>
            <button onClick={toggleSound} aria-pressed={sound}>
              Sound {sound ? "on" : "off"}
            </button>
            <button onClick={() => setQuiet(!quiet)} aria-pressed={quiet}>
              Less motion {quiet ? "on" : "off"}
            </button>
          </div>
        </div>
        <div className="bp-viewport">
          <div
            className="bp-canvas"
            ref={host}
            tabIndex={view === "playing" ? 0 : -1}
            aria-label="3D game field. Use movement, jump and dash controls listed below."
          />
          {view === "playing" && !error && (
            <>
              <div className="bp-hud">
                <div>
                  <span>
                    {game === "rally"
                      ? "MATERIALS TO SHARE"
                      : "SHARED RESOURCES LEFT"}
                  </span>
                  <strong>
                    {game === "rally"
                      ? hud.materials
                      : COMMUNITY_BUDGET - hud.deliveries}
                  </strong>
                </div>
                <div
                  className={hud.remaining < 15 && !practice ? "bp-urgent" : ""}
                >
                  <span>{practice ? "FREE PLAY" : "TIME LEFT"}</span>
                  <strong>
                    {practice
                      ? "∞"
                      : `${Math.floor(Math.ceil(hud.remaining) / 60)}:${String(Math.ceil(hud.remaining) % 60).padStart(2, "0")}`}
                  </strong>
                </div>
                <button
                  onClick={() => changeView("paused")}
                  aria-label="Pause game"
                >
                  <Pause size={20} />
                </button>
              </div>
              <div className="bp-progress">
                <span>
                  {game === "rally" ? "Neighbours across" : "Projects ready"}{" "}
                  <strong>
                    {hud.progress} / {info.target}
                  </strong>
                </span>
                <progress
                  aria-label={
                    game === "rally"
                      ? "Neighbours across"
                      : "Community needs met"
                  }
                  value={hud.progress}
                  max={info.target}
                />
              </div>
              <div
                className="bp-callout"
                key={quiet ? "quiet" : hud.event}
                role="status"
              >
                {hud.message}
              </div>
            </>
          )}
          {(view !== "playing" || error) && (
            <div className="bp-overlay">
              <div
                className="bp-panel"
                role={view === "result" ? "status" : undefined}
              >
                {error ? (
                  <>
                    <h2>Let’s get you playing.</h2>
                    <p>{error}</p>
                    <button
                      className="bp-primary"
                      onClick={() => configure(game)}
                    >
                      Reload game
                    </button>
                    <Link href="/dashboard/games">Try another game</Link>
                  </>
                ) : view === "lobby" ? (
                  <>
                    <span className="bp-eyebrow">
                      {game === "rally"
                        ? "BUILD A ROUTE EVERYONE CAN USE"
                        : "DIFFERENT NEEDS. ONE SHARED BUDGET."}
                    </span>
                    <h2>{info.title}</h2>
                    <p className="bp-line">{info.line}</p>
                    <p>{info.instruction}</p>
                    <div
                      className="bp-mode"
                      role="group"
                      aria-label="Player mode"
                    >
                      <button
                        aria-pressed={mode === "solo"}
                        onClick={() => configure(game, "solo")}
                      >
                        Solo practice
                      </button>
                      <button
                        aria-pressed={mode === "duo"}
                        onClick={() => configure(game, "duo")}
                      >
                        Two neighbours
                      </button>
                    </div>
                    <p className="bp-mode-note">
                      {mode === "duo"
                        ? "Same screen, shared keyboard. Blueberry: WASD + Space / E / F. Mango: arrows + Enter / right Shift / right Ctrl."
                        : "WASD or touch to move. Space to jump. E to dash. F builds a nearby bridge. Dash recharges in 1.6 seconds."}
                    </p>
                    <label className="bp-check">
                      <input
                        type="checkbox"
                        checked={practice}
                        onChange={(e) =>
                          configure(game, mode, e.target.checked)
                        }
                      />{" "}
                      No timer — learn at your own pace
                    </label>
                    <button
                      className="bp-primary"
                      disabled={!ready}
                      onClick={() => changeView("playing")}
                    >
                      {ready ? (
                        <>
                          <Play size={18} fill="currentColor" /> Let’s play
                        </>
                      ) : (
                        "Setting up the neighbourhood…"
                      )}
                    </button>
                  </>
                ) : view === "paused" ? (
                  <>
                    <span className="bp-eyebrow">TAKE A BREATHER</span>
                    <h2>Party on pause.</h2>
                    <p>The clock is stopped. Your neighbours can wait.</p>
                    <button
                      className="bp-primary"
                      onClick={() => changeView("playing")}
                    >
                      <Play size={18} /> Keep playing
                    </button>
                    <button className="bp-secondary" onClick={restart}>
                      Back to setup
                    </button>
                  </>
                ) : (
                  <>
                    <Trophy size={38} className="bp-trophy" />
                    <span className="bp-eyebrow">
                      {hud.won ? "YOU DID IT!" : "THAT WAS A GOOD WARM-UP"}
                    </span>
                    <h2>
                      {hud.won ? "A win for everyone." : "Another round?"}
                    </h2>
                    <p>
                      {hud.won
                        ? "Everyone’s needs were part of your win. High-fives all round!"
                        : "Check what is still missing, agree on a plan together, and try another round."}
                    </p>
                    <div className="bp-results">
                      <div>
                        <strong>{hud.score}</strong>
                        <span>Team points</span>
                      </div>
                      <div>
                        <strong>
                          {hud.progress}/{info.target}
                        </strong>
                        <span>
                          {game === "rally"
                            ? "Neighbours across"
                            : "Projects ready"}
                        </span>
                      </div>
                      <div>
                        <strong>{hud.assists}</strong>
                        <span>Team bonuses</span>
                      </div>
                    </div>
                    <div className="bp-lesson">
                      <strong>What your choices changed</strong>
                      <p>{hud.summary}</p>
                    </div>
                    <button className="bp-primary" onClick={restart}>
                      <RotateCcw size={18} /> Play again
                    </button>
                    <button
                      className="bp-secondary"
                      onClick={() =>
                        configure(game === "rally" ? "bumpers" : "rally")
                      }
                    >
                      Try{" "}
                      {game === "rally" ? "Bumper Buddies" : "Rooftop Rally"}{" "}
                      <ArrowRight size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <div
          className="bp-civic-board"
          aria-label="Community needs in this round"
        >
          {game === "rally" ? (
            <div className="bp-route-report">
              <strong>Shared route: {hud.bridges}/4 bridges</strong>
              <span>
                Each costs 2 materials. Build beside the marked middle-row gaps.
                The neighbours follow your route automatically.
              </span>
            </div>
          ) : (
            hud.projects.map((p, i) => (
              <div
                key={p.name}
                className={p.allocated >= p.need ? "bp-need-met" : ""}
              >
                <strong>
                  {i + 1}. {p.name}{" "}
                  <span>
                    {p.allocated}/{p.need}
                  </span>
                </strong>
                <small>{p.reason}</small>
              </div>
            ))
          )}
        </div>
        <div className="bp-controls">
          <span>
            <b className="bp-player-one">P1 BLUEBERRY</b> <kbd>W A S D</kbd>{" "}
            move <kbd>Space</kbd> jump <kbd>E</kbd> dash{" "}
            {game === "rally" && (
              <>
                <kbd>F</kbd> build
              </>
            )}{" "}
            {view === "playing" && (
              <small>
                {hud.cooldowns[0] > 0 ? "Recharging…" : "Dash ready"}
              </small>
            )}
          </span>
          {mode === "duo" && (
            <span>
              <b className="bp-player-two">P2 MANGO</b> <kbd>↑ ← ↓ →</kbd> move{" "}
              <kbd>Enter</kbd> jump <kbd>R Shift</kbd> dash{" "}
              {game === "rally" && (
                <>
                  <kbd>R Ctrl</kbd> build
                </>
              )}
            </span>
          )}
        </div>
        {view === "playing" && mode === "solo" && (
          <div className="bp-touch">
            <div className="bp-dpad">
              {touchButton("KeyW", "Move forward", <ArrowUp />)}
              {touchButton("KeyA", "Move left", <ArrowLeft />)}
              {touchButton("KeyS", "Move backward", <ArrowDown />)}
              {touchButton("KeyD", "Move right", <ArrowRight />)}
            </div>
            <div className="bp-actions">
              {game === "rally" &&
                touchButton(
                  "KeyF",
                  "Build shared bridge",
                  <>
                    <Users /> Build
                  </>,
                )}
              {touchButton(
                "Space",
                "Jump",
                <>
                  <ArrowUp /> Jump
                </>,
              )}
              {touchButton(
                "KeyE",
                "Dash",
                <>
                  <Sparkles /> Dash
                </>,
              )}
            </div>
          </div>
        )}
      </section>
      {fullscreenError && <p role="status">{fullscreenError}</p>}
      <div className="bp-bottom">
        <div>
          <span className="bp-eyebrow">THE TEAM TRICK</span>
          <p>{mode === "duo" ? info.tip : info.tip}</p>
        </div>
        <div>
          <span className="bp-eyebrow">YOUR LIVING-ROOM LEAGUE</span>
          <p>
            Local play on this device. Swap the keyboard between rounds. Scores
            reset each game; nothing is posted to your account.
          </p>
        </div>
      </div>
    </div>
  );
}
