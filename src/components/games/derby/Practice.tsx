"use client";
import { useState } from "react";
import Link from "next/link";
import {
  canTow,
  kinds,
  moves,
  newCar,
  race,
  ready,
  riskNames,
  starter,
  target,
  tow,
  type DayLog,
  type Risk,
  type Tactic,
} from "@/lib/games/derby";
import { LapResult, RackArt, TacticCards, Track, verdict } from "./Racetrack";

const grid = () => [0, 1].map(() => ({ ...newCar(), distance: 7 }));
export default function Practice() {
  const [forecast, setForecast] = useState<Risk[]>(["handoff", "capacity"]);
  const [log, setLog] = useState<DayLog | null>(null);
  function drive(t: Tactic) {
    const risk = forecast[Math.floor(Math.random() * 2)],
      event = { risk, forecast, damage: 3 };
    const cars = grid(),
      laps = [
        race(cars[0], { tactic: t, note: moves[t].rule, bet: null }, event),
        race(
          cars[1],
          {
            tactic: "sprint",
            note: "Ship the draft today and handle corrections later.",
            bet: null,
          },
          event,
        ),
      ];
    setLog({ event, laps, tows: [], final: laps.map((l) => ({ ...l.after })) });
  }
  const cars = log?.final ?? grid();
  return (
    <div className="derby dd-public">
      <header className="dd-top">
        <span>Cosmogov / Team games</span>
        <Link href="/play/derby">Join a room</Link>
      </header>
      <section className="dd-title">
        <div>
          <small>Deadline Derby · Solo practice lap</small>
          <h1>One lap to Friday</h1>
          <p>
            You drive the Comets. It’s 7–7, and eight gets you home. The
            simulated Fireflies are flooring it. You have one move.
          </p>
        </div>
        <RackArt />
      </section>
      <Track cars={cars} />
      {!log ? (
        <section className="dd-paper">
          <small>Thursday forecast · 3 rework if hit</small>
          <h2>
            {riskNames[forecast[0]]} or {riskNames[forecast[1]]}?
          </h2>
          <p>
            Cover one, gamble on speed, or duck into the pit. Pick a card to
            flip the event.
          </p>
          <TacticCards selected={null} choose={drive} />
        </section>
      ) : (
        <>
          <LapResult log={log} hazards={starter.risks} />
          <section className="dd-paper">
            <h2>{verdict(cars)}</h2>
            <p>
              {cars.every((c) => ready(c) >= target)
                ? "Both crews made Friday."
                : cars.some((c) => ready(c) >= target)
                  ? "One crew made Friday."
                  : "Both crews missed Friday."}
            </p>
            {canTow(cars, log.laps, 0) && (
              <button
                className="dd-btn"
                onClick={() => {
                  const final = cars.map((c) => ({ ...c }));
                  tow(final, 0);
                  setLog({ ...log, final, tows: [0] });
                }}
              >
                Lend the Fireflies a tow · spend 1 space
              </button>
            )}
            <button
              className="dd-plain"
              onClick={() => {
                const at = Math.floor(Math.random() * 3);
                setForecast([kinds[at], kinds[(at + 1) % 3]]);
                setLog(null);
              }}
            >
              Race again
            </button>
            <Link className="dd-link" href="/dashboard/games/deadline-derby">
              Host the four-day team race →
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
