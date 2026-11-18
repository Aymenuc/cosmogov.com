"use client";
import { useState } from "react";
import { BatteryCharging } from "lucide-react";
import {
  crews,
  days,
  moves,
  ready,
  riskNames,
  target,
  report,
  type Choice,
  type DerbyView,
  type Pilot,
  type Risk,
  type Tactic,
} from "@/lib/games/derby";
import { TacticCards, verdict } from "./Racetrack";
export type Send = (data: Record<string, unknown>) => Promise<boolean>;
export function Planning({
  room,
  busy,
  send,
}: {
  room: DerbyView;
  busy: boolean;
  send: Send;
}) {
  const me = room.own!,
    car = room.cars[me.crew];
  const [tactic, setTactic] = useState<Tactic | null>(me.vote?.tactic ?? null);
  const [note, setNote] = useState(me.vote?.note ?? "");
  const [bet, setBet] = useState<Risk | null>(me.vote?.bet ?? null);
  const activeBet = car.battery ? bet : null;
  const saved =
    tactic === me.vote?.tactic &&
    note.trim() === me.vote?.note &&
    activeBet === me.vote?.bet;
  return (
    <form
      className="dd-paper"
      onSubmit={(e) => {
        e.preventDefault();
        if (tactic)
          void send({
            type: "vote",
            day: room.day,
            choice: { tactic, note, bet: activeBet } satisfies Choice,
          });
      }}
    >
      <small>
        {crews[me.crew]} garage · {me.hand}
      </small>
      <h2>Pick your crew’s play</h2>
      <p>
        Discuss the forecast. The most-picked tactic runs. The rotating driver
        breaks ties and has first say on which matching example and wager to
        use.
      </p>
      {me.radio.length > 0 && (
        <aside className="dd-radio">
          <strong>Crew radio · teammates’ sealed plays</strong>
          {me.radio.map((v, i) => (
            <div key={i}>
              <p>
                {moves[v.tactic].name} · {v.note}
                {v.bet && " · wager on " + riskNames[v.bet]}
              </p>
              <button
                type="button"
                className="dd-plain"
                disabled={busy}
                onClick={async () => {
                  const choice = { ...v, bet: car.battery ? v.bet : null };
                  if (await send({ type: "vote", day: room.day, choice })) {
                    setTactic(choice.tactic);
                    setNote(choice.note);
                    setBet(choice.bet);
                  }
                }}
              >
                Back this play
              </button>
            </div>
          ))}
        </aside>
      )}
      <TacticCards selected={tactic} choose={setTactic} />
      <label>
        {tactic
          ? moves[tactic].prompt
          : "What would this play look like on your team?"}
        <input
          required
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={180}
          placeholder="One concrete action we could take"
        />
      </label>
      <div className="dd-battery">
        <BatteryCharging aria-hidden="true" />
        <div>
          <strong>One crew battery for the week</strong>
          {me.scout ? (
            <p>
              Your scout saw the card. It is <b>{riskNames[me.scout]}</b>.
            </p>
          ) : car.battery ? (
            <>
              <p>
                Spend it to peek now, or stake it on your prediction. A correct
                wager adds 2 travel. A miss adds 2 rework.
              </p>
              <label>
                Proposed wager
                <select
                  value={activeBet ?? ""}
                  onChange={(e) =>
                    setBet((e.target.value || null) as Risk | null)
                  }
                >
                  <option value="">Keep the battery</option>
                  {room.forecast.map((k) => (
                    <option key={k} value={k}>
                      {riskNames[k]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="dd-plain"
                type="button"
                disabled={busy}
                onClick={() => void send({ type: "scout", day: room.day })}
              >
                Spend battery to scout
              </button>
            </>
          ) : (
            <p>The battery has been spent.</p>
          )}
        </div>
      </div>
      <button
        className="dd-btn"
        disabled={busy || !tactic || !note.trim() || saved}
      >
        {saved ? "Play sealed" : "Seal my play"}
      </button>
      <span className="dd-note" role="status">
        {saved
          ? "You can change your play until the host flips the event."
          : "The rival crew sees your tactic at the reveal."}
      </span>
    </form>
  );
}
export function Debrief({
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
  const [pick, setPick] = useState("");
  const [fields, setFields] = useState({
    step: "",
    owner: "",
    measure: "",
    date: "",
    concern: "",
  });
  const p = room.pilot;
  function download() {
    const url = URL.createObjectURL(
      new Blob([report(room)], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "deadline-derby-work-pilot.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const prompts = [
    ["step", "What will you try on the real project?", 200],
    ["owner", "Who volunteered?", 80],
    ["measure", "What will you measure against today’s baseline?", 180],
    ["concern", "What could make this backfire?", 180],
    ["date", "When will you check?", 10],
  ] as const;
  return (
    <section className="dd-paper">
      <small>
        Friday finish · {room.cars.filter((c) => ready(c) >= target).length} of
        2 crews home
      </small>
      <h2>{verdict(room.cars)}</h2>
      {p ? (
        <>
          <h3>Your team’s pilot</h3>
          <blockquote>{room.logs[p.day].laps[p.crew].choice.note}</blockquote>
          <dl>
            {prompts.map(([k, label]) => (
              <div key={k}>
                <dt>{label}</dt>
                <dd>{p[k]}</dd>
              </div>
            ))}
          </dl>
          <button className="dd-btn" onClick={download}>
            Download pilot and race log
          </button>
        </>
      ) : host ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const [day, crew] = pick.split("-").map(Number);
            void send({
              type: "finish",
              pilot: { day, crew: crew as 0 | 1, ...fields } satisfies Pilot,
            });
          }}
        >
          <p>
            Pick a move someone actually proposed. Decide what evidence would
            tell you it worked outside this simulation.
          </p>
          <label>
            Play worth testing
            <select
              required
              value={pick}
              onChange={(e) => setPick(e.target.value)}
            >
              <option value="">Choose from the race log</option>
              {room.logs.flatMap((l, d) =>
                l.laps.map((lap, c) => (
                  <option key={d + "-" + c} value={d + "-" + c}>
                    {days[d]} · {crews[c]} · {lap.choice.note}
                  </option>
                )),
              )}
            </select>
          </label>
          {prompts.map(([k, label, max]) => (
            <label key={k}>
              {label}
              <input
                required
                type={k === "date" ? "date" : "text"}
                maxLength={max}
                value={fields[k]}
                onChange={(e) => setFields({ ...fields, [k]: e.target.value })}
              />
            </label>
          ))}
          <button className="dd-btn" disabled={busy}>
            Save the work pilot
          </button>
        </form>
      ) : (
        <p>
          Tell the host which play you would test at work, and what would
          convince you to keep it.
        </p>
      )}
    </section>
  );
}
