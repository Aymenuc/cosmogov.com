"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck, CalendarDays, Trophy } from "lucide-react";
import WorkspaceHeading from "@/components/WorkspaceHeading";
import type { GameSlug } from "@/lib/games/catalogue";
import GameArt from "./GameArt";
import StreetIcon from "./StreetIcon";

interface Card {
  slug: GameSlug;
  name: string;
  tagline: string;
  skill: string;
  rounds: number;
}
interface Overview {
  games: Record<string, { plays: number; best: number; dailyDone: boolean }>;
  xp: number;
  plays: number;
}
const TINTS = ["mint", "lilac", "sun", "sky", "peach", "mint"];

/** The games shelf: today's challenges, personal bests and a card per game. */
export default function GamesHome({ games }: { games: Card[] }) {
  const [data, setData] = useState<Overview | null>(null);
  useEffect(() => {
    fetch("/api/games/overview")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);
  const doneToday = data ? Object.values(data.games).filter((g) => g.dailyDone).length : 0;

  return (
    <div className="space-y-8">
      <WorkspaceHeading
        look="games"
        title="Civic games"
        description="Six short games that train the skills good community decisions need: weighing trade-offs, finding common ground, reading numbers and spotting weak arguments."
      />
      <div className="workspace-tool-stats">
        <div className="glass-card">
          <span className="text-xs text-cosmic-muted">Today&apos;s challenges done</span>
          <p className="font-heading text-2xl font-bold">{doneToday} / {games.length}</p>
        </div>
        <div className="glass-card">
          <span className="text-xs text-cosmic-muted">Games played</span>
          <p className="font-heading text-2xl font-bold">{data?.plays ?? 0}</p>
        </div>
        <div className="glass-card">
          <span className="text-xs text-cosmic-muted">XP from games</span>
          <p className="font-heading text-2xl font-bold">{data?.xp ?? 0}</p>
        </div>
      </div>
      <Link href="/dashboard/games/dream-street" className="gh-feature">
        <div className="gh-feature-text">
          <span className="gh-skill">Have your say</span>
          <h2>Dream street</h2>
          <p>Build the street you&apos;d love to live on and add it to your neighbourhood&apos;s wish wall. Not a vote, no points: just your ideas, in a form organisers can use.</p>
          <span className="gh-play">Build my street <ArrowRight size={15} /></span>
        </div>
        <div className="gh-feature-icons" aria-hidden="true">
          {["trees", "market", "bench", "bikes", "flowers", "cafe"].map((id, i) => (
            <motion.span key={id} initial={{ y: -40, opacity: 0, rotate: -10 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 220, damping: 12 }}>
              <StreetIcon id={id} size={64} />
            </motion.span>
          ))}
        </div>
      </Link>
      <h2 className="gh-section">Games that teach</h2>
      <div className="gh-grid">
        {games.map((g, i) => {
          const mine = data?.games[g.slug];
          return (
            <motion.div key={g.slug} initial={{ opacity: 0, y: 24, rotateX: -12 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ delay: 0.06 * i, type: "spring", stiffness: 120, damping: 16 }} whileHover={{ y: -6, rotateX: 4, rotateY: -4 }} className="gh-card-wrap">
              <Link href={`/dashboard/games/${g.slug}`} className={`gh-card tint-${TINTS[i]}`}>
                <div className="gh-art"><GameArt slug={g.slug} /></div>
                <span className="gh-skill">{g.skill}</span>
                <h3>{g.name}</h3>
                <p>{g.tagline}</p>
                <div className="gh-meta">
                  {mine?.dailyDone ? (
                    <span className="gh-done"><CalendarCheck size={14} /> Today done</span>
                  ) : (
                    <span><CalendarDays size={14} /> Today&apos;s challenge</span>
                  )}
                  {mine && mine.best > 0 && <span><Trophy size={14} /> Best {mine.best}</span>}
                  <span>{g.rounds} rounds</span>
                </div>
                <span className="gh-play">Play <ArrowRight size={15} /></span>
              </Link>
            </motion.div>
          );
        })}
      </div>
      <p className="text-sm text-cosmic-muted">Games build your game-skill score and XP. They never change the weight of a vote.</p>
    </div>
  );
}
