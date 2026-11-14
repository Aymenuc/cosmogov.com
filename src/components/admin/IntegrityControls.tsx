"use client";
import { useEffect, useState } from "react";
import { CircleHelp, Copy, ShieldCheck } from "lucide-react";
type Invite = {
  id: string;
  email: string;
  expiresAt: string;
  usedAt: string | null;
};
type Signature = {
  id: string;
  verified: boolean;
  user: { name: string | null; email: string };
  proposal: { title: string };
};
export default function IntegrityControls() {
  const [invites, setInvites] = useState<Invite[]>([]),
    [signatures, setSignatures] = useState<Signature[]>([]),
    [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [reason, setReason] = useState<Record<string, string>>({});
  async function call(path: string, method = "GET", body?: unknown) {
    const response = await fetch(`/api/admin/${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "This action could not be completed.");
    return data;
  }
  const load = async () => {
    const [i, s] = await Promise.all([
      call("official-invitations"),
      call("signatures"),
    ]);
    setInvites(i);
    setSignatures(s);
  };
  useEffect(() => {
    load().catch((error) => setError(error.message));
  }, []);
  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="integrity-controls">
      {error && (
        <p className="form-error" role="alert">
          <CircleHelp size={18} />
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <section className="mission-panel">
        <h2>Official invitations</h2>
        <p>
          Issue a single-use invitation for one email address. It expires in 48
          hours. Share the code privately with its recipient.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            act(async () => {
              const result = await call("official-invitations", "POST", {
                email,
              });
              setCode(result.code);
              setEmail("");
            });
          }}
        >
          <label className="mission-field">
            <span>Official’s email</span>
            <input
              type="email"
              required
              maxLength={320}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <button className="civic-button" disabled={busy}>
            Create invitation
          </button>
        </form>
        {code && (
          <div className="mission-response-notice">
            <p>
              <strong>Shown once.</strong> This code is not stored in plain
              text.
            </p>
            <code>{code}</code>
            <button
              className="civic-button outline"
              onClick={() =>
                navigator.clipboard
                  .writeText(code)
                  .then(() => setNotice("Invitation code copied."))
                  .catch(() => setError("Select and copy the code manually."))
              }
            >
              <Copy size={16} />
              Copy code
            </button>
          </div>
        )}
        {invites.map((invite) => (
          <article key={invite.id}>
            <strong>{invite.email}</strong>
            <p>
              {invite.usedAt
                ? "Used"
                : `Expires ${new Date(invite.expiresAt).toLocaleString()}`}
            </p>
            {!invite.usedAt && (
              <button
                className="civic-button outline"
                disabled={busy}
                onClick={() =>
                  act(async () => {
                    await call("official-invitations", "DELETE", {
                      id: invite.id,
                    });
                    setNotice("Invitation revoked.");
                  })
                }
              >
                Revoke invitation
              </button>
            )}
          </article>
        ))}
      </section>
      <section className="mission-panel">
        <h2>Review signature eligibility</h2>
        <p>
          Record a review only after checking eligibility through your
          organization’s agreed process. Cosmogov does not independently verify
          identity or legal eligibility. Only reviewed signatures count toward a
          response threshold.
        </p>
        {signatures.map((signature) => (
          <article key={signature.id}>
            <h3>{signature.proposal.title}</h3>
            <p>
              {signature.user.name} · {signature.user.email} ·{" "}
              {signature.verified ? "Reviewed" : "Awaiting review"}
            </p>
            <label className="mission-field">
              <span>Review basis for {signature.user.email}</span>
              <textarea
                minLength={10}
                maxLength={1000}
                value={reason[signature.id] || ""}
                onChange={(event) =>
                  setReason({ ...reason, [signature.id]: event.target.value })
                }
                placeholder="Describe the process used. Do not include identity documents or sensitive details."
              />
            </label>
            <button
              className="civic-button outline"
              disabled={busy || (reason[signature.id] || "").trim().length < 10}
              onClick={() =>
                act(async () => {
                  await call("signatures", "PATCH", {
                    id: signature.id,
                    verified: !signature.verified,
                    reason: reason[signature.id],
                  });
                  setNotice("Signature review recorded.");
                })
              }
            >
              <ShieldCheck size={16} />
              {signature.verified
                ? "Revoke review"
                : "Record eligibility review"}
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}
