"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCheck, Clock } from "lucide-react";
type Outcome = {
  id: string;
  title: string;
  mission: { id: string; title: string };
  evidence: { note: string; url?: string; actor: string; at: string }[];
  updatedAt: string;
};
type ResponseRequest = {
  id: string;
  title: string;
  responseDeadline: string | null;
  overdue: boolean;
};
export default function MissionOutcomes() {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]),
    [requests, setRequests] = useState<ResponseRequest[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/missions/outcomes")
      .then(async (response) => {
        if (!response.ok) throw new Error("Mission outcomes are unavailable.");
        const data = await response.json();
        setOutcomes(data.outcomes || []);
        setRequests(data.responseRequests || []);
      })
      .catch((error) => setError(error.message));
  }, []);
  return (
    <section className="mission-outcomes">
      <div className="mission-panel-heading">
        <div>
          <div className="eyebrow">FROM A LITTLE HELP TO SOMETHING DONE</div>
          <h2>Work people can point to.</h2>
          <p>
            Member-provided completion evidence from missions you can access.
            These reports are not independently verified.
          </p>
        </div>
        <CheckCheck size={25} />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="mission-list-grid">
        {outcomes.map((outcome) => (
          <article className="mission-outcome-card" key={outcome.id}>
            <span>{outcome.mission.title}</span>
            <h3>{outcome.title}</h3>
            {outcome.evidence.map((evidence, index) => (
              <div key={index}>
                <p>{evidence.note}</p>
                <small>
                  {evidence.actor} ·{" "}
                  {new Date(evidence.at).toLocaleDateString('en-GB')}
                </small>
              </div>
            ))}
            <Link href={`/dashboard/missions/${outcome.mission.id}`}>
              View mission and evidence <ArrowUpRight size={15} />
            </Link>
          </article>
        ))}
      </div>
      {!outcomes.length && !error && (
        <p className="mission-small">
          Completed mission tasks will appear here when members add evidence.
        </p>
      )}
      <p className="mission-small">
        Showing up to 50 recent completed tasks with evidence.
      </p>
      {requests.length > 0 && (
        <div className="mission-response-clocks">
          <h3>
            <Clock size={18} />
            Waiting for a formal response
          </h3>
          {requests.map((request) => (
            <Link
              key={request.id}
              href={`/dashboard/participation/binding-proposals/${request.id}`}
            >
              <strong>{request.title}</strong>
              <span className={request.overdue ? "mission-overdue" : ""}>
                {request.responseDeadline
                  ? `${request.overdue ? "Overdue since" : "Requested by"} ${new Date(request.responseDeadline).toLocaleDateString('en-GB')}`
                  : "No response deadline recorded"}
              </span>
              <ArrowUpRight size={15} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
