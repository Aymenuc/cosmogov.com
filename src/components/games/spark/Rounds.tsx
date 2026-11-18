"use client";

import { useState } from "react";
import { Check, Flag, Trophy, WandSparkles } from "lucide-react";
import { wildcards, type Experiment, type SparkView } from "@/lib/games/spark";
export type Send = (action: Record<string, unknown>) => Promise<boolean>;
export const guide = {
  lobby:
    "Share the ticket. When two colleagues are in, the host can open the sprint.",
  pitch:
    "Pitch one small change the team could actually test. The ideas turn face up together.",
  remix:
    "Draw a wildcard and improve a rival pitch. Take turns making the case for the change.",
  debate:
    "Pair up. Each take 30 seconds to defend a pitch you didn’t write. Name one trade-off the team should hear.",
  ballot:
    "Which experiment would you spend next week trying? Pick one. Totals stay hidden until the reveal.",
  reveal:
    "Hear one reservation about the leading idea, then agree how to test it.",
  recap: "Take the experiment back to work. Revisit it on the check-in date.",
};
export function GuestTurn({
  room,
  send,
  busy,
}: {
  room: SparkView;
  send: Send;
  busy: boolean;
}) {
  const me = room.own!;
  const { stage, cards } = room;
  const other = cards.filter((c) => c.id !== me.idea);
  const [text, setText] = useState(stage === "pitch" ? me.pitch : me.riff);
  const suggested =
    cards[
      (cards.findIndex((c) => c.id === me.idea) + 1) % Math.max(1, cards.length)
    ];
  const [flipped, setFlipped] = useState(Boolean(me.riff));
  const [target, setTarget] = useState(
    stage === "ballot" ? me.vote : me.target || suggested?.id || "",
  );
  if (stage === "lobby")
    return (
      <div className="sc-slip">
        <Check aria-hidden="true" />
        <h3>You have a seat</h3>
        <p>
          Think of one small thing your team could improve. Your phone will turn
          into a pitch card when the host starts.
        </p>
      </div>
    );
  if (stage === "debate") {
    const rival = other.find((c) => c.id === me.target) || suggested;
    return (
      <article className="sc-lens sc-debate">
        <Flag aria-hidden="true" />
        <div>
          <small>Make the case for this pitch</small>
          <h3>{rival?.pitch}</h3>
          {rival?.riffs.map((r, i) => (
            <p key={i}>+ {r}</p>
          ))}
          <p>“I’d try this because … The tricky part would be …”</p>
        </div>
      </article>
    );
  }
  if (!["pitch", "remix", "ballot"].includes(stage)) return null;
  const choices = stage === "remix" ? other : cards;
  const saved =
    stage === "pitch"
      ? me.pitch === text.trim() && !!me.pitch
      : stage === "remix"
        ? me.riff === text.trim() && !!me.riff && me.target === target
        : me.vote === target && !!target;
  const lens = wildcards[me.lens];
  if (stage === "remix" && !flipped)
    return (
      <div className="sc-draw">
        <div className="sc-cardback" aria-hidden="true">
          <WandSparkles size={40} />
        </div>
        <div>
          <small>Wildcard relay</small>
          <h3>Your card is face down</h3>
          <p>Flip it to discover how you can help a rival pitch.</p>
          <button className="sc-primary" onClick={() => setFlipped(true)}>
            Flip my wildcard
          </button>
        </div>
      </div>
    );
  return (
    <form
      className="sc-sheet"
      onSubmit={(e) => {
        e.preventDefault();
        void send({
          type: stage,
          ...(stage !== "ballot" && { text }),
          ...(stage !== "pitch" && { target }),
        });
      }}
    >
      {stage === "remix" && (
        <div className="sc-lens">
          <WandSparkles aria-hidden="true" />
          <div>
            <small>Your wildcard</small>
            <h3>{lens.name}</h3>
            <p>{lens.cue}</p>
          </div>
        </div>
      )}
      {stage === "remix" && (
        <label>
          Pass your wildcard to
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
          >
            {choices.map((c) => (
              <option value={c.id} key={c.id}>
                {c.pitch}
              </option>
            ))}
          </select>
        </label>
      )}
      {stage !== "ballot" ? (
        <label>
          {stage === "pitch"
            ? "Your one-sentence pitch"
            : "What would you add or change?"}
          <textarea
            required
            maxLength={220}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
        </label>
      ) : (
        <fieldset>
          <legend>My pick for the experiment</legend>
          {choices.map((c) => (
            <label key={c.id} className="sc-option">
              <input
                type="radio"
                name="ballot"
                checked={target === c.id}
                onChange={() => setTarget(c.id)}
                required
              />
              <span>
                <strong>{c.pitch}</strong>
                {c.riffs.map((r, i) => (
                  <small key={i}>↳ {r}</small>
                ))}
              </span>
            </label>
          ))}
        </fieldset>
      )}
      <button
        className="sc-primary"
        disabled={
          busy || saved || (stage === "ballot" ? !target : !text.trim())
        }
      >
        {saved
          ? "Saved for this round"
          : stage === "pitch"
            ? "Seal my pitch"
            : stage === "remix"
              ? "Play my wildcard"
              : "Cast my ballot"}
      </button>
      <p className="sc-note" role="status">
        {saved
          ? "You can change your choice until the host closes the round."
          : "The host controls the pace. You can also sit out a round."}
      </p>
    </form>
  );
}

