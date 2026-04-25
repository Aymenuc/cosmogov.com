'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Plus, Search, Users, FileText, ArrowRight } from 'lucide-react';

interface Org { id: string; name: string; slug: string; description: string | null; plan: string; role: string; memberCount: number; proposalCount: number; }

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/organizations').then(r => r.json()).then(data => { setOrgs(Array.isArray(data) ? data : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = orgs.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold font-heading">Organizations</h1><p className="text-cosmic-muted text-sm">Your governance communities</p></div>
        <Link href="/dashboard/organizations/new"><Button className="bg-cosmic-accent text-white rounded-xl"><Plus className="w-4 h-4 mr-1" /> New Org</Button></Link>
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cosmic-muted" />
        <Input placeholder="Search organizations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50" />
      </div>
      {loading ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-44 bg-[#0B1022] rounded-xl animate-pulse" />)}</div> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(org => (
            <Link key={org.id} href={`/dashboard/organizations/${org.slug}`}>
              <Card className="bg-[#0B1022] border-white/5 hover:border-white/10 transition-all cursor-pointer group h-full">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cosmic-teal/20 to-cosmic-violet/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-cosmic-teal" />
                    </div>
                    <div className="min-w-0"><h3 className="font-medium text-sm truncate">{org.name}</h3><p className="text-xs text-cosmic-muted">{org.role}</p></div>
                  </div>
                  {org.description && <p className="text-xs text-cosmic-muted mb-3 line-clamp-2">{org.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-cosmic-muted">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{org.memberCount}</span>
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{org.proposalCount}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
