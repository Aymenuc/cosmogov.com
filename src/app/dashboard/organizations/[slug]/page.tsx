'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, Loader2, Plus, Users, Vote } from 'lucide-react';
import { DetailHeading } from '@/components/WorkspaceHeading';

interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isMember: boolean;
  memberships: { role: string; user: { id: string; name: string | null } }[];
  proposals: { id: string; title: string; status: string; _count: { votes: number } }[];
  _count: { memberships: number; proposals: number };
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

export default function OrgDetailPage() {
  const params = useParams();
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/organizations/${params.slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setOrg(data))
      .catch(() => setOrg(null))
      .finally(() => setLoading(false));
  }, [params.slug]);

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
          </>
        }
      >
        {org.isMember && (
          <Link href={`/dashboard/proposals/new?orgId=${encodeURIComponent(org.id)}`} className="civic-button">
            <Plus size={15} aria-hidden="true" /> Start a proposal
          </Link>
        )}
      </DetailHeading>

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
            <ul>
              {org.memberships.map((m) => (
                <li key={m.user.id} className="org-row">
                  <span className="org-avatar" aria-hidden="true">
                    {(m.user.name || '?')[0].toUpperCase()}
                  </span>
                  <span className="org-row-title">{m.user.name || 'A member'}</span>
                  <span className="org-chip">{ROLE[m.role] ?? m.role}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="org-panel-note">Who belongs to a community is private: only its members see the list.</p>
          )}
        </section>
      </div>
    </div>
  );
}
