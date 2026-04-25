'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, FileText, Vote, Settings, ArrowLeft } from 'lucide-react';

interface OrgDetail { id: string; name: string; slug: string; description: string | null; plan: string; memberships: { role: string; user: { id: string; name: string | null; email: string; totalXp: number; level: number } }[]; proposals: { id: string; title: string; status: string; _count: { votes: number } }[]; _count: { memberships: number; proposals: number }; }

export default function OrgDetailPage() {
  const params = useParams();
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/organizations/${params.slug}`).then(r => r.json()).then(data => { setOrg(data); setLoading(false); }).catch(() => setLoading(false));
  }, [params.slug]);

  if (loading) return <div className="text-center py-20 text-cosmic-muted animate-pulse">Loading...</div>;
  if (!org) return <div className="text-center py-20 text-cosmic-muted">Organization not found</div>;

  return (
    <div>
      <Link href="/dashboard/organizations"><Button variant="ghost" className="text-cosmic-muted hover:text-white mb-4"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button></Link>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cosmic-teal/20 to-cosmic-violet/20 flex items-center justify-center"><Building2 className="w-6 h-6 text-cosmic-teal" /></div>
        <div><h1 className="text-2xl font-bold font-heading">{org.name}</h1><p className="text-cosmic-muted text-sm">{org.description}</p></div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-[#0B1022] border-white/5"><CardContent className="p-4 text-center"><Users className="w-5 h-5 text-cosmic-teal mx-auto mb-1" /><p className="text-xl font-bold font-heading">{org._count.memberships}</p><p className="text-xs text-cosmic-muted">Members</p></CardContent></Card>
        <Card className="bg-[#0B1022] border-white/5"><CardContent className="p-4 text-center"><FileText className="w-5 h-5 text-cosmic-accent mx-auto mb-1" /><p className="text-xl font-bold font-heading">{org._count.proposals}</p><p className="text-xs text-cosmic-muted">Proposals</p></CardContent></Card>
        <Card className="bg-[#0B1022] border-white/5"><CardContent className="p-4 text-center"><Vote className="w-5 h-5 text-cosmic-violet mx-auto mb-1" /><p className="text-xl font-bold font-heading">{org.proposals.reduce((s, p) => s + p._count.votes, 0)}</p><p className="text-xs text-cosmic-muted">Votes</p></CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-[#0B1022] border-white/5">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3">Members</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {org.memberships.map((m, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-2.5">
                  <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-cosmic-accent/20 flex items-center justify-center text-xs font-bold text-cosmic-accent">{(m.user.name || 'U')[0]}</div><span className="text-sm">{m.user.name}</span></div>
                  <span className="text-xs text-cosmic-muted">{m.role}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0B1022] border-white/5">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3">Recent Proposals</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {org.proposals.map(p => (
                <Link key={p.id} href={`/dashboard/proposals/${p.id}`}>
                  <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5 hover:bg-white/10 transition-colors">
                    <span className="text-sm truncate flex-grow pr-2">{p.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-cosmic-teal/10 text-cosmic-teal' : 'bg-cosmic-muted/10 text-cosmic-muted'}`}>{p.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
