"use client";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Handshake } from "lucide-react";
type Suggestion = {
  taskId: string;
  taskTitle: string;
  responseId: string;
  respondent: string;
  authorId: string;
  terms: string[];
};
type Invitation = Suggestion & {
  id: string;
  status: string;
  taskStatus: string;
};
export default function SuggestionBoard({
  missionId,
  userId,
  demo,
  refreshKey,
  onRefresh,
}: {
  missionId: string;
  userId?: string;
  demo: boolean;
  refreshKey: string;
  onRefresh: () => Promise<void>;
}) {
  const [data, setData] = useState<{
    suggestions: Suggestion[];
    invites: Invitation[];
    canManage: boolean;
    limited: boolean;
  }>({ suggestions: [], invites: [], canManage: false, limited: false });
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    if (demo) return;
    const response = await fetch(`/api/missions/${missionId}/matches`, {
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    setData(result);
  }, [demo, missionId]);
  useEffect(() => {
    load().catch((error) => setError(error.message));
  }, [load, refreshKey]);
  const act = async (method: string, body: unknown) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/missions/${missionId}/matches`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await load();
      await onRefresh();
      setNotice(
        method === "POST"
          ? "Invitation sent. The person decides whether to accept."
          : "Invitation updated.",
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="mission-suggestions">
      <div className="mission-panel-heading">
        <div>
          <div className="eyebrow">OFFERS MEET USEFUL WORK</div>
          <h2>A little help in the right place.</h2>
          <p>
            Suggestions use shared words from answers people opted in to use.
            They do not establish ability or availability. An organizer invites;
            the person chooses.
          </p>
        </div>
        <Handshake size={28} />
      </div>
      {demo ? (
        <p className="mission-small">
          Real missions can turn opted-in answers into task invitations. This
          example does not send invitations.
        </p>
      ) : (
        <>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="mission-success">
              {notice}
            </p>
          )}
          <div className="mission-suggestion-grid">
            {data.invites.map((invite) => (
              <article key={invite.id}>
                <span className="mission-match-status">{invite.status}</span>
                <h3>{invite.taskTitle}</h3>
                <p>
                  {invite.authorId === userId
                    ? "An invitation for you"
                    : invite.respondent}
                </p>
                <p className="mission-small">
                  Shared words: {invite.terms.join(", ")}
                </p>
                {invite.status === "invited" &&
                  (invite.authorId === userId ? (
                    <div className="mission-form-actions">
                      <button
                        className="civic-button"
                        disabled={busy || invite.taskStatus !== "open"}
                        onClick={() =>
                          act("PATCH", { matchId: invite.id, action: "accept" })
                        }
                      >
                        Accept invitation <ArrowUpRight size={15} />
                      </button>
                      <button
                        className="civic-button outline"
                        disabled={busy}
                        onClick={() =>
                          act("PATCH", {
                            matchId: invite.id,
                            action: "decline",
                          })
                        }
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    data.canManage && (
                      <button
                        className="civic-button outline"
                        disabled={busy}
                        onClick={() =>
                          act("PATCH", {
                            matchId: invite.id,
                            action: "withdraw",
                          })
                        }
                      >
                        Withdraw invitation
                      </button>
                    )
                  ))}
              </article>
            ))}
            {data.suggestions.map((suggestion) => (
              <article key={`${suggestion.taskId}-${suggestion.responseId}`}>
                <span className="mission-match-status">
                  Suggestion · needs a person
                </span>
                <h3>{suggestion.taskTitle}</h3>
                <p>
                  {suggestion.authorId === userId
                    ? "Your opted-in offer"
                    : suggestion.respondent}
                </p>
                <p className="mission-small">
                  Shared words: {suggestion.terms.join(", ")}
                </p>
                {data.canManage ? (
                  <button
                    className="civic-button outline"
                    disabled={busy}
                    onClick={() =>
                      act("POST", {
                        taskId: suggestion.taskId,
                        responseId: suggestion.responseId,
                      })
                    }
                  >
                    Invite to consider <ArrowUpRight size={15} />
                  </button>
                ) : (
                  <p className="mission-small">
                    You can pick up this task on the board, or an organizer can
                    invite you.
                  </p>
                )}
              </article>
            ))}
          </div>
          {!data.invites.length && !data.suggestions.length && (
            <p className="mission-small">
              Suggestions appear when someone opts an answer into task matching
              and it shares words with an open task.
            </p>
          )}
          {data.limited && (
            <p className="mission-small">
              Showing a limited set of recent offers and suggestions, without
              ranking people.
            </p>
          )}
        </>
      )}
    </section>
  );
}
