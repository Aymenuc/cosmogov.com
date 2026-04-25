'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, FileText, Building2, Users, Brain } from 'lucide-react';

interface SearchResult { type: string; title: string; description: string; href: string; }

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    Promise.all([
      fetch('/api/proposals?search=' + query).then(r => r.json()).catch(() => []),
      fetch('/api/organizations').then(r => r.json()).catch(() => []),
    ]).then(([proposals, orgs]) => {
      const r: SearchResult[] = [];
      (Array.isArray(proposals) ? proposals : []).forEach((p: any) => r.push({ type: 'proposal', title: p.title, description: p.description?.slice(0, 100), href: `/dashboard/proposals/${p.id}` }));
      (Array.isArray(orgs) ? orgs : []).forEach((o: any) => r.push({ type: 'organization', title: o.name, description: o.description, href: `/dashboard/organizations/${o.slug}` }));
      setResults(r);
      setLoading(false);
    });
  }, [query]);

  const iconMap: Record<string, any> = { proposal: FileText, organization: Building2 };

  return (
    <div>
      <h1 className="text-2xl font-bold font-heading mb-6">Search</h1>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cosmic-muted" />
        <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search proposals, organizations, users..."
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 h-12 text-base" autoFocus />
      </div>
      {loading && <p className="text-sm text-cosmic-muted text-center">Searching...</p>}
      {!loading && results.length === 0 && query && <p className="text-sm text-cosmic-muted text-center">No results found</p>}
      <div className="space-y-2">
        {results.map((r, i) => {
          const Icon = iconMap[r.type] || FileText;
          return (
            <a key={i} href={r.href}>
              <Card className="bg-[#0B1022] border-white/5 hover:border-white/10 transition-all cursor-pointer mb-2">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><Icon className="w-4 h-4 text-cosmic-muted" /></div>
                  <div className="min-w-0"><p className="text-sm font-medium truncate">{r.title}</p><p className="text-xs text-cosmic-muted truncate">{r.description}</p></div>
                  <span className="text-xs text-cosmic-muted ml-auto whitespace-nowrap">{r.type}</span>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
}
