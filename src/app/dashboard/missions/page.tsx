"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  CheckCheck,
  FlaskConical,
  Loader2,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import TemplateGallery from "@/components/missions/TemplateGallery";
import type { MissionSummary } from "@/lib/missions/types";
import {
  defaultGroupKind,
  groupKinds,
  isGroupKind,
  startersByKind,
  type GroupKind,
} from "@/lib/missions/starters";
const starterLooks = [
  { icon: Users, color: "peach" },
  { icon: MapPin, color: "mint" },
  { icon: WandSparkles, color: "lilac" },
];
const KIND_KEY = "cosmogov:group-kind";
export default function MissionStudioPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<MissionSummary[]>([]);
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<GroupKind>(defaultGroupKind);
  // Remembering the kind of group is a convenience for this browser only.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(KIND_KEY);
      if (isGroupKind(stored)) setKind(stored);
    } catch {}
  }, []);
  const chooseKind = (value: GroupKind) => {
    setKind(value);
    try {
      localStorage.setItem(KIND_KEY, value);
    } catch {}
  };
  const [form, setForm] = useState({
    title: "",
    goal: "",
    location: "",
    organizationId: "",
  });
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [missionResponse, orgResponse] = await Promise.all([
        fetch("/api/missions"),
        fetch("/api/organizations"),
      ]);
      if (!missionResponse.ok || !orgResponse.ok)
        throw new Error(
          "We couldn’t load your mission workspace. Please try again.",
        );
      setMissions(await missionResponse.json());
      setOrgs(await orgResponse.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const start = (title = "", goal = "") => {
    setTemplateId(null);
    setForm({ title, goal, location: "", organizationId: "" });
    setFormError("");
    setOpen(true);
  };
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const response = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          templateId,
          organizationId: form.organizationId || null,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not start this mission.");
      router.push(`/dashboard/missions/${data.id}`);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const visible = missions.filter((m) =>
    `${m.title} ${m.goal}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="mission-studio">
      <header className="mission-studio-hero">
        <div>
          <div className="eyebrow">
            <Sparkles size={14} />
            PEOPLE WITH IDEAS. AI THAT GETS TO WORK.
          </div>
          <h1>
            What could we
            <br />
            make possible?
          </h1>
          <p>
            Bring a goal and your people. Your AI team helps research it, make
            sense of the input, draft a plan, and build tools you can use
            together.
          </p>
          <div className="mission-studio-actions">
            <button className="civic-button" onClick={() => start()}>
              <Plus size={17} />
              Start a mission
            </button>
            <Link href="/missions/demo">
              Explore an example
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <div className="mission-studio-orbit" aria-hidden="true">
          <span className="studio-node node-scout">
            <Search />
            Find out
          </span>
          <span className="studio-node node-bridge">
            <Users />
            Make sense
          </span>
          <span className="studio-node node-maker">
            <CheckCheck />
            Make a plan
          </span>
          <span className="studio-node node-tool">
            <WandSparkles />
            Build it
          </span>
          <div className="studio-center">
            us<span>+ a little AI magic</span>
          </div>
          <i>✳</i>
        </div>
      </header>
      <section className="mission-starters">
        <div className="mission-section-label" id="group-kind-label">
          WHO ARE YOU DOING THIS WITH?
        </div>
        <div
          className="group-kinds"
          role="radiogroup"
          aria-labelledby="group-kind-label"
        >
          {groupKinds.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={kind === item.id}
              className={kind === item.id ? "selected" : ""}
              onClick={() => chooseKind(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="group-kind-blurb">
          {groupKinds.find((item) => item.id === kind)?.blurb} Pick a starting
          point, then make it yours.
        </p>
        <div>
          {startersByKind[kind].map((item, index) => {
            const look = starterLooks[index % starterLooks.length];
            return (
              <button
                className={look.color}
                key={item.title}
                onClick={() => start(item.title, item.goal)}
              >
                <look.icon size={21} />
                <span>{item.title}</span>
                <ArrowUpRight size={17} />
              </button>
            );
          })}
        </div>
      </section>
      <TemplateGallery
        onChoose={(template) => {
          start(template.name, template.goal);
          setTemplateId(template.id);
          setForm({
            title: template.name,
            goal: template.goal,
            location: "",
            organizationId: template.organizationId || "",
          });
        }}
      />
      <section className="mission-list">
        <div className="mission-panel-heading">
          <div>
            <h2>Your missions</h2>
            <p>
              Shared goals, useful work, and a place for everyone’s
              contribution.
            </p>
          </div>
          <label className="mission-list-search">
            <Search size={16} />
            <input
              aria-label="Search missions"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a mission…"
            />
          </label>
        </div>
        {error ? (
          <div className="mission-alert" role="alert">
            <span>{error}</span>
            <button onClick={load}>Try again</button>
          </div>
        ) : loading ? (
          <div className="mission-loading">
            <Loader2 className="animate-spin" />
            Loading your missions…
          </div>
        ) : visible.length ? (
          <div className="mission-list-grid">
            {visible.map((mission, i) => (
              <Link
                className={`mission-list-card tone-${i % 3}`}
                key={mission.id}
                href={`/dashboard/missions/${mission.id}`}
              >
                <div>
                  <span>
                    <Sparkles size={13} />
                    {mission.organization?.name || "Private mission"}
                  </span>
                  <ArrowUpRight size={18} />
                </div>
                <h3>{mission.title}</h3>
                <p>{mission.goal}</p>
                <footer>
                  <span>
                    <MessageCount />
                    {mission._count.contributions} inputs
                  </span>
                  <span>
                    <CheckCheck size={13} />
                    {mission._count.tasks} tasks
                  </span>
                </footer>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mission-studio-empty">
            <span>
              <Sparkles size={28} />
            </span>
            <div>
              <h3>
                {query
                  ? "No missions match that search."
                  : "Every mission starts with a “what if”."}
              </h3>
              <p>
                {query
                  ? "Try a different word or clear your search."
                  : "Start with a goal that matters to your community. You can begin privately and create shared missions in communities you belong to."}
              </p>
            </div>
            <button
              className="civic-button outline"
              onClick={() => (query ? setQuery("") : start())}
            >
              {query ? "Clear search" : "Start something"}
              <ArrowUpRight size={16} />
            </button>
          </div>
        )}
        <p className="mission-small mission-list-note">
          Showing up to 50 recent missions you can access.
        </p>
      </section>
      <div className="mission-studio-footnote">
        <BookOpen size={19} />
        <div>
          <strong>Context you can trace. Work you can review.</strong>
          <p>
            AI outputs show their references and open questions. Your community
            decides which plans and tools to adopt.
          </p>
        </div>
        <Link href="/missions/demo">
          <FlaskConical size={16} />
          Try the example
        </Link>
      </div>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!saving) setOpen(value);
        }}
      >
        <DialogContent className="mission-dialog">
          <DialogTitle>Start with something worth doing.</DialogTitle>
          <DialogDescription>
            A clear goal helps people and AI work together. You can add context
            and sources once the workspace is open.
          </DialogDescription>
          <form onSubmit={create}>
            <label className="mission-field">
              <span>Give your mission a name</span>
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                required
                maxLength={120}
                placeholder="Let’s bring a repair café to our neighborhood"
              />
            </label>
            <label className="mission-field">
              <span>What do you want to make possible?</span>
              <textarea
                rows={4}
                value={form.goal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, goal: e.target.value }))
                }
                required
                maxLength={2000}
                placeholder="Describe the goal, the people it could help, and what a useful first step might look like."
              />
            </label>
            <label className="mission-field">
              <span>Where? (optional)</span>
              <input
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                maxLength={150}
                placeholder="Neighborhood, town, or online community"
              />
            </label>
            <label className="mission-field">
              <span>Who can access this mission?</span>
              <select
                value={form.organizationId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, organizationId: e.target.value }))
                }
              >
                <option value="">Just me · private workspace</option>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} · all current members
                  </option>
                ))}
              </select>
              <small>
                {form.organizationId
                  ? "All current community members can read input, contribute, respond to tools, and take on tasks."
                  : "Only you can access this mission. Choose a community above to work together."}
              </small>
            </label>
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <button className="civic-button" disabled={saving}>
              {saving ? "Starting…" : "Open our workspace"}
              <ArrowUpRight size={16} />
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function MessageCount() {
  return <Users size={13} />;
}
