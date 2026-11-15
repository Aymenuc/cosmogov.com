"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Check,
  CheckCheck,
  Clock,
  Globe2,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Vote,
} from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";
import {
  type CivicProposal,
  deadlineLabel,
  isOpen,
  voteLabel,
} from "@/lib/civic";
interface ProposalDetail extends CivicProposal {
  options: string;
  quorum: number;
  isAnonymous: boolean;
  creator: { name: string | null };
  votes: {
    id: string;
    option: string;
    voterId: string;
    voter?: { name: string | null };
    confidence?: number;
  }[];
  comments: {
    id: string;
    content: string;
    createdAt: string;
    author: { name: string | null };
  }[];
}
export default function ProposalDetailPage() {
  const params = useParams();
  const { user, saved, toggleSaved } = useWorkspace();
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [option, setOption] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [reasoning, setReasoning] = useState("");
  const [comment, setComment] = useState("");
  const [voting, setVoting] = useState(false);
  const [posting, setPosting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [actionError, setActionError] = useState("");
  const [retry, setRetry] = useState(0);
  const endpoint = `/api/proposals/${params.id}`;
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(endpoint)
      .then(async (res) => {
        if (!res.ok)
          throw new Error(
            res.status === 404
              ? "This proposal could not be found."
              : "We couldn’t load this proposal. Please try again.",
          );
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setProposal(data);
          const mine = data.votes?.find(
            (v: { voterId: string }) => v.voterId === user?.id,
          );
          if (mine) {
            setOption(mine.option);
            setConfidence(mine.confidence || 3);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint, user?.id, retry]);
  async function refresh() {
    const res = await fetch(endpoint);
    if (!res.ok)
      throw new Error(
        "Your contribution was saved, but the latest activity couldn’t be loaded. Refresh to see it.",
      );
    setProposal(await res.json());
  }
  async function submitVote(event: React.FormEvent) {
    event.preventDefault();
    if (!option || voting) return;
    setVoting(true);
    setActionError("");
    setFeedback("");
    try {
      const res = await fetch(`${endpoint}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option, confidence, reasoning }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.error || "Your vote couldn’t be saved. Please try again.",
        );
      }
      await refresh();
      setFeedback(
        "Your vote is recorded. Thank you for adding your perspective.",
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setVoting(false);
    }
  }
  async function submitComment(event: React.FormEvent) {
    event.preventDefault();
    if (!comment.trim() || posting) return;
    setPosting(true);
    setActionError("");
    setFeedback("");
    try {
      const res = await fetch(`${endpoint}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.error || "Your comment couldn’t be posted. Please try again.",
        );
      }
      setComment("");
      await refresh();
      setFeedback("Your perspective has been added to the conversation.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setPosting(false);
    }
  }
  if (loading)
    return (
      <div className="detail-loading">
        <Loader2 className="animate-spin" />
        <span>Opening the conversation…</span>
      </div>
    );
  if (error || !proposal)
    return (
      <div className="empty-state" role="alert">
        <h1>{error || "Proposal not found"}</h1>
        <button
          className="civic-button outline"
          onClick={() => setRetry((value) => value + 1)}
        >
          Try again
        </button>
        <Link href="/dashboard/proposals" className="text-link">
          Back to proposals
        </Link>
      </div>
    );
  let options: string[] = [];
  try {
    const parsed = JSON.parse(proposal.options);
    if (Array.isArray(parsed))
      options = parsed.filter((v) => typeof v === "string");
  } catch {}
  if (!options.length) options = ["For", "Against"];
  const open = isOpen(proposal);
  const mine = proposal.votes.find((v) => v.voterId === user?.id);
  const total = proposal._count?.votes ?? proposal.voteTotals?.reduce((sum, row) => sum + row.count, 0) ?? proposal.votes.length;
  const quorumMet = total >= proposal.quorum;
  const isSaved = saved.includes(proposal.id);
  return (
    <div className="decision-room">
      <div className="decision-topline">
        <Link href="/dashboard/proposals" className="text-link">
          <ArrowLeft size={14} />
          All proposals
        </Link>
        <button
          className={`following-filter ${isSaved ? "active" : ""}`}
          aria-pressed={isSaved}
          onClick={() => toggleSaved(proposal.id)}
        >
          <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
          {isSaved ? "Following this idea" : "Follow this idea"}
        </button>
      </div>
      <div className="decision-heading">
        <div className="eyebrow">
          <span className="status-dot" />{" "}
          {open
            ? "AN OPEN CONVERSATION"
            : proposal.status === "draft"
              ? "AN IDEA IN PROGRESS"
              : "A COMMUNITY DECISION"}
        </div>
        <h1>{proposal.title}</h1>
        <div className="decision-byline">
          <span>
            <Users size={13} />
            {proposal.creator.name || "Community member"}
          </span>
          {proposal.organization && (
            <Link
              href={`/dashboard/organizations/${proposal.organization.slug}`}
            >
              {proposal.organization.name}
              <ArrowUpRight size={11} />
            </Link>
          )}
          <span>
            <Clock size={12} />
            Started{" "}
            {new Date(proposal.createdAt).toLocaleDateString('en-GB', {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
      <nav className="decision-steps" aria-label="Decision journey">
        <a href="#decision-brief">
          <span>01</span>
          <div>
            <strong>Understand the idea</strong>
            <small>Read the decision brief</small>
          </div>
        </a>
        <a href="#decision-vote">
          <span>02</span>
          <div>
            <strong>
              {mine ? "Your voice is counted" : "Add your perspective"}
            </strong>
            <small>
              {mine
                ? "Review your contribution"
                : open
                  ? "Discuss, then decide"
                  : "Review the result"}
            </small>
          </div>
        </a>
        <Link href="/dashboard/participation/accountability">
          <span>03</span>
          <div>
            <strong>Keep the thread</strong>
            <small>Follow community progress</small>
          </div>
          <ArrowUpRight size={14} />
        </Link>
      </nav>
      {actionError && (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      )}
      {feedback && (
        <p className="form-success" role="status">
          <CheckCheck size={17} />
          {feedback}
        </p>
      )}
      <div className="decision-columns">
        <div>
          <section id="decision-brief" className="decision-section">
            <div className="app-section-heading">
              <h2>The decision brief.</h2>
              <span className="proposal-status open">
                In the proposer’s words
              </span>
            </div>
            <p className="decision-description">{proposal.description}</p>
          </section>
          <section id="decision-vote" className="decision-section">
            <div className="app-section-heading">
              <h2>
                {open
                  ? mine
                    ? "Your contribution."
                    : "What do you think?"
                  : "The votes, in view."}
              </h2>
              <Vote size={18} />
            </div>
            {open && (
              <>
                <p className="section-context">
                  {mine
                    ? "Your vote is recorded. You can update your choice while voting is open."
                    : "Take a moment to consider the idea. Your vote is a part of the bigger picture."}
                </p>
                <form onSubmit={submitVote}>
                  <fieldset className="vote-options">
                    <legend className="sr-only">Choose your vote</legend>
                    {options.map((value) => (
                      <label
                        key={value}
                        className={option === value ? "selected" : ""}
                      >
                        <input
                          type="radio"
                          name="vote-option"
                          value={value}
                          checked={option === value}
                          onChange={() => setOption(value)}
                          required
                        />
                        <span>{value}</span>
                        {option === value && <Check size={15} />}
                      </label>
                    ))}
                  </fieldset>
                  <label className="confidence-label" htmlFor="vote-confidence">
                    How confident do you feel?<span>{confidence} / 5</span>
                  </label>
                  <input
                    className="confidence-slider"
                    id="vote-confidence"
                    type="range"
                    min="1"
                    max="5"
                    value={confidence}
                    onChange={(e) => setConfidence(Number(e.target.value))}
                  />
                  <div className="confidence-endpoints">
                    <span>Still considering</span>
                    <span>Very confident</span>
                  </div>
                  <label className="reasoning-label" htmlFor="vote-reasoning">
                    Your reasoning <span>(optional)</span>
                  </label>
                  <textarea
                    id="vote-reasoning"
                    rows={3}
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                    placeholder="What matters most to you about this decision?"
                  />
                  <button
                    type="submit"
                    className="civic-button"
                    disabled={!option || voting}
                  >
                    {voting ? (
                      <>
                        <Loader2 className="animate-spin" size={15} />
                        Recording your vote…
                      </>
                    ) : (
                      <>
                        {mine ? "Update my vote" : "Make my voice count"}
                        <ArrowUpRight size={15} />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
            {!open && (
              <p className="section-context">
                {proposal.status === "draft"
                  ? "Voting has not opened. The proposal is still being prepared."
                  : "Voting has ended. Results show the recorded choices; implementation is tracked separately."}
              </p>
            )}
            <div className="results-block">
              <div className="results-heading">
                <strong>
                  {open ? "The conversation so far" : "Recorded results"}
                </strong>
                <span>
                  {total} {total === 1 ? "vote" : "votes"}
                </span>
              </div>
              {options.map((value) => {
                const count = proposal.voteTotals?.find(row => row.option === value)?.count ?? proposal.votes.filter(v => v.option === value).length;
                const percent = total ? (count / total) * 100 : 0;
                return (
                  <div key={value} className="result-row">
                    <div>
                      <span>{value}</span>
                      <span>
                        {count} · {Math.round(percent)}%
                      </span>
                    </div>
                    <div className="progress-track">
                      <i style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
              <p>
                {total === 0
                  ? "Every conversation starts somewhere. No votes recorded yet."
                  : `${quorumMet ? "Participation threshold reached" : `${Math.max(0, proposal.quorum - total)} more votes to reach the participation threshold`}. ${open ? "These are live results, not a final decision." : "See your community’s rules for how results become decisions."}`}
              </p>
            </div>
          </section>
          <section id="decision-discussion" className="decision-section">
            <div className="app-section-heading">
              <h2>Make space for another perspective.</h2>
              <MessageCircle size={18} />
            </div>
            <p className="section-context">
              Ask a question. Share a concern. Help build a more considered
              decision.
            </p>
            <form onSubmit={submitComment} className="discussion-form">
              <label className="sr-only" htmlFor="decision-comment">
                Add your perspective
              </label>
              <textarea
                id="decision-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What would you add to the conversation?"
                required
              />
              <button
                className="civic-button"
                disabled={posting || !comment.trim()}
              >
                {posting ? "Posting…" : "Join the discussion"}
                <Send size={13} />
              </button>
            </form>
            <div className="decision-comments">
              {proposal.comments.length === 0 ? (
                <p className="section-context">
                  No comments yet. A thoughtful question is a good place to
                  start.
                </p>
              ) : (
                proposal.comments.map((c) => (
                  <article key={c.id}>
                    <span className="user-avatar small">
                      {(c.author.name || "C")[0]}
                    </span>
                    <div>
                      <div>
                        <strong>{c.author.name || "Community member"}</strong>
                        <time dateTime={c.createdAt}>
                          {new Date(c.createdAt).toLocaleDateString('en-GB', {
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      </div>
                      <p>{c.content}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
        <aside className="decision-sidebar">
          <section>
            <div className="eyebrow">KNOW HOW YOUR VOICE COUNTS</div>
            <h2>The rules, in the open.</h2>
            <dl>
              <div>
                <dt>Current stage</dt>
                <dd>
                  {open
                    ? "Open for voting"
                    : proposal.status === "draft"
                      ? "Draft proposal"
                      : "Voting ended"}
                </dd>
              </div>
              <div>
                <dt>Voting method</dt>
                <dd>
                  {voteLabel[proposal.votingType] ||
                    proposal.votingType.replaceAll("_", " ")}
                </dd>
              </div>
              <div>
                <dt>Closing date</dt>
                <dd>
                  {proposal.closesAt
                    ? new Date(proposal.closesAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "No closing date set"}
                </dd>
              </div>
              <div>
                <dt>Participation threshold</dt>
                <dd>{proposal.quorum} votes</dd>
              </div>
              <div>
                <dt>Voter visibility</dt>
                <dd>
                  Only your own ballot is shown. Results use totals.
                </dd>
              </div>
            </dl>
            <div className="quorum-summary">
              <div>
                <span>
                  {total} / {proposal.quorum} votes
                </span>
                <span>
                  {quorumMet ? <CheckCheck size={14} /> : <Users size={14} />}
                </span>
              </div>
              <div className="progress-track">
                <i
                  style={{
                    width: `${proposal.quorum > 0 ? Math.min(100, (total / proposal.quorum) * 100) : 100}%`,
                  }}
                />
              </div>
              <p>
                A threshold measures participation. It doesn’t, by itself,
                determine approval.
              </p>
            </div>
          </section>
          <div className="decision-nudge">
            <ShieldCheck size={21} />
            <h3>A decision is a beginning.</h3>
            <p>
              Keep track of official responses and implementation in your
              community’s accountability space.
            </p>
            <Link
              href="/dashboard/participation/accountability"
              className="text-link"
            >
              Follow the next chapter
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <section><h2>Your ballot and privacy</h2><p className="section-context">Members see result totals and their own ballot. Ballots remain linked to accounts in the database; this is not an anonymous ballot system.</p></section>
          <Link href="/dashboard/assistant" className="desk-ai">
            <Sparkles size={19} />
            <div>
              <h3>Think it through.</h3>
              <p>
                Ask the AI assistant a governance question. Community members
                make the decisions.
              </p>
              <span>
                Open assistant <ArrowUpRight size={12} />
              </span>
            </div>
          </Link>
        </aside>
      </div>
    </div>
  );
}
