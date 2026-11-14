"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Clipboard,
  Clock,
  ExternalLink,
  FlaskConical,
  Hammer,
  Link2,
  Loader2,
  MapPin,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";
import {
  stages,
  type Mission,
  type MissionStage,
  type MissionRun,
} from "@/lib/missions/types";
import {
  createDemoMission,
  demoOutputs,
  demoSources,
} from "@/lib/missions/demo";
import { safeSourceUrl } from "@/lib/missions/validation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import MissionToolForm from "./MissionToolForm";
const icons = {
  research: Search,
  perspectives: Users,
  plan: Hammer,
  tool: Sparkles,
};
type Tab = "workbench" | "input" | "tasks" | "tools";
export default function MissionRoom({
  missionId,
  demo = false,
}: {
  missionId: string;
  demo?: boolean;
}) {
  const { user } = useWorkspace();
  const userId = demo ? "demo-you" : user?.id;
  const [mission, setMission] = useState<Mission | null>(
    demo ? createDemoMission : null,
  );
  const [tab, setTab] = useState<Tab>("workbench");
  const [stage, setStage] = useState<MissionStage>("research");
  const [selectedRun, setSelectedRun] = useState("");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [inputOpen, setInputOpen] = useState(false);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [form, setForm] = useState({
    kind: "perspective",
    title: "",
    content: "",
    url: "",
  });
  const [webSearch, setWebSearch] = useState(false);
  const [removeId, setRemoveId] = useState("");
  const alive = useRef(true);
  const refresh = useCallback(async () => {
    if (demo) return;
    const response = await fetch(`/api/missions/${missionId}`, {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Could not load this mission.");
    if (alive.current) setMission(data);
  }, [demo, missionId]);
  useEffect(() => {
    alive.current = true;
    refresh().catch((e) => setError(e.message));
    return () => {
      alive.current = false;
    };
  }, [refresh]);
  const activeRun = mission?.runs.some((run) => run.status === "running");
  useEffect(() => {
    if (demo || !activeRun) return;
    const timer = setInterval(() => refresh().catch(() => {}), 3500);
    return () => clearInterval(timer);
  }, [demo, activeRun, refresh]);
  const request = async (path: string, body?: unknown, method = "POST") => {
    const response = await fetch(`/api/missions/${missionId}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "That change could not be saved.");
    await refresh();
    return data;
  };
  const action = async (key: string, fn: () => Promise<void>) => {
    setPending(key);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      if (alive.current) setPending("");
    }
  };
  if (!mission)
    return (
      <div className="mission-loading">
        {error ? (
          <>
            <CircleHelp />
            <h1>{error}</h1>
            <button
              className="civic-button"
              onClick={() => {
                setError("");
                refresh().catch((e) => setError(e.message));
              }}
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <Loader2 className="animate-spin" />
            <p>Opening your mission…</p>
          </>
        )}
      </div>
    );
  const current = stages.find((item) => item.id === stage)!;
  const Icon = icons[stage];
  const stageRuns = mission.runs.filter((run) => run.stage === stage);
  const run = stageRuns.find((item) => item.id === selectedRun) || stageRuns[0];
  const output = run?.output;
  const stale = Boolean(run && run.inputRevision !== mission.revision);
  const published = mission.runs.filter(
    (item) => item.stage === "tool" && item.acceptedAt && item.output?.tool,
  );
  const doneCount = mission.tasks.filter(
    (task) => task.status === "done",
  ).length;
  const latest = (id: MissionStage) =>
    mission.runs.find((item) => item.stage === id);
  const changeStage = (id: MissionStage) => {
    setStage(id);
    setSelectedRun("");
    setTab("workbench");
  };
  const runAgent = () =>
    action("run", async () => {
      setSelectedRun("");
      if (demo) {
        const stamp = new Date().toISOString();
        setMission(
          (m) =>
            m && {
              ...m,
              runs: [
                {
                  id: `example-${Date.now()}`,
                  stage,
                  status: "completed",
                  inputRevision: m.revision,
                  sources: demoSources,
                  output: demoOutputs[stage],
                  error: null,
                  searchStatus: "not_requested",
                  acceptedAt: null,
                  createdAt: stamp,
                  completedAt: stamp,
                },
                ...m.runs,
              ],
            },
        );
        setNotice(
          "Loaded an illustrative output. Demo edits are not analyzed by AI.",
        );
      } else {
        await request("/runs", { stage, webSearch });
        setNotice(
          `${current.name} has finished. Review the output and its references.`,
        );
      }
    });
  const adopt = () =>
    action("accept", async () => {
      if (!run || stale) return;
      if (demo)
        setMission(
          (m) =>
            m && {
              ...m,
              runs: m.runs.map((r) =>
                r.id === run.id
                  ? { ...r, acceptedAt: new Date().toISOString() }
                  : r,
              ),
              tasks: [
                ...m.tasks,
                ...(run.output?.tasks || []).map((task, i) => ({
                  ...task,
                  id: `${run.id}-task-${i}`,
                  runId: run.id,
                  status: "open",
                  assignedToId: null,
                  assignee: null,
                })),
              ],
            },
        );
      else await request(`/runs/${run.id}/accept`);
      setAcceptOpen(false);
      setTab(stage === "tool" ? "tools" : "tasks");
      setNotice(
        stage === "tool"
          ? "Your shared tool is ready for responses."
          : "The plan is on your action board. People can now pick up tasks.",
      );
    });
  const addInput = () =>
    action("input", async () => {
      if (demo)
        setMission(
          (m) =>
            m && {
              ...m,
              revision: m.revision + 1,
              contributions: [
                ...m.contributions,
                {
                  ...form,
                  kind: form.kind as "perspective",
                  url: form.kind === "source" ? form.url || null : null,
                  id: `demo-input-${Date.now()}`,
                  authorId: "demo-you",
                  author: { name: "You" },
                  createdAt: new Date().toISOString(),
                },
              ],
            },
        );
      else await request("/contributions", form);
      setInputOpen(false);
      setForm({ kind: "perspective", title: "", content: "", url: "" });
      setNotice(
        "Your input is part of the mission. Earlier AI drafts are marked for a fresh review.",
      );
    });
  const taskAction = (taskId: string, next: string) =>
    action(taskId, async () => {
      if (demo)
        setMission(
          (m) =>
            m && {
              ...m,
              tasks: m.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      status:
                        next === "claim"
                          ? "claimed"
                          : next === "complete"
                            ? "done"
                            : "open",
                      assignedToId:
                        next === "claim" || next === "complete"
                          ? "demo-you"
                          : null,
                      assignee:
                        next === "claim" || next === "complete"
                          ? { name: "You" }
                          : null,
                    }
                  : task,
              ),
            },
        );
      else await request(`/tasks/${taskId}`, { action: next }, "PATCH");
    });
  return (
    <div className="mission-room">
      {demo && (
        <div className="mission-demo-banner">
          <FlaskConical size={17} />
          <span>
            <strong>Interactive example.</strong> People, sources, and AI
            outputs are illustrative. Changes stay in this page until you
            reload.
          </span>
          <Link href="/auth/signup">
            Start a real mission <ArrowUpRight size={15} />
          </Link>
        </div>
      )}
      <div className="mission-topline">
        <Link href={demo ? "/" : "/dashboard/missions"}>
          <ArrowLeft size={15} />
          {demo ? "Back to Cosmogov" : "All missions"}
        </Link>
        <button
          onClick={() =>
            action("copy", async () => {
              await navigator.clipboard.writeText(window.location.href);
              setNotice(
                "Link copied. Shared missions are accessible to current community members.",
              );
            })
          }
        >
          <Link2 size={14} />
          Copy link
        </button>
      </div>
      <header className="mission-header">
        <div>
          <div className="eyebrow">
            <span className="mission-orb" />
            {mission.organization?.name || "YOUR PRIVATE WORKSPACE"}
          </div>
          <h1>{mission.title}</h1>
          <p>{mission.goal}</p>
          <div className="mission-header-meta">
            <span>
              <Users size={14} />
              Started by {mission.creator.name || "a community member"}
            </span>
            {mission.location && (
              <span>
                <MapPin size={14} />
                {mission.location}
              </span>
            )}
          </div>
        </div>
        <div className="mission-header-art" aria-hidden="true">
          <span>you +</span>
          <Sparkles />
          <strong>what’s possible.</strong>
        </div>
      </header>
      {error && (
        <div className="mission-alert" role="alert">
          <CircleHelp size={18} />
          <span>{error}</span>
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {notice && (
        <div className="mission-notice" role="status">
          <Check size={16} />
          {notice}
        </div>
      )}
      <nav className="mission-tabs" aria-label="Mission sections">
        {(
          [
            {
              id: "workbench",
              label: "AI workbench",
              icon: Sparkles,
              count: null,
            },
            {
              id: "input",
              label: "Community input",
              icon: MessageCircle,
              count: mission.contributions.length,
            },
            {
              id: "tasks",
              label: "Action board",
              icon: CheckCheck,
              count: mission.tasks.length,
            },
            {
              id: "tools",
              label: "Shared tools",
              icon: Hammer,
              count: published.length,
            },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            aria-current={tab === item.id ? "page" : undefined}
            className={tab === item.id ? "active" : ""}
            onClick={() => setTab(item.id)}
          >
            <item.icon size={16} />
            {item.label}
            {item.count !== null && <span>{item.count}</span>}
          </button>
        ))}
      </nav>
      {tab === "workbench" && (
        <div className="mission-workbench">
          <aside className="mission-team">
            <div className="eyebrow">YOUR AI TEAM</div>
            <p>Four jobs. One shared goal.</p>
            {stages.map((item, i) => {
              const AgentIcon = icons[item.id];
              const recent = latest(item.id);
              return (
                <button
                  key={item.id}
                  className={`mission-agent ${item.color} ${stage === item.id ? "selected" : ""}`}
                  aria-pressed={stage === item.id}
                  onClick={() => changeStage(item.id)}
                >
                  <span className="mission-agent-icon">
                    <AgentIcon size={20} />
                  </span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.role}</small>
                  </span>
                  <span className="mission-agent-number">
                    {recent?.status === "completed" ? (
                      <Check size={14} />
                    ) : (
                      `0${i + 1}`
                    )}
                  </span>
                </button>
              );
            })}
            <div className="mission-team-note">
              <ShieldCheck size={18} />
              <p>
                Your community directs the work. AI drafts need review before
                becoming tasks or shared tools.
              </p>
            </div>
            <button
              className="mission-add-context"
              onClick={() => setInputOpen(true)}
            >
              <Plus size={15} />
              Add something the team should know
            </button>
          </aside>
          <section className="mission-output-area">
            <div className="mission-output-heading">
              <div>
                <span className={`mission-agent-icon ${current.color}`}>
                  <Icon size={22} />
                </span>
                <div>
                  <div className="eyebrow">
                    {current.name.toUpperCase()} · {current.role.toUpperCase()}
                  </div>
                  <h2>
                    {stage === "research"
                      ? "A clearer place to start."
                      : stage === "perspectives"
                        ? "Make room for every perspective."
                        : stage === "plan"
                          ? "Let’s turn this into something."
                          : "Your idea, made useful."}
                  </h2>
                </div>
              </div>
              <button
                className="civic-button"
                disabled={Boolean(pending) || activeRun || !mission.canManage}
                onClick={runAgent}
              >
                {pending === "run" || activeRun ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Working…
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    {demo
                      ? "Load example"
                      : run
                        ? `Run ${current.name} again`
                        : `Ask ${current.name}`}
                  </>
                )}
              </button>
            </div>
            <p className="mission-stage-description">{current.description}</p>
            {!mission.canManage && (
              <p className="mission-small">
                The mission creator and community moderators can run AI steps.
                Everyone in the mission can contribute input and take on tasks.
              </p>
            )}
            {stage === "research" && mission.canManage && !demo && (
              <label className="mission-search-option">
                <input
                  type="checkbox"
                  checked={webSearch}
                  disabled={!mission.searchAvailable || Boolean(pending)}
                  onChange={(e) => setWebSearch(e.target.checked)}
                />
                <span>
                  Include web search{" "}
                  <small>
                    {mission.searchAvailable
                      ? "The mission title and location are sent to the search provider."
                      : "Unavailable here. Scout can use the sources you add."}
                  </small>
                </span>
              </label>
            )}
            {stageRuns.length > 1 && (
              <label className="mission-history">
                Output history
                <select
                  aria-label="Output history"
                  value={run?.id || ""}
                  onChange={(e) => setSelectedRun(e.target.value)}
                >
                  {stageRuns.map((item, i) => (
                    <option key={item.id} value={item.id}>
                      {i === 0 ? "Latest · " : ""}
                      {new Date(item.createdAt).toLocaleString()} ·{" "}
                      {item.status}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {stale && (
              <div className="mission-stale">
                <RefreshCw size={16} />
                <span>
                  Community input has changed since this draft. Run this step
                  again before adopting it.
                </span>
              </div>
            )}
            {run?.status === "failed" && (
              <div className="mission-alert" role="alert">
                <CircleHelp size={17} />
                {run.error ||
                  "This step could not finish. Your input is saved."}
              </div>
            )}
            {run?.status === "running" && (
              <div className="mission-working" role="status">
                <Loader2 className="animate-spin" />
                <h3>{current.name} is working with your mission context.</h3>
                <p>The result will appear here. You can leave and come back.</p>
              </div>
            )}
            {output && run?.status === "completed" ? (
              <article className="mission-output">
                <div className="mission-output-label">
                  <span>
                    <Sparkles size={13} />
                    {demo
                      ? "ILLUSTRATIVE AI DRAFT"
                      : "AI DRAFT · REVIEW WITH YOUR COMMUNITY"}
                  </span>
                  {run.acceptedAt && (
                    <span className="mission-adopted">
                      <Check size={13} />
                      Adopted
                    </span>
                  )}
                </div>
                <h2>{output.headline}</h2>
                <p className="mission-output-summary">{output.summary}</p>
                {run.searchStatus === "unavailable" && (
                  <p className="mission-small">
                    Web search was unavailable. This output uses only the
                    supplied mission context.
                  </p>
                )}
                {run.searchStatus === "empty" && (
                  <p className="mission-small">
                    Web search returned no usable sources. Check the questions
                    below.
                  </p>
                )}
                {output.findings.length > 0 && (
                  <div className="mission-findings">
                    <h3>
                      {stage === "perspectives"
                        ? "What people have contributed"
                        : "What the context supports"}
                    </h3>
                    {output.findings.map((finding, i) => (
                      <div key={i}>
                        <span className="mission-finding-number">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p>
                          {finding.text}
                          <span className="mission-citations">
                            {finding.sourceIds.map((id) => {
                              const index = run.sources.findIndex(
                                (source) => source.id === id,
                              );
                              return (
                                <a
                                  key={id}
                                  href={`#source-${run.id}-${index}`}
                                  onClick={() => {
                                    const details = document
                                      .getElementById(
                                        `source-${run.id}-${index}`,
                                      )
                                      ?.closest("details");
                                    if (details) details.open = true;
                                  }}
                                  aria-label={`Read reference ${index + 1}`}
                                >
                                  [{index + 1}]
                                </a>
                              );
                            })}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {output.questions.length > 0 && (
                  <div className="mission-questions">
                    <h3>
                      <CircleHelp size={17} />
                      Still worth asking
                    </h3>
                    <ul>
                      {output.questions.map((question) => (
                        <li key={question}>{question}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {output.tasks.length > 0 && (
                  <div className="mission-plan-preview">
                    <h3>A draft action plan</h3>
                    {output.tasks.map((task, i) => (
                      <div key={i}>
                        <span>{i + 1}</span>
                        <div>
                          <h4>{task.title}</h4>
                          <p>{task.detail}</p>
                          <small>
                            <Clock size={12} />
                            About {task.minutes} min · AI estimate
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {output.tool && <MissionToolForm tool={output.tool} preview />}
                {(stage === "plan" || stage === "tool") && !run.acceptedAt && (
                  <div className="mission-adopt">
                    <div>
                      <strong>
                        {stage === "tool"
                          ? "Ready for people to use?"
                          : "Does this plan fit your community?"}
                      </strong>
                      <p>
                        {stage === "tool"
                          ? "Publishing makes this form available to people with access to the mission."
                          : "Adopting adds these tasks to the action board. It does not approve spending or assign anyone."}
                      </p>
                    </div>
                    <button
                      className="civic-button"
                      disabled={!mission.canManage || stale || Boolean(pending)}
                      onClick={() => setAcceptOpen(true)}
                    >
                      {stage === "tool"
                        ? "Publish this tool"
                        : "Adopt this plan"}
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                )}
                {run.sources.length > 0 && (
                  <details className="mission-sources">
                    <summary>
                      <BookOpen size={16} />
                      References behind this draft{" "}
                      <span>{run.sources.length}</span>
                    </summary>
                    <p className="mission-small">
                      References identify the supplied context. Their accuracy
                      and interpretation still need review. Web results are
                      search excerpts.
                    </p>
                    {run.sources.map((source, i) => (
                      <div
                        id={`source-${run.id}-${i}`}
                        key={source.id}
                        tabIndex={-1}
                      >
                        <span className="mission-source-index">[{i + 1}]</span>
                        <div>
                          <strong>{source.title}</strong>
                          <small>
                            {source.kind === "web"
                              ? "Web search excerpt"
                              : `${source.kind} · ${source.author || "Community input"}`}
                          </small>
                          <p>{source.text}</p>
                          {source.url && safeSourceUrl(source.url) && (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open source
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </details>
                )}
              </article>
            ) : (
              !activeRun &&
              run?.status !== "failed" && (
                <div className="mission-empty-output">
                  <span>
                    <Icon size={32} />
                  </span>
                  <h3>
                    {stage === "tool"
                      ? "What could your community use?"
                      : "Let’s give this idea some substance."}
                  </h3>
                  <p>
                    {stage === "tool"
                      ? "Studio can draft a practical form from your mission: volunteer offers, equipment pledges, or questions for your community."
                      : "Add what people know, need, and disagree about. Your AI team will work from that shared context."}
                  </p>
                  <button
                    className="civic-button outline"
                    onClick={() => setInputOpen(true)}
                  >
                    Add community input
                    <Plus size={15} />
                  </button>
                </div>
              )
            )}
            <div className="mission-next-steps">
              <span>Make it a conversation.</span>
              <button onClick={() => setTab("input")}>
                Add your perspective <ArrowRight size={14} />
              </button>
              {stage !== "tool" && (
                <button
                  onClick={() =>
                    changeStage(
                      stages[stages.findIndex((item) => item.id === stage) + 1]
                        .id,
                    )
                  }
                >
                  Next:{" "}
                  {
                    stages[stages.findIndex((item) => item.id === stage) + 1]
                      .name
                  }
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </section>
        </div>
      )}
      {tab === "input" && (
        <section className="mission-panel">
          <div className="mission-panel-heading">
            <div>
              <div className="eyebrow">THE COMMUNITY IS THE CONTEXT</div>
              <h2>What should the team know?</h2>
              <p>
                Bring a perspective, a practical limit, or a source. AI drafts
                use this shared input.
              </p>
            </div>
            <button
              className="civic-button"
              onClick={() => setInputOpen(true)}
              disabled={mission.contributions.length >= 40}
            >
              <Plus size={16} />
              Add your input
            </button>
          </div>
          <div className="mission-input-grid">
            {mission.contributions.map((item) => (
              <article
                className={`mission-input-card ${item.kind}`}
                key={item.id}
              >
                <div className="mission-input-kind">
                  <span>
                    {item.kind === "source" ? (
                      <BookOpen size={14} />
                    ) : item.kind === "constraint" ? (
                      <ShieldCheck size={14} />
                    ) : (
                      <MessageCircle size={14} />
                    )}
                    {item.kind}
                  </span>
                  {(mission.canManage || item.authorId === userId) && (
                    <button
                      aria-label={`Remove ${item.title}`}
                      onClick={() => setRemoveId(item.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <h3>{item.title}</h3>
                <p>{item.content}</p>
                {item.url && safeSourceUrl(item.url) && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    Read source <ExternalLink size={13} />
                  </a>
                )}
                <footer>
                  <span>{(item.author.name || "?")[0]}</span>
                  {item.author.name || "Community member"}
                </footer>
              </article>
            ))}
            {!mission.contributions.length && (
              <div className="mission-empty-output">
                <MessageCircle />
                <h3>The first perspective could be yours.</h3>
                <p>
                  A constraint, a question, or something you know locally is a
                  useful place to start.
                </p>
              </div>
            )}
          </div>
        </section>
      )}
      {tab === "tasks" && (
        <section className="mission-panel">
          <div className="mission-panel-heading">
            <div>
              <div className="eyebrow">SMALL CONTRIBUTIONS. REAL PROGRESS.</div>
              <h2>Pick up a piece of the mission.</h2>
              <p>
                {mission.tasks.length
                  ? `${doneCount} of ${mission.tasks.length} tasks marked done by members. Estimates are suggestions.`
                  : "Reviewed plans become tasks people can choose to take on."}
              </p>
            </div>
            <button
              className="civic-button outline"
              onClick={() => changeStage("plan")}
            >
              Work with Maker <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="mission-task-columns">
            {(["open", "claimed", "done"] as const).map((status) => (
              <div key={status} className={`mission-task-column ${status}`}>
                <h3>
                  <span />
                  {status === "open"
                    ? "Up for grabs"
                    : status === "claimed"
                      ? "In good hands"
                      : "Done"}
                  <small>
                    {mission.tasks.filter((t) => t.status === status).length}
                  </small>
                </h3>
                {mission.tasks
                  .filter((t) => t.status === status)
                  .map((task) => (
                    <article key={task.id}>
                      <span className="mission-effort">
                        <Clock size={12} />~{task.minutes} min
                      </span>
                      <h4>{task.title}</h4>
                      <p>{task.detail}</p>
                      {task.assignee && (
                        <div className="mission-task-person">
                          <span>{(task.assignee.name || "?")[0]}</span>
                          {task.assignee.name || "Community member"}
                        </div>
                      )}
                      <div className="mission-task-actions">
                        {status === "open" ? (
                          <button
                            disabled={Boolean(pending)}
                            onClick={() => taskAction(task.id, "claim")}
                          >
                            I can do this <ArrowUpRight size={14} />
                          </button>
                        ) : (
                          (task.assignedToId === userId ||
                            mission.canManage) && (
                            <>
                              {status === "claimed" ? (
                                <>
                                  <button
                                    disabled={Boolean(pending)}
                                    onClick={() =>
                                      taskAction(task.id, "complete")
                                    }
                                  >
                                    <Check size={14} />
                                    Mark done
                                  </button>
                                  <button
                                    disabled={Boolean(pending)}
                                    onClick={() =>
                                      taskAction(task.id, "release")
                                    }
                                  >
                                    Release
                                  </button>
                                </>
                              ) : (
                                <button
                                  disabled={Boolean(pending)}
                                  onClick={() => taskAction(task.id, "reopen")}
                                >
                                  Reopen task
                                </button>
                              )}
                            </>
                          )
                        )}
                      </div>
                    </article>
                  ))}
                {!mission.tasks.some((t) => t.status === status) && (
                  <p className="mission-column-empty">
                    {status === "open"
                      ? "Adopt a plan to put useful work here."
                      : status === "claimed"
                        ? "A little help goes a long way."
                        : "Every finished task will appear here."}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      {tab === "tools" && (
        <section className="mission-panel">
          <div className="mission-panel-heading">
            <div>
              <div className="eyebrow">YOUR COMMUNITY CAN BUILD THINGS</div>
              <h2>Little tools. Shared possibilities.</h2>
              <p>
                Forms designed around this mission, reviewed by people, and
                ready to use.
              </p>
            </div>
            <button
              className="civic-button outline"
              onClick={() => changeStage("tool")}
            >
              Build with Studio <Sparkles size={16} />
            </button>
          </div>
          {published.length ? (
            published.map((toolRun) => {
              const tool = toolRun.output!.tool!;
              const responses = mission.toolResponses.filter(
                (response) => response.runId === toolRun.id,
              );
              const mine = responses.find(
                (response) => response.authorId === userId,
              );
              return (
                <div className="mission-published-tool" key={toolRun.id}>
                  <div>
                    <MissionToolForm
                      key={toolRun.id}
                      tool={tool}
                      initialValues={mine?.values}
                      busy={Boolean(pending)}
                      onSubmit={async (values) => {
                        setPending("response");
                        setError("");
                        try {
                          if (demo)
                            setMission(
                              (m) =>
                                m && {
                                  ...m,
                                  toolResponses: [
                                    ...m.toolResponses.filter(
                                      (r) =>
                                        !(
                                          r.runId === toolRun.id &&
                                          r.authorId === "demo-you"
                                        ),
                                    ),
                                    {
                                      id: `demo-response-${toolRun.id}`,
                                      runId: toolRun.id,
                                      authorId: "demo-you",
                                      author: { name: "You" },
                                      values,
                                      updatedAt: new Date().toISOString(),
                                    },
                                  ],
                                },
                            );
                          else
                            await request(`/tools/${toolRun.id}/responses`, {
                              values,
                            });
                        } catch (e) {
                          setError(
                            e instanceof Error
                              ? e.message
                              : "Response could not be saved.",
                          );
                          throw e;
                        } finally {
                          setPending("");
                        }
                      }}
                    />
                    {mine && (
                      <button
                        className="mission-delete-response"
                        disabled={Boolean(pending)}
                        onClick={() =>
                          action("response", async () => {
                            if (demo)
                              setMission(
                                (m) =>
                                  m && {
                                    ...m,
                                    toolResponses: m.toolResponses.filter(
                                      (r) => r.id !== mine.id,
                                    ),
                                  },
                              );
                            else
                              await request(
                                `/tools/${toolRun.id}/responses`,
                                undefined,
                                "DELETE",
                              );
                            setNotice("Your response was removed.");
                          })
                        }
                      >
                        Remove my response
                      </button>
                    )}
                  </div>
                  <aside>
                    <h3>
                      What people are bringing <span>{responses.length}</span>
                    </h3>
                    {toolRun.inputRevision !== mission.revision && (
                      <p className="mission-small">
                        This form was published before the latest input changes.
                      </p>
                    )}
                    {responses.map((response) => (
                      <article className="mission-response" key={response.id}>
                        <strong>
                          {response.author.name || "Community member"}
                        </strong>
                        {tool.fields
                          .filter((field) => response.values[field.id])
                          .map((field) => (
                            <p key={field.id}>
                              <small>{field.label}</small>
                              {response.values[field.id]}
                            </p>
                          ))}
                      </article>
                    ))}
                    {!responses.length && (
                      <p className="mission-small">
                        The first response could open a new possibility.
                      </p>
                    )}
                  </aside>
                </div>
              );
            })
          ) : (
            <div className="mission-empty-output">
              <Hammer size={32} />
              <h3>Give your mission something people can use.</h3>
              <p>
                Ask Studio to draft a volunteer form, equipment pledge, or
                practical needs survey. Review it before publishing.
              </p>
              <button
                className="civic-button"
                onClick={() => changeStage("tool")}
              >
                Meet Studio <ArrowRight size={15} />
              </button>
            </div>
          )}
        </section>
      )}
      <Dialog
        open={inputOpen}
        onOpenChange={(value) => {
          if (!pending) setInputOpen(value);
        }}
      >
        <DialogContent className="mission-dialog">
          <DialogTitle>Add to the shared context</DialogTitle>
          <DialogDescription>
            Visible to people with access to this mission. Input is sent to the
            AI provider when a mission manager runs a step.
          </DialogDescription>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addInput();
            }}
          >
            <label className="mission-field">
              <span>What are you adding?</span>
              <select
                value={form.kind}
                onChange={(e) =>
                  setForm((f) => ({ ...f, kind: e.target.value }))
                }
              >
                <option value="perspective">My perspective</option>
                <option value="constraint">A practical constraint</option>
                <option value="source">A source or document excerpt</option>
              </select>
            </label>
            <label className="mission-field">
              <span>A short title</span>
              <input
                maxLength={160}
                required
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="What should people know?"
              />
            </label>
            <label className="mission-field">
              <span>
                {form.kind === "source"
                  ? "Relevant excerpt or source notes"
                  : "Tell us a little more"}
              </span>
              <textarea
                rows={4}
                maxLength={2000}
                required
                value={form.content}
                onChange={(e) =>
                  setForm((f) => ({ ...f, content: e.target.value }))
                }
                placeholder="Bring the detail only you can bring."
              />
            </label>
            {form.kind === "source" && (
              <label className="mission-field">
                <span>Source link (optional)</span>
                <input
                  type="url"
                  maxLength={2000}
                  value={form.url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, url: e.target.value }))
                  }
                  placeholder="https://…"
                />
                <small>
                  The AI reads your excerpt; the link is kept for people to
                  check.
                </small>
              </label>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="civic-button"
              disabled={Boolean(pending) || mission.contributions.length >= 40}
            >
              {pending === "input" ? "Adding…" : "Add to the mission"}
              <Plus size={16} />
            </button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={acceptOpen}
        onOpenChange={(value) => {
          if (!pending) setAcceptOpen(value);
        }}
      >
        <DialogContent className="mission-dialog">
          <DialogTitle>
            {stage === "tool"
              ? "Publish this participation tool?"
              : "Adopt these tasks?"}
          </DialogTitle>
          <DialogDescription>
            {stage === "tool"
              ? "People with access to this mission will be able to respond. Their names and responses will be visible within the mission."
              : `This adds ${output?.tasks.length || 0} tasks to your shared board. People choose what to take on. Spending and official decisions still follow your community’s process.`}
          </DialogDescription>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="civic-button"
            onClick={adopt}
            disabled={Boolean(pending) || stale}
          >
            {pending === "accept"
              ? "Saving…"
              : stage === "tool"
                ? "Publish for this mission"
                : "Add tasks to the board"}
            <Check size={16} />
          </button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(removeId)}
        onOpenChange={(value) => {
          if (!value) setRemoveId("");
        }}
      >
        <DialogContent className="mission-dialog">
          <DialogTitle>Remove this contribution?</DialogTitle>
          <DialogDescription>
            It will no longer be included in new AI runs. Existing outputs keep
            their reference snapshots, so their reasoning can still be reviewed.
          </DialogDescription>
          <button
            className="civic-button"
            disabled={Boolean(pending)}
            onClick={() =>
              action("remove", async () => {
                if (demo)
                  setMission(
                    (m) =>
                      m && {
                        ...m,
                        revision: m.revision + 1,
                        contributions: m.contributions.filter(
                          (c) => c.id !== removeId,
                        ),
                      },
                  );
                else
                  await request(
                    `/contributions/${removeId}`,
                    undefined,
                    "DELETE",
                  );
                setRemoveId("");
              })
            }
          >
            Remove contribution
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