const emptyExperiment: Experiment = {
  step: "",
  owner: "",
  checkIn: "",
  signal: "",
  concern: "",
};
export function CommitCard({
  room,
  send,
  busy,
}: {
  room: SparkView;
  send: Send;
  busy: boolean;
}) {
  const top = Math.max(...room.cards.map((c) => c.votes || 0));
  const leaders = room.cards.filter((c) => c.votes === top);
  const [choice, setChoice] = useState(
    leaders.length === 1 ? leaders[0].id : "",
  );
  const [card, setCard] = useState(emptyExperiment);
  const fields = [
    ["step", "First step", 240],
    ["owner", "Who volunteered to lead it?", 80],
    ["signal", "What would count as progress?", 200],
    ["concern", "Reservation to check (optional)", 200],
  ] as const;
  return (
    <form
      className="sc-sheet"
      onSubmit={(e) => {
        e.preventDefault();
        void send({ type: "finish", winner: choice, experiment: card });
      }}
    >
      <h3>
        <Flag aria-hidden="true" /> Make it a team experiment
      </h3>
      {leaders.length === 1 ? (
        <p>
          <strong>{leaders[0].pitch}</strong>
        </p>
      ) : (
        <label>
          The vote tied. Hear each case, then agree which to try first.
          <select
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            required
          >
            <option value="">Choose a tied pitch</option>
            {leaders.map((c) => (
              <option key={c.id} value={c.id}>
                {c.pitch}
              </option>
            ))}
          </select>
        </label>
      )}
      {fields.map(([key, label, max]) => (
        <label key={key}>
          {label}
          <input
            value={card[key]}
            maxLength={max}
            required={key !== "concern"}
            onChange={(e) => setCard({ ...card, [key]: e.target.value })}
          />
        </label>
      ))}
      <label>
        Check-in date
        <input
          type="date"
          value={card.checkIn}
          required
          onChange={(e) => setCard({ ...card, checkIn: e.target.value })}
        />
      </label>
      <button className="sc-primary" disabled={busy}>
        Award the cup &amp; save experiment
      </button>
    </form>
  );
}

export function Recap({ room }: { room: SparkView }) {
  const c = room.experiment!;
  const winner = room.cards.find((card) => card.id === room.winner)!;
  const lines = [
    ["First step", c.step],
    ["Volunteer", c.owner],
    ["Check-in", c.checkIn],
    ["Sign of progress", c.signal],
    ...(c.concern ? [["Reservation to revisit", c.concern]] : []),
  ];
  function download() {
    const scores = room.cards.map((card) =>
      [
        card.pitch + " (" + card.votes + " votes)",
        ...card.riffs.map((r) => "  + " + r),
      ].join("\n"),
    );
    const text = [
      "SPARK CUP",
      room.topic,
      "",
      winner.pitch,
      ...lines.map(([k, v]) => k + " — " + v),
      "",
      "All pitches & wildcards",
      ...scores,
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "spark-cup-experiment.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <article className="sc-result">
      <Trophy size={40} aria-hidden="true" />
      <small>The team’s experiment</small>
      <h2>{winner.pitch}</h2>
      <dl>
        {lines.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <button className="sc-primary" onClick={download}>
        Download experiment &amp; board
      </button>
    </article>
  );
}
