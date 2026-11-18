"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Copy,
  Flag,
  Ticket,
  Trophy,
  UsersRound,
  Zap,
} from "lucide-react";
import {
  capacity,
  labels,
  sampleTopics,
  stages,
  type RoomSummary,
  type SparkView,
} from "@/lib/games/spark";
import { CommitCard, GuestTurn, guide, Recap, type Send } from "./Rounds";
import { Marquee } from "./Marquee";

const endpoint = "/api/games/spark";
const hostPath = "/dashboard/games/spark-cup";
const joinPath = "/play/spark";
const message = (err: unknown) =>
  err instanceof Error ? err.message : "Connection interrupted. Try again.";
async function request(path: string, body?: Record<string, unknown>) {
  const res = await fetch(
    path,
    body
      ? {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
        }
      : { cache: "no-store" },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "The room is unavailable.");
  return data;
}

function Clock({ room }: { room: SparkView }) {
  const [tick, setTick] = useState(room.now);
  useEffect(() => {
    const localStart = Date.now();
    const tickClock = () => setTick(room.now + Date.now() - localStart);
    tickClock();
    const id = setInterval(tickClock, 300);
    return () => clearInterval(id);
  }, [room.now]);
  const left = Math.ceil(
    Math.max(0, room.remaining ?? (room.endsAt ?? tick) - tick) / 1000,
  );
  return (
    <div className={"sc-clock" + (left <= 10 ? " last" : "")}>
      <Clock3 size={18} aria-hidden="true" />
      <b role="timer" aria-label="Round time remaining">
        {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
      </b>
      <span aria-live="polite">
        {room.remaining !== null
          ? "Paused"
          : left === 0
            ? "Time! Finish your thought."
            : left <= 10
              ? "Last ten seconds"
              : room.stage === "debate" && left <= 30
                ? "Switch speakers"
                : "On the clock"}
      </span>
    </div>
  );
}
function Invite({ code }: { code: string }) {
  const base = typeof window === "undefined" ? "" : window.location.origin;
  const [copied, setCopied] = useState(false);
  const largeTicket = useRef<HTMLDialogElement>(null);
  const link = base + joinPath + "?room=" + code;
  return (
    <section className="sc-invite" aria-label="Join this game">
      {base && (
        <div className="sc-qr">
          <QRCodeSVG
            value={link}
            size={160}
            level="M"
            marginSize={4}
            title="Scan to join this Spark Cup room"
          />
        </div>
      )}
      <div>
        <small>Player tickets</small>
        <h3>Scan to take a seat</h3>
        <p>
          Or open{" "}
          <a href={joinPath}>
            {base.replace(/^https?:\/\//, "")}
            {joinPath}
          </a>{" "}
          and enter
        </p>
        <strong className="sc-code">{code}</strong>
        <button
          type="button"
          className="sc-enlarge"
          onClick={() => largeTicket.current?.showModal()}
        >
          Enlarge QR for the room
        </button>
        <dialog
          ref={largeTicket}
          className="sc-projection"
          aria-label="Projected room invitation"
        >
          <h2>Join the Spark Cup</h2>
          <QRCodeSVG
            value={link}
            size={500}
            marginSize={4}
            level="M"
            title="Scan the projected invitation"
          />
          <p>
            {base.replace(/^https?:\/\//, "")}
            {joinPath}
          </p>
          <strong className="sc-code">{code}</strong>
          <button type="button" onClick={() => largeTicket.current?.close()}>
            Back to host board
          </button>
        </dialog>
        <button
          type="button"
          className="sc-link"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              setCopied(true);
            } catch {
              window.prompt("Copy the room link", link);
            }
          }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
          {copied ? "Invite link copied" : "Copy invite link"}
        </button>
      </div>
    </section>
  );
}

function Board({ room }: { room: SparkView }) {
  const shown = room.stage === "reveal" || room.stage === "recap";
  const ordered = shown
    ? [...room.cards].sort((a, b) => (b.votes || 0) - (a.votes || 0))
    : room.cards;
  const high = ordered[0]?.votes ?? 0;
  const maxRemix = Math.max(0, ...ordered.map((c) => c.riffs.length));
  return (
    <section aria-label="Pitch board">
      <h3 className="sc-board-title">{shown ? "Scoreboard" : "Pitch board"}</h3>
      <div className="sc-grid">
        {ordered.map((c, i) => (
          <article className={"sc-card tone-" + (i % 3)} key={c.id}>
            <div className="sc-ribbon">
              <small>
                {shown && c.votes === high ? (
                  <>
                    <Trophy size={15} /> Cup contender
                  </>
                ) : (
                  "Pitch"
                )}
              </small>
              {shown && (
                <b>
                  {c.votes} {c.votes === 1 ? "vote" : "votes"}
                </b>
              )}
            </div>
            {shown && (
              <div className="sc-votebar" aria-hidden="true">
                <i
                  style={{
                    width:
                      ((c.votes || 0) / Math.max(1, room.voteCount)) * 100 +
                      "%",
                  }}
                />
              </div>
            )}
            <h4>{c.pitch}</h4>
            {c.riffs.length > 0 && (
              <ul aria-label="Wildcard improvements">
                {c.riffs.map((r, n) => (
                  <li key={n}>{r}</li>
                ))}
              </ul>
            )}
            {shown && maxRemix > 0 && c.riffs.length === maxRemix && (
              <small className="sc-remixed">
                <Zap size={14} /> Most remixed
              </small>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function Session({
  room,
  host,
  busy,
  send,
}: {
  room: SparkView;
  host: boolean;
  busy: boolean;
  send: Send;
}) {
  const { stage } = room;
  const timed = room.endsAt !== null || room.remaining !== null;
  const buttons = {
    lobby: "Start pitch sprint",
    pitch: "Reveal pitches & deal wildcards",
    remix: "Start switch-sides debate",
    debate: "Open secret ballot",
    ballot: "Reveal the votes",
  } as const;
  const needs =
    stage === "lobby" && room.count < 2
      ? "Waiting for two players"
      : stage === "pitch" && room.pitchCount < 2
        ? "Waiting for two pitches"
        : stage === "ballot" && room.voteCount < 1
          ? "Waiting for a ballot"
          : "";
  return (
    <>
      <ol className="sc-track" aria-label="Game progress">
        {stages.map((s, i) => (
          <li
            key={s}
            aria-current={stage === s ? "step" : undefined}
            data-past={i < stages.indexOf(stage)}
          >
            {labels[s]}
          </li>
        ))}
      </ol>
      <header className="sc-arena">
        <div className="sc-stage">
          <span>
            <Ticket size={17} /> {host ? "Host board" : "Player ticket"} ·{" "}
            {labels[stage]}
          </span>
          {timed && <Clock room={room} />}
        </div>
        <h1>{room.topic}</h1>
        <p>{guide[stage]}</p>
        <div className="sc-count">
          <UsersRound size={17} />
          {room.count} at the table
          {stage === "pitch" && <> · {room.pitchCount} pitches sealed</>}
          {stage === "remix" && <> · {room.riffCount} wildcards played</>}
          {stage === "ballot" && <> · {room.voteCount} ballots in</>}
        </div>
      </header>
      {host && (stage === "lobby" || stage === "pitch") && (
        <Invite code={room.code} />
      )}
      {stage === "recap" && <Recap room={room} />}
      {host && stage in buttons && (
        <section className="sc-controls" aria-label="Host controls">
          <button
            className="sc-primary"
            disabled={busy || !!needs}
            onClick={() => void send({ type: "advance", from: stage })}
          >
            {needs || buttons[stage as keyof typeof buttons]}{" "}
            <ArrowRight size={16} />
          </button>
          {timed && (
            <>
              <button
                disabled={busy}
                onClick={() =>
                  void send({
                    type: "clock",
                    from: stage,
                    control: room.remaining === null ? "pause" : "resume",
                  })
                }
              >
                {room.remaining === null ? "Pause timer" : "Resume timer"}
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  void send({ type: "clock", from: stage, control: "extend" })
                }
              >
                +30 seconds
              </button>
            </>
          )}
        </section>
      )}
      {!host && room.own && (
        <GuestTurn room={room} key={stage} send={send} busy={busy} />
      )}
      {(stage === "remix" ||
        stage === "debate" ||
        stage === "ballot" ||
        stage === "reveal" ||
        stage === "recap") && (
        <div className="sc-goal">
          <Zap size={23} aria-hidden="true" />
          <div>
            <strong>
              {room.covered === room.pitchCount
                ? "Full Circuit unlocked!"
                : "Team challenge · Full Circuit"}
            </strong>
            <p>
              {room.covered} of {room.pitchCount} pitches received a wildcard.
            </p>
          </div>
          <progress
            aria-label="Pitches with a wildcard"
            value={room.covered}
            max={room.pitchCount}
          />
        </div>
      )}
      {room.cards.length > 0 && (host || stage !== "ballot") && (
        <Board room={room} />
      )}
      {stage === "reveal" &&
        (host ? (
          <CommitCard room={room} send={send} busy={busy} />
        ) : (
          <div className="sc-slip">
            <Flag />
            <p>
              Help the host agree a first step, a volunteer and a way to tell if
              it worked.
            </p>
          </div>
        ))}
    </>
  );
}

export default function SparkCup({
  host,
  initialCode,
}: {
  host: boolean;
  initialCode: string;
}) {
  const router = useRouter();
  const code = initialCode.trim().toUpperCase();
  const [room, setRoom] = useState<SparkView | null>(null);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [topic, setTopic] = useState("");
  const [typed, setTyped] = useState(code);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const active = room?.code === code ? room : null;
  const joined = Boolean(active);
  const done = active?.stage === "recap";
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      let again = false;
      try {
        if (!code) {
          if (host) {
            const list = await request(endpoint);
            if (!stopped) setRooms(list);
          }
        } else {
          const res = await fetch(
            endpoint +
              "?code=" +
              encodeURIComponent(code) +
              (host ? "&host=1" : ""),
            { cache: "no-store" },
          );
          if (!(res.status === 403 && !host && !joined)) {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            if (!stopped)
              setRoom((old) =>
                old && old.code === code && old.now > data.now ? old : data,
              );
            again = data.stage !== "recap";
          }
        }
        if (!stopped) setError("");
      } catch (err) {
        if (!stopped) setError(message(err));
        again = joined && !done;
      } finally {
        if (!stopped) {
          setLoaded(true);
          if (again) timer = setTimeout(poll, document.hidden ? 6500 : 2200);
        }
      }
    };
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [code, host, joined, done]);
  const [formError, setFormError] = useState("");
  const send: Send = async (action) => {
    if (busy) return false;
    setBusy(true);
    setFormError("");
    try {
      const data = await request(endpoint, { code, ...action });
      setRoom(data);
      setError("");
      if (data.code !== code)
        router.push((host ? hostPath : joinPath) + "?room=" + data.code, {
          scroll: false,
        });
      return true;
    } catch (err) {
      setFormError(message(err));
      return false;
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={"spark-cup" + (host ? "" : " sc-guest")}>
      <nav className="sc-nav">
        {host ? (
          <Link href={code ? hostPath : "/dashboard/games"}>
            <ArrowLeft size={16} />
            {code ? "My sessions" : "Civic games"}
          </Link>
        ) : (
          <span>Cosmogov · Team games</span>
        )}
        <span>
          <Trophy size={16} /> Spark Cup
        </span>
      </nav>
      {(formError || error) && (
        <div className="sc-error" role="alert">
          {formError || error}
        </div>
      )}
      {active ? (
        <Session room={active} host={host} send={send} busy={busy} />
      ) : host && code ? (
        <p role="status">
          {loaded && error
            ? "Return to My sessions to choose an available room."
            : "Opening your host board…"}
        </p>
      ) : (
        <>
          <header className="sc-cover">
            <div>
              <small>
                {host
                  ? `2–${capacity} players · About 15 minutes`
                  : "Your ticket to the table"}
              </small>
              <h1>Spark Cup</h1>
              <p>
                Pitch a fix. Play a wildcard on a rival idea. Take one
                experiment back to work.
              </p>
            </div>
            <Marquee />
          </header>
          {host ? (
            <>
              <form
                className="sc-sheet"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send({ type: "create", topic });
                }}
              >
                <h2>What should your team improve?</h2>
                <label>
                  Your game question
                  <textarea
                    rows={2}
                    maxLength={180}
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="How could we…?"
                  />
                </label>
                <details>
                  <summary>Try a starter question</summary>
                  <div className="sc-starters">
                    {sampleTopics.map((t) => (
                      <button key={t} type="button" onClick={() => setTopic(t)}>
                        {t}
                      </button>
                    ))}
                  </div>
                </details>
                <button className="sc-primary" disabled={busy || !topic.trim()}>
                  Open a room <ArrowRight size={17} />
                </button>
                <p className="sc-note">
                  Guests join with the QR or code. Anyone with the invite can
                  join until the wildcard round. Rooms expire after seven days.
                </p>
              </form>
              {rooms.length > 0 && (
                <section className="sc-sheet">
                  <h3>My sessions</h3>
                  {rooms.map((r) => (
                    <Link key={r.code} href={hostPath + "?room=" + r.code}>
                      {r.topic} <ArrowRight size={15} />
                    </Link>
                  ))}
                </section>
              )}
            </>
          ) : (
            <form
              className="sc-sheet"
              onSubmit={(e) => {
                e.preventDefault();
                void send({ type: "join", code: typed.trim().toUpperCase() });
              }}
            >
              <h2>Join your team</h2>
              <label>
                Eight-character room code
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value.toUpperCase())}
                  required
                  minLength={8}
                  maxLength={8}
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
              <button
                className="sc-primary"
                disabled={
                  busy || typed.trim().length !== 8 || (!loaded && !!code)
                }
              >
                Take my seat <ArrowRight size={17} />
              </button>
              <p className="sc-note">
                No account needed. Pitches and wildcards appear without names.
                Use this browser throughout the game.
              </p>
            </form>
          )}
        </>
      )}
    </div>
  );
}
