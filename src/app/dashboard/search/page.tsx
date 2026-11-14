"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, FileText, Building2, Users, Brain } from "lucide-react";

interface SearchResult {
  type: string;
  title: string;
  description: string;
  href: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);
  useEffect(() => {
    let cancelled = false;
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      Promise.all([
        fetch("/api/proposals?search=" + encodeURIComponent(query)).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch("/api/organizations").then((r) => (r.ok ? r.json() : [])),
      ])
        .then(([proposals, orgs]) => {
          if (cancelled) return;
          const matches: SearchResult[] = [];
          (Array.isArray(proposals) ? proposals : []).forEach(
            (p: { id: string; title: string; description: string }) =>
              matches.push({
                type: "proposal",
                title: p.title,
                description: p.description?.slice(0, 100),
                href: `/dashboard/proposals/${p.id}`,
              }),
          );
          (Array.isArray(orgs) ? orgs : [])
            .filter((o: { name: string; description?: string }) =>
              `${o.name} ${o.description || ""}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .forEach((o: { name: string; description: string; slug: string }) =>
              matches.push({
                type: "organization",
                title: o.name,
                description: o.description,
                href: `/dashboard/organizations/${o.slug}`,
              }),
            );
          setResults(matches);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const iconMap: Record<string, any> = {
    proposal: FileText,
    organization: Building2,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold font-heading mb-6">Search</h1>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cosmic-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search proposals and your communities..."
          className="pl-9 bg-foreground/5 border-border text-foreground placeholder:text-cosmic-muted/50 h-12 text-base"
          autoFocus
        />
      </div>
      {loading && (
        <p className="text-sm text-cosmic-muted text-center">Searching...</p>
      )}
      {!loading && results.length === 0 && query && (
        <p className="text-sm text-cosmic-muted text-center">
          No results found
        </p>
      )}
      <div className="space-y-2">
        {results.map((r, i) => {
          const Icon = iconMap[r.type] || FileText;
          return (
            <a key={i} href={r.href}>
              <Card className="bg-card border-border hover:border-border transition-all cursor-pointer mb-2">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-cosmic-muted" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <p className="text-xs text-cosmic-muted truncate">
                      {r.description}
                    </p>
                  </div>
                  <span className="text-xs text-cosmic-muted ml-auto whitespace-nowrap">
                    {r.type}
                  </span>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-cosmic-muted">Opening search…</p>}>
      <SearchContent />
    </Suspense>
  );
}
