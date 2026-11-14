"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Minus, Undo2 } from "lucide-react";
import {
  boardMissions,
  boardSteps,
  type BoardMission,
  type BoardStepId,
} from "./missions";

type Choice = "added" | "left";

/** The goal picker beside the headline. It drives the board next to it. */
export function MissionChooser({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mission-chooser">
      <span id="mission-chooser-label">Pick a goal and see it move</span>
      <div role="group" aria-labelledby="mission-chooser-label">
        {boardMissions.map((mission) => (
          <button
            key={mission.id}
            type="button"
            aria-pressed={selected === mission.id}
            className={selected === mission.id ? "selected" : ""}
            onClick={() => onSelect(mission.id)}
          >
            <mission.icon size={17} aria-hidden="true" />
            {mission.chip}
          </button>
        ))}
      </div>
    </div>
  );
}

function References({ mission, ids }: { mission: BoardMission; ids: number[] }) {
  return (
    <ol className="board-references">
      {ids.map((id) => (
        <li key={id}>
          <span className="board-ref">{id}</span>
          {mission.references[id - 1]}
        </li>
      ))}
    </ol>
  );
}

/**
 * A working miniature of a mission: four requested AI steps, each draft with
 * its references and open question, and a person deciding what joins.
 * Everything shown is a fixed, illustrative example. No model is called.
 */
