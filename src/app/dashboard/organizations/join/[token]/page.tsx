'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Users } from 'lucide-react';
import { DetailHeading } from '@/components/WorkspaceHeading';

interface InviteView {
  community: { name: string; slug: string; description: string | null; members: number };
  isMember: boolean;
  expiresAt: string;
}

export default function JoinCommunityPage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params.token);
  const [view, setView] = useState<InviteView | null>(null);
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetch(`/api/invites/${encodeURIComponent(token)}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (r.ok) setView(d);
        else setProblem(d.error || 'This invite link doesn’t work any more. Ask the community for a new one.');
      })
      .catch(() => setProblem('We couldn’t reach CosmoGov. Check your connection and try again.'))
      .finally(() => setLoading(false));
  }, [token]);

  const join = async () => {
    setJoining(true);
    setProblem('');
    try {
      const r = await fetch(`/api/invites/${encodeURIComponent(token)}`, { method: 'POST' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'We couldn’t add you. Try again.');
      router.push(`/dashboard/organizations/${d.slug}`);
    } catch (e) {
      setProblem((e as Error).message);
      setJoining(false);
    }
  };

  if (loading)
    return (
      <div className="empty-state" role="status">
        <Loader2 className="animate-spin" size={22} aria-hidden="true" />
        <p>Opening the invite…</p>
      </div>
    );

  if (!view)
    return (
      <div className="empty-state">
        <h3>This invite doesn’t work any more</h3>
        <p>{problem}</p>
        <Link href="/dashboard/organizations" className="civic-button outline">
          My communities
        </Link>
      </div>
    );

  const { community } = view;
  return (
    <div>
      <DetailHeading
        look="assemblies"
        section="You’re invited"
        title={community.name}
        description={community.description || 'A shared space to talk, propose and decide together.'}
        back={{ href: '/dashboard/organizations', label: 'My communities' }}
        meta={
          <span>
            <Users size={13} aria-hidden="true" /> {community.members} {community.members === 1 ? 'member' : 'members'}
          </span>
        }
      >
        {view.isMember ? (
          <Link href={`/dashboard/organizations/${community.slug}`} className="civic-button">
            You’re already a member: open it
          </Link>
        ) : (
          <button type="button" className="civic-button" onClick={join} disabled={joining}>
            {joining ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
            Join {community.name}
          </button>
        )}
      </DetailHeading>

      {problem && (
        <p className="form-error" role="alert" style={{ marginTop: 16 }}>
          {problem}
        </p>
      )}

      {!view.isMember && (
        <section className="org-panel" style={{ marginTop: 18 }} aria-labelledby="join-means">
          <h2 id="join-means">What joining means</h2>
          <ul className="org-plain-list">
            <li>You can start proposals for this community and take part in them.</li>
            <li>You appear in its member list, which only members can see.</li>
            <li>You can leave at any time from the community page.</li>
          </ul>
        </section>
      )}
    </div>
  );
}
