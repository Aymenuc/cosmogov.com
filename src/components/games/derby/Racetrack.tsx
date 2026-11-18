import {
  BatteryCharging,
  Flag,
  Gauge,
  LifeBuoy,
  ShieldCheck,
  Wrench,
  Workflow,
  Zap,
} from "lucide-react";
import {
  crews,
  ready,
  target,
  moves,
  tactics,
  riskNames,
  type Car,
  type Tactic,
  type DayLog,
  type Hazards,
} from "@/lib/games/derby";
import "./derby.css";

const icons = {
  sprint: Zap,
  handoff: Workflow,
  quality: ShieldCheck,
  capacity: LifeBuoy,
  repair: Wrench,
};
export function Racer({ crew }: { crew: number }) {
  return (
    <span className={"dd-racer dd-racer-" + crew} aria-hidden="true">
      <i className="dd-body" />
      <i className="dd-glass" />
      <i className="dd-stripe" />
      <i className="dd-wheel rear" />
      <i className="dd-wheel front" />
    </span>
  );
}
export function RackArt() {
  return (
    <span className="dd-art" aria-hidden="true">
      <span className="dd-art-lane" />
      <Racer crew={0} />
      <Racer crew={1} />
    </span>
  );
}
export function Track({ cars }: { cars: Car[] }) {
  const limit = Math.max(10, ...cars.map((car) => ready(car) + 1));
  return (
    <section className="dd-track" aria-label="Friday race standings">
      <header>
        <span>
          <Gauge size={17} /> Ready work
        </span>
        <span>
          <Flag size={17} /> Friday goal · {target}
        </span>
      </header>
      {cars.map((car, i) => (
        <div className="dd-row" key={i}>
          <div className="dd-team">
            <b>{crews[i]}</b>
            <strong>
              {ready(car)} <small>ready</small>
            </strong>
          </div>
          <div className="dd-asphalt">
            <div className="dd-course">
              <i
                className="dd-finish"
                style={{ left: (100 * target) / limit + "%" }}
              />
              <span
                className="dd-position"
                style={{ left: (100 * ready(car)) / limit + "%" }}
              >
                <Racer crew={i} />
              </span>
            </div>
          </div>
          <div className="dd-gauges">
            <span>
              {car.distance} travelled − {car.debt} rework
              {car.debt >= 4 && " · overheating"}
            </span>
            <span>
              {car.cover ? riskNames[car.cover] + " cover" : "No stored cover"}
            </span>
            <span>
              <BatteryCharging size={13} />
              {car.battery ? "Charged" : "Spent"}
            </span>
            <span>Rope {car.rope ? "ready" : "used"}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
export function TacticCards({
  selected,
  choose,
  disabled = false,
}: {
  selected: Tactic | null;
  choose: (t: Tactic) => void;
  disabled?: boolean;
}) {
  return (
    <div className="dd-deck" role="group" aria-label="Tactic cards">
      {tactics.map((t) => {
        const Icon = icons[t];
        return (
          <button
            key={t}
            className={"dd-tactic dd-" + t}
            type="button"
            aria-pressed={selected === t}
            disabled={disabled}
            onClick={() => choose(t)}
          >
            <Icon size={22} aria-hidden="true" />
            <b>{moves[t].name}</b>
            <span>{moves[t].rule}</span>
          </button>
        );
      })}
    </div>
  );
}
export function LapResult({ log, hazards }: { log: DayLog; hazards: Hazards }) {
  return (
    <section className="dd-reveal">
      <small>Event card turned over · {riskNames[log.event.risk]}</small>
      <h3>{hazards[log.event.risk]}</h3>
      <div className="dd-versus">
        {log.laps.map((l, i) => (
          <div key={i}>
            <strong>
              {crews[i]} · {moves[l.choice.tactic].name}
            </strong>
            <p>{l.choice.note}</p>
            <small>
              {l.hit
                ? "Hit · +" + log.event.damage + " rework"
                : l.choice.tactic === "repair"
                  ? "Sheltered in the pit"
                  : l.usedCover
                    ? "Saved by stored cover"
                    : "Covered the event"}
              {l.wonBet === null
                ? ""
                : l.wonBet
                  ? " · Wager won (+2 travel)"
                  : " · Wager lost (+2 rework)"}
            </small>
            {l.before.debt >= 4 && l.choice.tactic !== "repair" && (
              <small>Overheated engine · −1 travel</small>
            )}
            <b>
              {ready(l.before)} → {ready(log.final[i])} ready
            </b>
          </div>
        ))}
      </div>
      {log.tows.map((c) => (
        <p key={c}>
          {crews[c]} lent a rope. They spent one space to clear up to two of{" "}
          {crews[1 - c]}’s rework.
        </p>
      ))}
    </section>
  );
}
export function verdict(cars: Car[]) {
  const a = ready(cars[0]),
    b = ready(cars[1]);
  return a === b
    ? "Photo finish · a tie"
    : crews[a > b ? 0 : 1] + " take the cup";
}