export default function MissionBoard({ missionId }: { missionId: string }) {
  const mission =
    boardMissions.find((item) => item.id === missionId) || boardMissions[0];
  const [stepByMission, setStepByMission] = useState<
    Record<string, BoardStepId>
  >({});
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [picked, setPicked] = useState<Record<string, string>>({});

  const stepId = stepByMission[mission.id] || "research";
  const stepIndex = boardSteps.findIndex((step) => step.id === stepId);
  const step = boardSteps[stepIndex];
  const next = boardSteps[stepIndex + 1];
  const draft = mission.drafts[stepId];
  const key = (id: BoardStepId) => `${mission.id}:${id}`;
  const choice = choices[key(stepId)];
  const decidable = stepId === "plan" || stepId === "tool";
  const finished = Boolean(choices[key("plan")] && choices[key("tool")]);
  const refIds = Array.from(
    new Set((draft.points || []).flatMap((point) => point.refs)),
  ).sort((a, b) => a - b);

  const goTo = (id: BoardStepId) =>
    setStepByMission((current) => ({ ...current, [mission.id]: id }));
  const decide = (value: Choice | undefined) =>
    setChoices((current) => {
      const updated = { ...current };
      if (value) updated[key(stepId)] = value;
      else delete updated[key(stepId)];
      return updated;
    });

  return (
    <div className="mission-board">
      <div className="board-toolbar">
        <span>
          <span className="status-dot" /> {mission.community}
        </span>
        <span className="board-example">Illustrative mission</span>
      </div>
      <div className="board-goal">
        <span>The goal</span>
        <h2>{mission.goal}</h2>
      </div>
      <div className="board-tabs" role="tablist" aria-label="AI steps">
        {boardSteps.map((item, index) => {
          const state = choices[key(item.id)];
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`board-tab-${item.id}`}
              aria-selected={item.id === stepId}
              aria-controls="board-panel"
              tabIndex={item.id === stepId ? 0 : -1}
              className={`tint-${item.tint} ${item.id === stepId ? "selected" : ""}`}
              onClick={() => goTo(item.id)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowRight" && event.key !== "ArrowLeft")
                  return;
                event.preventDefault();
                const target =
                  boardSteps[
                    (index +
                      (event.key === "ArrowRight" ? 1 : -1) +
                      boardSteps.length) %
                      boardSteps.length
                  ];
                goTo(target.id);
                document.getElementById(`board-tab-${target.id}`)?.focus();
              }}
            >
              <item.icon size={16} aria-hidden="true" />
              <span>
                {item.name}
                <small>{item.role}</small>
              </span>
              {state && (
                <span className="board-tab-mark">
                  {state === "added" ? <Check size={12} /> : <Minus size={12} />}
                  <span className="visually-hidden">
                    {state === "added" ? "Adopted" : "Left out"}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div
        className="board-panel"
        role="tabpanel"
        id="board-panel"
        aria-labelledby={`board-tab-${stepId}`}
        key={`${mission.id}:${stepId}`}
      >
        <div className="board-draft-label">
          <step.icon size={13} aria-hidden="true" />
          {step.name}’s draft · example
        </div>
        <h3>{draft.headline}</h3>
        {draft.points && (
          <ul className="board-points">
            {draft.points.map((point) => (
              <li key={point.text}>
                {point.text}{" "}
                {point.refs.map((ref) => (
                  <span className="board-ref" key={ref}>
                    <span className="visually-hidden">Reference </span>
                    {ref}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        )}
        {draft.check && (
          <p className="board-check">
            <strong>Still to check</strong>
            {draft.check}
          </p>
        )}
        {refIds.length > 0 && <References mission={mission} ids={refIds} />}
        {draft.tasks && (
          <ul className="board-tasks">
            {draft.tasks.map((task) => (
              <li key={task.title}>
                <span aria-hidden="true" />
                {task.title}
                <small>about {task.minutes} min</small>
              </li>
            ))}
          </ul>
        )}
        {draft.form && (
          <fieldset className="board-form">
            <legend>{draft.form.question}</legend>
            <div>
              {draft.form.options.map((option) => (
                <label key={option}>
                  <input
                    type="radio"
                    name={`board-form-${mission.id}`}
                    checked={picked[mission.id] === option}
                    onChange={() =>
                      setPicked((current) => ({
                        ...current,
                        [mission.id]: option,
                      }))
                    }
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <label className="board-form-text">
              {draft.form.prompt}
              <input type="text" maxLength={60} placeholder="Type to try it" />
            </label>
          </fieldset>
        )}
      </div>
      <div className="board-decide">
        {!decidable && next && (
          <>
            <p>
              Research and perspectives inform the plan.{" "}
              <strong>They are never adopted as fact.</strong>
            </p>
            <button
              type="button"
              className="board-next"
              onClick={() => goTo(next.id)}
            >
              Next: {next.name} <ArrowRight size={16} aria-hidden="true" />
            </button>
          </>
        )}
        {decidable && !choice && (
          <>
            <p>
              <strong>
                {stepId === "plan"
                  ? "Does this plan fit your community?"
                  : "Ready for people to use?"}
              </strong>{" "}
              Your call.
            </p>
            <div className="board-choices">
              <button type="button" onClick={() => decide("added")}>
                <Check size={16} aria-hidden="true" />
                {stepId === "plan" ? "Adopt it" : "Publish it"}
              </button>
              <button type="button" onClick={() => decide("left")}>
                <Minus size={16} aria-hidden="true" />
                Leave it out
              </button>
            </div>
          </>
        )}
        {decidable && choice && (
          <div className="board-result" role="status">
            <span className={`board-stamp ${choice}`}>
              {choice === "added" ? <Check size={15} /> : <Minus size={15} />}
              {choice === "added"
                ? stepId === "plan"
                  ? "Adopted by you"
                  : "Published by you"
                : "Left out by you"}
            </span>
            <span>
              {choice === "added"
                ? stepId === "plan"
                  ? "These tasks join the mission."
                  : "People in the mission can answer it."
                : "Nothing was added."}
            </span>
            <button
              type="button"
              className="board-undo"
              onClick={() => decide(undefined)}
            >
              <Undo2 size={14} aria-hidden="true" /> Undo
            </button>
            {stepId === "plan" && next && (
              <button
                type="button"
                className="board-next"
                onClick={() => goTo(next.id)}
              >
                Next: {next.name} <ArrowRight size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
      {finished && (
        <div className="board-finished" role="status">
          <p>
            <strong>You decided every step that needed a decision.</strong>{" "}
            That’s how a mission works.
          </p>
          <Link href="/dashboard/missions">
            Start yours <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
}
