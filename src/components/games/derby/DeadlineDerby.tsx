"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Flag, Timer } from "lucide-react";
import { useRoom } from "../workshop/useRoom";
import RoomInvite from "../workshop/RoomInvite";
import {
  canTow,
  crews,
  days,
  kinds,
  riskNames,
  starter,
  riskAlternatives,
  type DerbyView,
  type Risk,
} from "@/lib/games/derby";
import { LapResult, RackArt, Track } from "./Racetrack";
import { Debrief, Planning, type Send } from "./Turns";

const hostPath = "/dashboard/games/deadline-derby",
  joinPath = "/play/derby";
const questions = [
  "Which dependency needs a head start?",
  "Which assumption from Monday still holds?",
  "What would you drop to protect Friday?",
  "What can you deliver with the rework still on the board?",
];
function Handbook() {
  return (
    <details className="dd-rules">
      <summary>How to race</summary>
      <ul>
        <li>
          Race the same four events. Friday’s cup goes to the crew with the most
          ready work. Get both crews to eight for a shared win.
        </li>
        <li>
          Ready work is travel minus rework, down to zero. Starting with four or
          more rework slows every moving tactic by one space. A pit stop clears
          up to three.
        </li>
        <li>
          A matching tactic covers today’s risk. An unused tactic shield
          replaces your spare. A matching spare protects you once on a later
          day.
        </li>
        <li>
          Each crew has one battery. Scout the exact event or wager on a
          forecast. One tow rope lets you spend a space to clear up to two of
          your rival’s rework after a hit.
        </li>
        <li>
          Crews discuss and seal individual plays. The most-picked tactic runs.
          Among tied or matching plays the rotating driver has priority, then
          the next teammate in order. That ballot also supplies the example and
          wager.
        </li>
      </ul>
    </details>
  );
}
function RaceClock({ room }: { room: DerbyView }) {
  const [now, setNow] = useState(room.now);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setNow(room.now + Date.now() - start), 250);
    return () => clearInterval(id);
  }, [room.now]);
  const sec = Math.max(
    0,
    Math.ceil((room.remaining ?? (room.endsAt ?? now) - now) / 1000),
  );
  return (
    <div className="dd-clock">
      <Timer size={16} />
      <b role="timer" aria-label="Round time remaining">
        {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, "0")}
      </b>
      <span>
        {room.remaining !== null
          ? "Paused"
          : sec === 0
            ? "Host can move on"
            : "Round clock"}
      </span>
    </div>
  );
}
function Setup({
  host,
  code,
  send,
  busy,
  loaded,
  rooms,
}: {
  host: boolean;
  code: string;
  send: Send;
  busy: boolean;
  loaded: boolean;
  rooms: { code: string; topic: string }[];
}) {
  const [topic, setTopic] = useState(starter.topic),
    [hazards, setHazards] = useState(starter.risks),
    [typed, setTyped] = useState(code);
  return (
    <>
      <header className="dd-title">
        <div>
          <small>
            {host ? "2–24 players · Allow 30 minutes" : "Cosmogov team race"}
          </small>
          <h1>Deadline Derby</h1>
          <p>
            Two crews. One Friday deadline. Push your luck, cover the next
            bottleneck, or lend your rivals your last tow rope.
          </p>
          <Link href="/play/derby?demo=1">
            Drive a practice lap <ArrowRight size={16} />
          </Link>
        </div>
        <RackArt />
      </header>
      {host ? (
        <>
          <form
            className="dd-paper"
            onSubmit={(e) => {
              e.preventDefault();
              void send({ type: "create", topic, hazards });
            }}
          >
            <small>Host setup</small>
            <h2>Put a real project on the grid</h2>
            <div className="dd-switch">
              {[starter, riskAlternatives].map((s, i) => (
                <button
                  key={s.topic}
                  className="dd-plain"
                  type="button"
                  onClick={() => {
                    setTopic(s.topic);
                    setHazards(s.risks);
                  }}
                >
                  {i ? "Project handover" : "Research brief"}
                </button>
              ))}
            </div>
            <label>
              Your team’s Friday goal
              <input
                required
                maxLength={180}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </label>
            <p>
              Write three plausible surprises for your own team. The race deals
              them as simulated events.
            </p>
            {kinds.map((k) => (
              <label key={k}>
                {riskNames[k]} surprise
                <input
                  required
                  maxLength={180}
                  value={hazards[k]}
                  onChange={(e) =>
                    setHazards({ ...hazards, [k]: e.target.value })
                  }
                />
              </label>
            ))}
            <button className="dd-btn" disabled={busy}>
              Open the starting grid <Flag size={16} />
            </button>
          </form>
          {rooms.length > 0 && (
            <section className="dd-paper">
              <h2>My races</h2>
              {rooms.map((r) => (
                <Link
                  className="dd-link"
                  key={r.code}
                  href={hostPath + "?room=" + r.code}
                >
                  {r.topic} →
                </Link>
              ))}
            </section>
          )}
        </>
      ) : (
        <form
          className="dd-paper"
          onSubmit={(e) => {
            e.preventDefault();
            void send({ type: "join", code: typed.trim().toUpperCase() });
          }}
        >
          <h2>Join the starting grid</h2>
          <label>
            Room code
            <input
              required
              value={typed}
              minLength={8}
              maxLength={8}
              autoCapitalize="characters"
              autoComplete="off"
              onChange={(e) => setTyped(e.target.value.toUpperCase())}
            />
          </label>
          <button
            className="dd-btn"
            disabled={busy || typed.trim().length !== 8 || (!loaded && !!code)}
          >
            Join a crew
          </button>
          <p>
            Only the host signs in. Keep this browser to return to your seat.
          </p>
        </form>
      )}
      <Handbook />
    </>
  );
}
function Session({
  room,
  host,
  busy,
  send,
}: {
  room: DerbyView;
  host: boolean;
  busy: boolean;
  send: Send;
}) {
  const { stage, day, own } = room;
  const timed = stage === "plan" || stage === "pit";
  const from = { type: "advance", day, from: stage };
  const lastLog = room.logs[day];
  const next =
    stage === "lobby"
      ? "Start Monday"
      : stage === "plan"
        ? "Flip the event"
        : day === 3
          ? "Cross the finish line"
          : "Start " + days[day + 1];
  const waiting =
    (stage === "lobby" && room.counts.some((c) => !c)) ||
    (stage === "plan" && room.votes.some((v) => !v));
  return (
    <>
      <header className="dd-live">
        <div className="dd-between">
          <small>
            {host ? "Race control" : crews[own!.crew] + " crew"} ·{" "}
            {stage === "lobby"
              ? "Starting grid"
              : stage === "debrief" || stage === "recap"
                ? "Friday"
                : days[day]}
          </small>
          {timed && <RaceClock room={room} />}
        </div>
        <h1>{room.topic}</h1>
        {stage === "lobby" ? (
          <p>
            {room.counts[0]} Comets · {room.counts[1]} Fireflies. Each crew
            needs a driver to start.
          </p>
        ) : (
          <ol aria-label="Race week">
            {[...days, "Friday"].map((d, i) => (
              <li
                aria-current={
                  i === (stage === "debrief" || stage === "recap" ? 4 : day)
                    ? "step"
                    : undefined
                }
                key={d}
              >
                {d.slice(0, 3)}
              </li>
            ))}
          </ol>
        )}
      </header>
      {host && stage === "lobby" && (
        <RoomInvite
          name="Deadline Derby"
          code={room.code}
          joinPath={joinPath}
        />
      )}
      <Track cars={room.cars} />
      {stage === "plan" && (
        <section className="dd-forecast">
          <div>
            <small>Possible event cards · {room.damage} rework on impact</small>
            <h2>{room.forecast.map((r) => riskNames[r]).join(" or ")}?</h2>
          </div>
          <div className="dd-hazards">
            {room.forecast.map((r: Risk) => (
              <div key={r}>
                <b>{riskNames[r]}</b>
                <p>{room.hazards[r]}</p>
              </div>
            ))}
          </div>
          <p className="dd-question">{questions[day]}</p>
        </section>
      )}
      {host && (stage === "lobby" || timed) && (
        <div className="dd-control">
          <strong>
            {stage === "plan"
              ? room.votes
                  .map((v, c) => crews[c] + " " + v + "/" + room.counts[c])
                  .join(" · ")
              : "Host controls"}
          </strong>
          <button
            className="dd-btn"
            disabled={busy || waiting}
            onClick={() => void send(from)}
          >
            {next}
          </button>
          {timed && (
            <>
              {(["pause", "resume", "extend"] as const)
                .filter(
                  (m) =>
                    m === "extend" ||
                    (room.remaining === null ? m === "pause" : m === "resume"),
                )
                .map((mode) => (
                  <button
                    className="dd-plain"
                    key={mode}
                    disabled={busy}
                    onClick={() =>
                      void send({ type: "clock", from: stage, day, mode })
                    }
                  >
                    {mode === "extend"
                      ? "+1 minute"
                      : mode === "pause"
                        ? "Pause timer"
                        : "Resume timer"}
                  </button>
                ))}
            </>
          )}
          {waiting && (
            <span>
              {stage === "lobby"
                ? "Waiting for both crews."
                : "Both crews must seal a play."}
            </span>
          )}
        </div>
      )}
      {stage === "plan" && !host && own && (
        <Planning key={day} room={room} busy={busy} send={send} />
      )}
      {lastLog && stage === "pit" && (
        <>
          <LapResult log={lastLog} hazards={room.hazards} />
          <section className="dd-paper">
            <small>Pit radio</small>
            <h2>Would that really happen here?</h2>
            <p>
              Which detail from your work makes today’s event more or less
              likely? Use it to plan tomorrow’s move.
            </p>
            {own && canTow(room.cars, lastLog.laps, own.crew) && (
              <button
                className="dd-btn"
                disabled={busy}
                onClick={() => void send({ type: "tow", day })}
              >
                Lend a tow rope · spend 1 space
              </button>
            )}
          </section>
        </>
      )}
      {(stage === "debrief" || stage === "recap") && (
        <Debrief room={room} host={host} busy={busy} send={send} />
      )}
      {room.logs.length > 0 && (
        <details className="dd-rules">
          <summary>Race log · {room.logs.length} completed laps</summary>
          {room.logs.map((l, i) => (
            <div key={i}>
              <h3>{days[i]}</h3>
              <LapResult log={l} hazards={room.hazards} />
            </div>
          ))}
        </details>
      )}
      <Handbook />
    </>
  );
}
export default function DeadlineDerby({
  host,
  initialCode,
}: {
  host: boolean;
  initialCode: string;
}) {
  const { active, code, busy, loaded, error, send, rooms } = useRoom<DerbyView>(
    host,
    initialCode,
    "/api/games/derby",
    hostPath,
    joinPath,
  );
  return (
    <div className={"derby" + (host ? "" : " dd-public")}>
      <nav className="dd-top">
        {host ? (
          <Link href={code ? hostPath : "/dashboard/games"}>
            <ArrowLeft size={15} />
            {code ? "My races" : "Civic games"}
          </Link>
        ) : (
          <span>Cosmogov / Team games</span>
        )}
        <b>
          <Flag size={15} /> Deadline Derby
        </b>
      </nav>
      {error && (
        <p role="alert" className="dd-error">
          {error}
        </p>
      )}
      {active ? (
        <Session room={active} host={host} busy={busy} send={send} />
      ) : host && code ? (
        <p role="status">
          {error
            ? "Choose an available room from My races."
            : "Opening the grid…"}
        </p>
      ) : (
        <Setup
          key={code}
          host={host}
          code={code}
          send={send}
          busy={busy}
          loaded={loaded}
          rooms={rooms}
        />
      )}
    </div>
  );
}
