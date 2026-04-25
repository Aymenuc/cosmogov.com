'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Vote, FileText, Clock, ChevronRight } from 'lucide-react';
import {
  GOVERNANCE_CATEGORIES,
  CATEGORY_GROUPS,
  getCategory,
  resolveCategory,
} from '@/lib/categories';

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: string;
  votingType: string;
  category: string | null;
  createdAt: string;
  _count?: { votes: number; comments: number };
  creator: { name: string | null };
  organization?: { name: string; slug: string } | null;
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    if (categoryFilter && categoryFilter !== 'all')
      params.set('category', categoryFilter);
    fetch(`/api/proposals?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setProposals(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [statusFilter, search, categoryFilter]);

  const handleGroupClick = useCallback(
    (groupCategoryIds: string[]) => {
      // If already filtering to one of this group's categories, reset to all
      if (
        categoryFilter !== 'all' &&
        groupCategoryIds.includes(categoryFilter)
      ) {
        setCategoryFilter('all');
      } else {
        // Otherwise select the first category in the group
        setCategoryFilter(groupCategoryIds[0]);
      }
    },
    [categoryFilter]
  );

  const handleCategoryChipClick = useCallback(
    (catId: string) => {
      setCategoryFilter(categoryFilter === catId ? 'all' : catId);
    },
    [categoryFilter]
  );

  // Determine which group is "active" (has a selected category belonging to it)
  const activeGroupId =
    categoryFilter !== 'all'
      ? CATEGORY_GROUPS.find((g) => g.categoryIds.includes(categoryFilter))?.id
      : null;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading">Proposals</h1>
          <p className="text-cosmic-muted text-sm">
            Review and vote on governance decisions
          </p>
        </div>
        <Link href="/dashboard/proposals/new">
          <Button className="bg-cosmic-accent text-white rounded-xl">
            <Plus className="w-4 h-4 mr-1" /> New Proposal
          </Button>
        </Link>
      </div>

      {/* Browse by Aspect — Category Group Cards */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-cosmic-muted uppercase tracking-wider mb-3">
          Browse by Aspect
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {CATEGORY_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            const isActive = activeGroupId === group.id;
            return (
              <div
                key={group.id}
                onClick={() => handleGroupClick(group.categoryIds)}
                className={`glass-card p-3 sm:p-4 rounded-xl cursor-pointer hover:scale-[1.02] transition-all ${
                  isActive
                    ? 'ring-1 ring-cosmic-accent/60 border-cosmic-accent/30'
                    : 'border-white/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <GroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-cosmic-accent" />
                  <span className="font-medium text-xs sm:text-sm">{group.label}</span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-cosmic-accent ml-auto" />
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-cosmic-muted mb-3">
                  {group.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.categoryIds.map((catId) => {
                    const cat = getCategory(catId);
                    const CatIcon = cat.icon;
                    const isChipSelected = categoryFilter === catId;
                    return (
                      <span
                        key={catId}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCategoryChipClick(catId);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all cursor-pointer ${cat.bgColor} ${cat.color} ${
                          isChipSelected
                            ? `ring-1 ${cat.borderColor} ${cat.bgColor.replace('/10', '/25')}`
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <CatIcon className="w-2.5 h-2.5" />
                        {cat.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Filter Bar — Horizontal Scrollable Chips */}
      <div className="mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {/* All Categories chip */}
          <button
            onClick={() => setCategoryFilter('all')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              categoryFilter === 'all'
                ? 'bg-white/15 text-white ring-1 ring-white/20'
                : 'bg-white/5 text-cosmic-muted hover:bg-white/10'
            }`}
          >
            <FileText className="w-3 h-3" />
            All Categories
          </button>

          {GOVERNANCE_CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChipClick(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? `${cat.bgColor.replace('/10', '/25')} ${cat.color} ring-1 ${cat.borderColor}`
                    : `${cat.bgColor} ${cat.color} opacity-60 hover:opacity-100`
                }`}
              >
                <CatIcon className="w-3 h-3" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cosmic-muted" />
          <Input
            placeholder="Search proposals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['active', 'closed', 'draft'].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'ghost'}
              size="sm"
              className={
                statusFilter === s
                  ? 'bg-cosmic-accent text-white'
                  : 'text-cosmic-muted'
              }
              onClick={() => setStatusFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Proposal List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-[#0B1022] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <Card className="bg-[#0B1022] border-white/5">
          <CardContent className="p-8 text-center">
            <FileText className="w-10 h-10 text-cosmic-muted mx-auto mb-3 opacity-50" />
            <p className="text-cosmic-muted">No proposals found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => {
            const resolvedCat = resolveCategory(p.category);
            const cat = getCategory(resolvedCat);
            const CatIcon = cat.icon;
            return (
              <Link key={p.id} href={`/dashboard/proposals/${p.id}`}>
                <Card className="bg-[#0B1022] border-white/5 hover:border-white/10 transition-all mb-2 cursor-pointer">
                  <CardContent className="p-3 sm:p-5">
                    <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                      <h3 className="font-medium text-sm leading-snug flex-grow min-w-[60%] sm:pr-4">
                        {p.title}
                      </h3>
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${cat.bgColor} ${cat.color}`}
                        >
                          <CatIcon className="w-2.5 h-2.5" />
                          {cat.label}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                            p.status === 'active'
                              ? 'bg-cosmic-teal/10 text-cosmic-teal'
                              : p.status === 'closed'
                                ? 'bg-cosmic-muted/10 text-cosmic-muted'
                                : 'bg-cosmic-amber/10 text-cosmic-amber'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-cosmic-muted line-clamp-2 mb-3">
                      {p.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-cosmic-muted">
                      <span className="flex items-center gap-1">
                        <Vote className="w-3 h-3" />
                        {p._count?.votes || 0} votes
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                      {p.organization && <span>{p.organization.name}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
