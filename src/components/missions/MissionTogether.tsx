import { ArrowUpRight, BookOpen, Check, HeartHandshake } from "lucide-react";
import type { Mission } from "@/lib/missions/types";

export default function MissionTogether({
  mission,
  onNavigate,
}: {
  mission: Mission;
  onNavigate: (tab: "input" | "tasks") => void;
}) {
  const people = new Map<string, string>();
  for (const input of mission.contributions)
    people.set(input.authorId, input.author.name || "Community member");
  for (const task of mission.tasks)
    if (task.assignedToId && task.assignee)
      people.set(task.assignedToId, task.assignee.name || "Community member");
  for (const response of mission.toolResponses)
    people.set(response.authorId, response.author.name || "Community member");
  const claimed = mission.tasks.filter((task) => task.status === "claimed");
  const done = mission.tasks.filter((task) => task.status === "done");
  const recentInput = mission.contributions.at(-1);
  const names = [...people.entries()];
  return (
    <section
      className="mission-together"
      aria-label="People moving this mission forward"
    >
      <div className="mission-together-heading">
        <div>
          <span className="eyebrow">A LITTLE FROM EACH OF US</span>
          <h2>This is how an idea grows.</h2>
        </div>
        <div className="mission-contributors">
          {names.length > 0 && (
            <span className="mission-avatar-stack" aria-hidden="true">
              {names.slice(0, 4).map(([id, name]) => (
                <span key={id}>{name[0].toUpperCase()}</span>
              ))}
            </span>
          )}
          <span>
            {names.length
              ? `${names.length} ${names.length === 1 ? "person contributing" : "people contributing"} here`
              : "Your first contribution starts it."}
          </span>
        </div>
      </div>
      <div className="mission-together-cards">
        <button
          className="mission-together-card knowledge"
          onClick={() => onNavigate("input")}
        >
          <span className="mission-together-icon">
            <BookOpen size={19} />
          </span>
          <span>
            <strong>
              {mission.contributions.length
                ? `${mission.contributions.length} ${mission.contributions.length === 1 ? "piece" : "pieces"} of local knowledge`
                : "Bring what you know"}
            </strong>
            <small>
              {recentInput
                ? `${recentInput.author.name || "A neighbor"} shared “${recentInput.title}”`
                : "A perspective, a source, a useful question."}
            </small>
          </span>
          <ArrowUpRight size={17} />
        </button>
        <button
          className="mission-together-card helping"
          onClick={() => onNavigate("tasks")}
        >
          <span className="mission-together-icon">
            <HeartHandshake size={20} />
          </span>
          <span>
            <strong>
              {claimed.length
                ? `${claimed.length} ${claimed.length === 1 ? "task in good hands" : "tasks in good hands"}`
                : "Find your little part"}
            </strong>
            <small>
              {claimed.length
                ? `${claimed[0].assignee?.name || "A community member"} is taking on “${claimed[0].title}”`
                : "Choose a task that fits your time and skills."}
            </small>
          </span>
          <ArrowUpRight size={17} />
        </button>
        <button
          className="mission-together-card wins"
          onClick={() => onNavigate("tasks")}
        >
          <span className="mission-together-icon">
            <Check size={20} />
          </span>
          <span>
            <strong>
              {done.length
                ? `${done.length} ${done.length === 1 ? "small win" : "small wins"}, together`
                : "Make progress visible"}
            </strong>
            <small>
              {done.length
                ? `Members marked ${done.length} of ${mission.tasks.length} tasks done.`
                : "Completed tasks will have a home here."}
            </small>
          </span>
          <ArrowUpRight size={17} />
        </button>
      </div>
    </section>
  );
}
