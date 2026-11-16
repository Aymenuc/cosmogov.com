'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Copy, FileText, Link2, Loader2, Plus, Users, Vote } from 'lucide-react';
import { DetailHeading } from '@/components/WorkspaceHeading';

interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isMember: boolean;
  myRole: string | null;
  memberships: { role: string; user: { id: string; name: string | null } }[];
  proposals: { id: string; title: string; status: string; _count: { votes: number } }[];
  _count: { memberships: number; proposals: number };
}

interface Invite {
  token: string;
  expiresAt: string;
}

const ROLE: Record<string, string> = { owner: 'Owner', admin: 'Admin', moderator: 'Moderator', member: 'Member' };
const STATUS: Record<string, string> = {
  active: 'Open',
  draft: 'Draft',
  closed: 'Closed',
  passed: 'Passed',
  rejected: 'Not passed',
  cancelled: 'Cancelled',
};
const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}

function InvitePanel({ slug }: { slug: string }) {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/organizations/${slug}/invite`)
      .then((r) => (r.ok ? r.json() : { invite: null }))
      .then((d) => setInvite(d.invite))
      .catch(() => setInvite(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const act = async (method: 'POST' | 'DELETE') => {
    if (method === 'DELETE' && !window.confirm('Turn the invite link off? Anyone who has it won’t be able to join.')) return;
    setBusy(true);
    setError('');
    try {
      const d = await send(`/api/organizations/${slug}/invite`, method);
      setInvite(d.invite);
      setCopied(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const link = invite ? `${window.location.origin}/dashboard/organizations/join/${invite.token}` : '';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setError('Copying didn’t work here. Select the link and copy it by hand.');
    }
  };

  return (
    <section className="org-panel org-invite" aria-labelledby="org-invite">
      <h2 id="org-invite">
        <Link2 size={17} aria-hidden="true" /> Invite people
      </h2>
      {loading ? (
        <p className="org-panel-note" role="status">Checking for an invite link…</p>
      ) : invite ? (
        <>
          <p className="org-panel-note">
            Anyone with this link can join as a member. It works until {day(invite.expiresAt)}.
          </p>
          <div className="org-invite-row">
            <input readOnly value={link} aria-label="Invite link" onFocus={(e) => e.target.select()} />
            <button type="button" className="civic-button" onClick={copy}>
              {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
          <div className="org-invite-actions">
            <button type="button" className="org-text-button" onClick={() => act('POST')} disabled={busy}>
              Make a new link (the old one stops working)
            </button>
            <button type="button" className="org-text-button is-danger" onClick={() => act('DELETE')} disabled={busy}>
              Turn the link off
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="org-panel-note">
            Make a link and share it by email or chat. Anyone who opens it while signed in can join as a member.
            You can replace it or turn it off at any time.
          </p>
          <button type="button" className="civic-button" style={{ marginTop: 12 }} onClick={() => act('POST')} disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Link2 size={15} aria-hidden="true" />}
            Make an invite link
          </button>
        </>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

export default function OrgDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params.slug);
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(
    () =>
      fetch(`/api/organizations/${slug}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setOrg(data))
        .catch(() => setOrg(null))
        .finally(() => setLoading(false)),
    [slug],
  );

  useEffect(() => {
    load();
  }, [load]);

  const memberAction = async (userId: string, name: string, kind: 'remove' | 'admin' | 'leave') => {
    const question =
      kind === 'leave'
        ? 'Leave this community? You’ll need a new invite link to come back.'
        : kind === 'remove'
          ? `Remove ${name} from the community?`
          : `Make ${name} an admin? Admins can invite and remove people, and you can’t undo another admin’s role.`;
    if (!window.confirm(question)) return;
    setBusyId(userId);
    setError('');
    try {
      if (kind === 'admin') await send(`/api/organizations/${slug}/members/${userId}`, 'PATCH', { role: 'admin' });
      else await send(`/api/organizations/${slug}/members/${kind === 'leave' ? 'me' : userId}`, 'DELETE');
      if (kind === 'leave') {
        router.push('/dashboard/organizations');
        return;
      }
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId('');
    }
  };

  if (loading)
    return (
      <div className="empty-state" role="status">
        <Loader2 className="animate-spin" size={22} aria-hidden="true" />
        <p>Opening the community…</p>
      </div>
    );

  if (!org)
    return (
      <div className="empty-state">
        <h3>We couldn’t find this community</h3>
        <p>It may have been renamed or removed.</p>
        <Link href="/dashboard/organizations" className="civic-button outline">
          My communities
        </Link>
      </div>
    );

  // Only the ten most recent proposals come back, so the label says so.
  const ballots = org.proposals.reduce((s, p) => s + p._count.votes, 0);
  const isAdmin = org.myRole === 'admin';

  return (
    <div>
      <DetailHeading
        look="assemblies"
        section="Community"
        title={org.name}
        description={org.description || 'A shared space to talk, propose and decide together.'}
        back={{ href: '/dashboard/organizations', label: 'My communities' }}
        meta={
          <>
            <span>
              <Users size={13} aria-hidden="true" /> {org._count.memberships} {org._count.memberships === 1 ? 'member' : 'members'}
            </span>
            <span>
              <FileText size={13} aria-hidden="true" /> {org._count.proposals} {org._count.proposals === 1 ? 'proposal' : 'proposals'}
            </span>
            <span>
              <Vote size={13} aria-hidden="true" /> {ballots} {ballots === 1 ? 'ballot' : 'ballots'} on recent proposals
            </span>
            {org.myRole && <span>You: {ROLE[org.myRole] ?? org.myRole}</span>}
          </>
        }
      >
        {org.isMember && (
          <Link href={`/dashboard/proposals/new?orgId=${encodeURIComponent(org.id)}`} className="civic-button">
            <Plus size={15} aria-hidden="true" /> Start a proposal
          </Link>
        )}
      </DetailHeading>

      {isAdmin && <InvitePanel slug={org.slug} />}

      {error && (
        <p className="form-error" role="alert" style={{ marginTop: 16 }}>
          {error}
        </p>
      )}

      <div className="org-detail-grid">
        <section className="org-panel" aria-labelledby="org-proposals">
          <h2 id="org-proposals">Recent proposals</h2>
          {org.proposals.length ? (
            <ul>
              {org.proposals.map((p) => (
                <li key={p.id}>
                  <Link href={`/dashboard/proposals/${p.id}`} className="org-row">
                    <span className="org-row-title">{p.title}</span>
                    <span className={`org-chip${p.status === 'active' ? ' is-open' : ''}`}>{STATUS[p.status] ?? p.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="org-panel-note">
              No proposals yet.{' '}
              {org.isMember
                ? 'Start the first one: a question this community should decide together.'
                : 'Members can start the first one.'}
            </p>
          )}
        </section>

        <section className="org-panel" aria-labelledby="org-members">
          <h2 id="org-members">Members</h2>
          {org.isMember ? (
            <>
              <ul>
                {org.memberships.map((m) => {
                  const canManage = isAdmin && m.role !== 'admin';
                  const name = m.user.name || 'A member';
                  return (
                    <li key={m.user.id} className="org-row">
                      <span className="org-avatar" aria-hidden="true">
                        {(m.user.name || '?')[0].toUpperCase()}
                      </span>
                      <span className="org-row-title">{name}</span>
                      <span className="org-chip">{ROLE[m.role] ?? m.role}</span>
                      {canManage && (
                        <span className="org-row-actions">
                          <button
                            type="button"
                            className="org-text-button"
                            disabled={busyId === m.user.id}
                            onClick={() => memberAction(m.user.id, name, 'admin')}
                            aria-label={`Make ${name} an admin`}
                          >
                            Make admin
                          </button>
                          <button
                            type="button"
                            className="org-text-button is-danger"
                            disabled={busyId === m.user.id}
                            onClick={() => memberAction(m.user.id, name, 'remove')}
                            aria-label={`Remove ${name}`}
                          >
                            Remove
                          </button>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                className="org-text-button is-danger"
                style={{ marginTop: 12 }}
                disabled={busyId === 'me'}
                onClick={() => memberAction('me', '', 'leave')}
              >
                Leave this community
              </button>
            </>
          ) : (
            <p className="org-panel-note">
              Who belongs to a community is private: only its members see the list. To join, ask a member for an invite link.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
