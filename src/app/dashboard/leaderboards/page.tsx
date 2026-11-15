"use client";
import { useEffect, useState } from "react";
import WorkspaceHeading from "@/components/WorkspaceHeading";
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
      <WorkspaceHeading
        look="activity"
        title="Community activity"
        description="Reputation scores built from proposals, comments, mission tasks, communities and civic games. Votes are never counted."
      />
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
