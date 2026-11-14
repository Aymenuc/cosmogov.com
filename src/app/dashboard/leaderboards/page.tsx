"use client";
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
type Leader = { userId: string; name: string; score: number; tier: string };
export default function LeaderboardsPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetch("/api/reputation/leaderboard", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("Activity scores are unavailable. Try again later.");
        return response.json();
      })
      .then((data) => {
        if (active)
          setLeaders(Array.isArray(data.leaderboard) ? data.leaderboard : []);
      })
      .catch((error) => {
        if (active) setError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="workspace-page">
      <header className="page-heading">
        <div>
          <div className="eyebrow">RECORDED APP ACTIVITY</div>
          <h1>
            <Trophy size={28} /> Community activity
          </h1>
          <p>Activity scores never change the weight of a vote.</p>
        </div>
      </header>
      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : loading ? (
        <p role="status">Loading recorded activity…</p>
      ) : leaders.length ? (
        <div className="mission-list-grid">
          {leaders.map((leader, index) => (
            <article className="mission-template-card" key={leader.userId}>
              <span>
                #{index + 1} · {leader.tier}
              </span>
              <h2>{leader.name || "Community member"}</h2>
              <p>{leader.score.toLocaleString()} activity score</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No activity scores recorded yet.</h2>
          <p>Recorded scores will appear here when available.</p>
        </div>
      )}
    </div>
  );
}
