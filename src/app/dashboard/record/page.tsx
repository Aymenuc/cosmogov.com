"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Printer, ArrowUpRight } from "lucide-react";
import StickerBadge from "@/components/stickers/StickerBadge";
import HomeArt from "@/components/stickers/HomeArt";
import { useStickers } from "@/components/stickers/StickerBook";
import { homeFor } from "@/lib/stickers";

type CivicRecord = {
  person: { name: string | null; memberSince: string | null; place: string | null };
  tasks: { id: string; title: string; mission: string; community: string | null; minutes: number; finishedAt: string }[];
  estimatedMinutes: number;
  missions: { id: string; title: string; community: string | null; startedAt: string }[];
  communitiesStarted: { id: string; name: string; startedAt: string }[];
  proposals: { id: string; title: string; openedAt: string }[];
  counts: {
    communitiesJoined: number;
    sourcesAdded: number;
    viewsAdded: number;
    formsAnswered: number;
    draftsDecided: number;
    commentsWritten: number;
  };
  generatedAt: string;
};

const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { year: "numeric", month: "long", day: "numeric" });

function hours(minutes: number): string {
  if (minutes <= 0) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = minutes / 60;
  return `${h % 1 === 0 ? h : h.toFixed(1)} h`;
}

export default function CivicRecordPage() {
  const [record, setRecord] = useState<CivicRecord | null>(null);
  const [failed, setFailed] = useState(false);
  const { stickers } = useStickers();
  const earned = stickers.filter((s) => s.earned);
  const home = homeFor(earned.length);

  useEffect(() => {
    fetch("/api/record", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setRecord)
      .catch(() => setFailed(true));
  }, []);

  if (failed)
    return (
      <div className="empty-state" role="alert">
        <p>Your civic record couldn’t be loaded. Please try again.</p>
      </div>
    );
  if (!record) return <p className="record-loading">Gathering your record…</p>;

  const r = record;
  const tiles: [string, string | number][] = [
    ["Tasks finished", r.tasks.length],
    ["Estimated time given", hours(r.estimatedMinutes)],
    ["Missions started", r.missions.length],
    ["Communities started", r.communitiesStarted.length],
    ["Communities joined", r.counts.communitiesJoined],
    ["Proposals opened", r.proposals.length],
    ["Sources shared", r.counts.sourcesAdded],
    ["Points of view added", r.counts.viewsAdded],
    ["Forms answered", r.counts.formsAnswered],
    ["Comments written", r.counts.commentsWritten],
  ];
  const nothingYet = r.tasks.length + r.missions.length + r.proposals.length + r.communitiesStarted.length === 0;

  return (
    <article className="civic-record">
      <div className="record-actions">
        <Link href="/dashboard/stickers" className="text-link">
          ← Sticker book
        </Link>
        <button className="civic-button" onClick={() => window.print()}>
          <Printer size={16} /> Print or save as PDF
        </button>
      </div>

      <header className="record-header">
        <div>
          <p className="record-eyebrow">
            <img src="/icon-192.png" alt="" width={28} height={28} /> Cosmogov civic record
          </p>
          <h1>{r.person.name || "Your contributions"}</h1>
          <p className="record-meta">
            {r.person.memberSince && `Member since ${day(r.person.memberSince)}`}
            {r.person.place && ` · ${r.person.place}`}
          </p>
        </div>
        <div className="record-home">
          <HomeArt id={home.current.id} size={96} />
          <span>{home.current.name}</span>
        </div>
      </header>

      {nothingYet && (
        <div className="record-empty">
          <p>
            <strong>Your record starts with your first contribution.</strong> Pick up a task, start a mission
            or open a proposal, and it appears here with the date and the time it took.
          </p>
          <Link className="civic-button" href="/dashboard/missions">
            Find something to help with <ArrowUpRight size={16} />
          </Link>
        </div>
      )}

      <ul className="record-tiles">
        {tiles.map(([label, value]) => (
          <li key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </li>
        ))}
      </ul>

      {r.tasks.length > 0 && (
        <section>
          <h2>Tasks finished</h2>
          <table className="record-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Task</th>
                <th>Mission</th>
                <th>Est. time</th>
              </tr>
            </thead>
            <tbody>
              {r.tasks.map((t) => (
                <tr key={t.id}>
                  <td>{day(t.finishedAt)}</td>
                  <td>{t.title}</td>
                  <td>
                    {t.mission}
                    {t.community && <small> · {t.community}</small>}
                  </td>
                  <td>{hours(t.minutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {r.missions.length > 0 && (
        <section>
          <h2>Missions started</h2>
          <ul className="record-list">
            {r.missions.map((m) => (
              <li key={m.id}>
                <span>{m.title}</span>
                <small>
                  {day(m.startedAt)}
                  {m.community && ` · ${m.community}`}
                </small>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.communitiesStarted.length > 0 && (
        <section>
          <h2>Communities started</h2>
          <ul className="record-list">
            {r.communitiesStarted.map((c) => (
              <li key={c.id}>
                <span>{c.name}</span>
                <small>{day(c.startedAt)}</small>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.proposals.length > 0 && (
        <section>
          <h2>Proposals opened</h2>
          <ul className="record-list">
            {r.proposals.map((p) => (
              <li key={p.id}>
                <span>{p.title}</span>
                <small>{day(p.openedAt)}</small>
              </li>
            ))}
          </ul>
        </section>
      )}

      {earned.length > 0 && (
        <section>
          <h2>Stickers collected</h2>
          <ul className="record-stickers">
            {earned.map((s) => (
              <li key={s.id}>
                <StickerBadge {...s} size={56} />
                <span>{s.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="record-footer">
        Generated on {day(r.generatedAt)} from this person’s activity on Cosmogov (www.cosmogov.com). Times are
        the estimates written in each task plan, not tracked hours. Votes and signatures are private and are never
        listed. Cosmogov does not verify identity.
      </footer>
    </article>
  );
}
