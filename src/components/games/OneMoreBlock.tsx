"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Share2,
  Undo2,
  Utensils,
  Accessibility,
  Trees,
  Check,
  Users,
  Sparkles,
} from "lucide-react";
import {
  createBlocks,
  slideBlocks,
  shareBlock,
  canShare,
  fulfilled,
  nextKind,
  blockReflection,
  WISHES,
  KINDS,
  MOVE_LIMIT,
  type Kind,
  type Direction,
  type BlockState,
} from "@/lib/games/one-more-block";
import "./one-more-block.css";

const ICONS = { food: Utensils, play: Trees, access: Accessibility };
const DIRECTIONS: {
  name: string;
  direction: Direction;
  icon: typeof ArrowLeft;
}[] = [
  { name: "Slide left", direction: "left", icon: ArrowLeft },
  { name: "Slide up", direction: "up", icon: ArrowUp },
  { name: "Slide down", direction: "down", icon: ArrowDown },
  { name: "Slide right", direction: "right", icon: ArrowRight },
];

export default function OneMoreBlock() {
  const [state, setState] = useState(() => createBlocks(1));
  const [seed, setSeed] = useState(1);
  const [duo, setDuo] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [undoUsed, setUndoUsed] = useState(false);
  const [previous, setPrevious] = useState<BlockState | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const [help, setHelp] = useState(false);
  const current = useRef(state),
    history = useRef<BlockState | null>(null);
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  const ignoreClick = useRef(false);
  const board = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("board");
    const day = Number(
      new Date().toISOString().slice(0, 10).replaceAll("-", ""),
    );
    const chosen = raw && /^\d{1,9}$/.test(raw) ? Number(raw) : day;
    Promise.resolve().then(() => {
      const next = createBlocks(chosen);
      current.current = next;
      setState(next);
      setSeed(chosen);
    });
  }, []);

  function apply(next: BlockState) {
    if (next === current.current) return;
    history.current = current.current;
    setPrevious(current.current);
    current.current = next;
    setState(next);
    setSelected(null);
  }
  function move(direction: Direction) {
    apply(slideBlocks(current.current, direction));
  }
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // The board captures arrows only while it or one of its tiles has focus.
      if (!board.current?.contains(document.activeElement)) return;
      const direction = (
        {
          ArrowLeft: "left",
          ArrowRight: "right",
          ArrowUp: "up",
          ArrowDown: "down",
        } as Record<string, Direction>
      )[event.key];
      if (direction) {
        event.preventDefault();
        move(direction);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function restart(newSeed = seed) {
    const next = createBlocks(newSeed);
    current.current = next;
    setState(next);
    setSeed(newSeed);
    setSelected(null);
    setUndoUsed(false);
    setPrevious(null);
    history.current = null;
    setShareMessage("");
    const url = new URL(window.location.href);
    url.searchParams.set("board", String(newSeed));
    window.history.replaceState(null, "", url);
  }
  function undo() {
    if (undoUsed || !history.current) return;
    const next = history.current;
    current.current = next;
    setState(next);
    setSelected(null);
    setUndoUsed(true);
    setPrevious(null);
    history.current = null;
  }
  async function copyChallenge() {
    const url = new URL(window.location.href);
    url.searchParams.set("board", String(seed));
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareMessage(
        "Link copied. Same starting board; each device plays its own round.",
      );
    } catch {
      setShareMessage(url.toString());
    }
  }
  const tile = selected === null ? null : state.board[selected];
  const contribution = tile
    ? Math.min(tile.value, WISHES[tile.kind].need - state.shared[tile.kind])
    : 0;
  const next = nextKind(state),
    NextIcon = ICONS[next];

  return (
    <div className="omb">
      <div className="omb-top">
        <Link href="/dashboard/games">
          <ArrowLeft size={16} /> All games
        </Link>
        <span>THE NEIGHBOURHOOD ARCADE / 03</span>
      </div>
      <header className="omb-header">
        <div>
          <span className="omb-kicker">
            A LITTLE PUZZLE. A WHOLE NEIGHBOURHOOD.
          </span>
          <h1>
            One more <em>block.</em>
          </h1>
          <p>Slide. Combine. Share. Make room for everyone.</p>
        </div>
        <div className="omb-badge">
          <Users />
          <b>Better together</b>
          <small>One device · Take turns</small>
        </div>
      </header>
      <div className="omb-layout">
        <section className="omb-surface" aria-label="Neighbourhood puzzle">
          <div className="omb-toolbar">
            <div className="omb-mode" role="group" aria-label="Player mode">
              <button aria-pressed={duo} onClick={() => setDuo(true)}>
                Two neighbours
              </button>
              <button aria-pressed={!duo} onClick={() => setDuo(false)}>
                Solo
              </button>
            </div>
            <button
              className="omb-help"
              aria-expanded={help}
              onClick={() => setHelp(!help)}
            >
              How to play
            </button>
          </div>
          {help && (
            <div className="omb-instructions">
              <strong>One move. Then your neighbour’s turn.</strong>
              <ol>
                <li>
                  Swipe, use the arrows below, or focus the board and press
                  arrow keys. Matching colours and numbers merge once per slide.
                </li>
                <li>
                  Tap a tile and share it toward a community wish. Sharing uses
                  a turn and clears board space. Unneeded surplus stays on the
                  tile.
                </li>
                <li>
                  Complete all three wishes in {MOVE_LIMIT} turns. The biggest
                  tile alone won’t win. You have one shared undo.
                </li>
              </ol>
              <p>
                This is a simplified resource puzzle, not a real budget
                estimate.
              </p>
            </div>
          )}
          <div className="omb-round">
            <div>
              <span>
                {duo
                  ? `NEIGHBOUR ${(state.turn % 2) + 1}’S TURN`
                  : "YOUR NEXT MOVE"}
              </span>
              <strong>
                {MOVE_LIMIT - state.moves}
                <small> turns left</small>
              </strong>
            </div>
            <div className="omb-next">
              <span>NEXT ARRIVAL</span>
              <b style={{ background: WISHES[next].color }}>
                <NextIcon size={17} /> {WISHES[next].short} · 1
              </b>
            </div>
          </div>
          <div className="omb-mini-needs" aria-label="Shared needs summary">
            {KINDS.map((k) => (
              <div key={k}>
                <span>{WISHES[k].short}</span>
                <strong>
                  {state.shared[k]}/{WISHES[k].need}
                </strong>
              </div>
            ))}
          </div>
          <div className="omb-board-wrap">
            <div
              className="omb-board"
              ref={board}
              tabIndex={0}
              role="group"
              aria-label="4 by 4 neighbourhood board. Arrow keys slide tiles. Tap a tile to share."
              onPointerDown={(e) => {
                if (e.pointerType === "mouse" && e.button !== 0) return;
                swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
                ignoreClick.current = false;
              }}
              onPointerUp={(e) => {
                const start = swipe.current;
                swipe.current = null;
                if (!start || start.id !== e.pointerId) return;
                const dx = e.clientX - start.x,
                  dy = e.clientY - start.y;
                if (Math.hypot(dx, dy) < 25) return;
                ignoreClick.current = true;
                move(
                  Math.abs(dx) > Math.abs(dy)
                    ? dx > 0
                      ? "right"
                      : "left"
                    : dy > 0
                      ? "down"
                      : "up",
                );
              }}
              onPointerCancel={() => {
                swipe.current = null;
              }}
            >
              {Array.from({ length: 16 }, (_, i) => (
                <div
                  key={i}
                  className="omb-slot"
                  aria-hidden="true"
                  style={{
                    left: `${(i % 4) * 25}%`,
                    top: `${Math.floor(i / 4) * 25}%`,
                  }}
                />
              ))}
              {state.board.map((block, i) => {
                if (!block) return null;
                const Icon = ICONS[block.kind];
                return (
                  <button
                    key={block.id}
                    className={`omb-tile omb-${block.kind} ${selected === i ? "omb-selected" : ""}`}
                    style={{
                      left: `${(i % 4) * 25}%`,
                      top: `${Math.floor(i / 4) * 25}%`,
                    }}
                    aria-label={`${WISHES[block.kind].short}, ${block.value} resources, row ${Math.floor(i / 4) + 1} column ${(i % 4) + 1}`}
                    aria-pressed={selected === i}
                    onClick={() => {
                      if (ignoreClick.current) {
                        ignoreClick.current = false;
                        return;
                      }
                      setSelected(i);
                    }}
                    disabled={state.status !== "playing"}
                  >
                    <span className="omb-building" aria-hidden="true">
                      <span className="omb-roof" />
                      <span className="omb-wall" />
                      <span className="omb-door" />
                      {block.value >= 4 && <span className="omb-tree" />}
                    </span>
                    <span className="omb-tile-value">{block.value}</span>
                    <span className="omb-tile-name">
                      <Icon size={12} />
                      {WISHES[block.kind].short}
                    </span>
                  </button>
                );
              })}
            </div>
            {state.status !== "playing" && (
              <div className="omb-end">
                <div>
                  <span className="omb-kicker">
                    {state.status === "won"
                      ? "EVERYONE HAS A PLACE"
                      : "A LITTLE ROOM TO RETHINK"}
                  </span>
                  <h2>
                    {state.status === "won"
                      ? "That’s a neighbourhood."
                      : "One more try?"}
                  </h2>
                  <p>{blockReflection(state)}</p>
                  <button className="omb-primary" onClick={() => restart()}>
                    <RotateCcw size={16} /> Same board, new plan
                  </button>
                  {!undoUsed && previous && (
                    <button className="omb-quiet" onClick={undo}>
                      Use your shared undo
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="omb-arrows" aria-label="Slide controls">
            {DIRECTIONS.map(({ name, direction, icon: Icon }) => (
              <button
                key={direction}
                aria-label={name}
                disabled={state.status !== "playing"}
                onClick={() => move(direction)}
              >
                <Icon size={21} />
              </button>
            ))}
            <button
              aria-label="Rethink the last move"
              title="One shared undo per round"
              disabled={!previous || undoUsed}
              onClick={undo}
            >
              <Undo2 size={19} />
              <small>{undoUsed ? "Used" : "1 undo"}</small>
            </button>
          </div>
          <p className="omb-status" role="status">
            {state.message}
          </p>
          <div className="omb-contribute">
            {tile && state.status === "playing" ? (
              <>
                <div>
                  <b>
                    {WISHES[tile.kind].short} · {tile.value}
                  </b>
                  <span>
                    {contribution > 0
                      ? `Share ${contribution}${tile.value > contribution ? `; keep ${tile.value - contribution} on the board` : " and open this square"}. Uses one turn.`
                      : "This wish is complete. Choose a space someone still needs."}
                  </span>
                </div>
                <button
                  className="omb-primary"
                  disabled={selected === null || !canShare(state, selected)}
                  onClick={() =>
                    selected !== null &&
                    apply(shareBlock(current.current, selected))
                  }
                >
                  Share {contribution > 0 ? contribution : ""}
                  <ArrowRight size={17} />
                </button>
              </>
            ) : (
              <>
                <Sparkles size={22} />
                <p>
                  <b>Keep it growing, or share it?</b>
                  <span>
                    Tap a tile to contribute. Sharing makes room for what comes
                    next.
                  </span>
                </p>
              </>
            )}
          </div>
          <div className="omb-footer">
            <button onClick={() => restart()}>
              <RotateCcw size={14} /> Restart board
            </button>
            <button onClick={() => restart((seed + 1) % 1000000000)}>
              Next board <ArrowRight size={14} />
            </button>
            <button onClick={copyChallenge}>
              <Share2 size={14} /> Share challenge
            </button>
          </div>
          {shareMessage && (
            <p className="omb-share-message" role="status">
              {shareMessage}
            </p>
          )}
        </section>
        <aside className="omb-wishes" aria-label="Our shared wishes">
          <div className="omb-wishes-head">
            <span className="omb-kicker">OUR SHARED WISHES</span>
            <h2>
              Three needs.
              <br />
              One place to belong.
            </h2>
            <p>
              Win by meeting every need. A big tile is only useful when it helps
              someone.
            </p>
            <span className="omb-complete">
              {fulfilled(state)} of 3 wishes ready
            </span>
          </div>
          {KINDS.map((kind: Kind) => {
            const wish = WISHES[kind],
              Icon = ICONS[kind],
              done = state.shared[kind] >= wish.need;
            return (
              <div
                className={`omb-wish ${done ? "omb-wish-done" : ""}`}
                key={kind}
              >
                <div className="omb-wish-title">
                  <span style={{ background: wish.color }}>
                    <Icon size={20} />
                  </span>
                  <strong>{wish.name}</strong>
                  {done && <Check size={18} />}
                </div>
                <p>{wish.reason}</p>
                <div className="omb-wish-meter">
                  <progress
                    aria-label={wish.short}
                    value={state.shared[kind]}
                    max={wish.need}
                  />
                  <b>
                    {state.shared[kind]}/{wish.need}
                  </b>
                </div>
                <small>
                  {done
                    ? "Ready for the neighbourhood"
                    : `${wish.need - state.shared[kind]} resources still needed`}
                </small>
              </div>
            );
          })}
          <div className="omb-neighbour-note">
            <Users size={20} />
            <p>
              <b>Try this together</b>Before you slide, tell your neighbour what
              you’re trying to make space for. They make the next move.
            </p>
          </div>
          <p className="omb-fine">
            Challenge #{seed}. Same link, same starting board. Local play only;
            this does not synchronise devices or publish your score. Resource
            needs are fictional.
          </p>
        </aside>
      </div>
    </div>
  );
}
