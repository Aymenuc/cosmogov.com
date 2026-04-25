'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Megaphone,
  Users,
  FileText,
  Wallet,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  Orbit,
  HandMetal,
  Building2,
  Globe2,
  MapPin,
  Search,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import {
  GOVERNANCE_CATEGORIES,
  CATEGORY_GROUPS,
  getCategory,
  resolveCategory,
} from '@/lib/categories';

interface Process {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string | null;
  scope: string;
  category: string | null;
  currentPhase: string;
  phases: string;
  totalBudget: number;
  currency: string;
  startsAt: string | null;
  endsAt: string | null;
  isPublic: boolean;
  createdAt: string;
  creator: { id: string; name: string | null; avatarUrl: string | null };
  organization: { id: string; name: string; slug: string } | null;
  _count: { processProposals: number; budgetProjects: number; milestones: number };
  proposalCount: number;
  participantCount: number;
  budgetAllocated: number;
}

interface Stats {
  activeProcesses: number;
  totalParticipants: number;
  proposalsSubmitted: number;
  budgetAllocated: number;
}

const PHASE_ORDER = ['information', 'proposal', 'deliberation', 'voting', 'implementation', 'evaluation', 'closed'];

const PHASE_LABELS: Record<string, string> = {
  information: 'Information',
  proposal: 'Proposal',
  deliberation: 'Deliberation',
  voting: 'Voting',
  implementation: 'Implementation',
  evaluation: 'Evaluation',
  closed: 'Closed',
};

const PHASE_COLORS: Record<string, string> = {
  information: 'bg-cosmic-amber',
  proposal: 'bg-cosmic-teal',
  deliberation: 'bg-cosmic-violet',
  voting: 'bg-cosmic-accent',
  implementation: 'bg-cosmic-amber',
  evaluation: 'bg-cosmic-success',
  closed: 'bg-white/20',
};

const SCOPE_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  city: { label: 'City-wide', icon: Globe2 },
  district: { label: 'District', icon: MapPin },
  organization: { label: 'Organization', icon: Building2 },
  global: { label: 'Global', icon: Globe2 },
};

function formatCurrency(cents: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

function formatTimeRemaining(endsAt: string | null): string {
  if (!endsAt) return 'Ongoing';
  const end = new Date(endsAt);
  const now = new Date();
  if (end < now) return 'Ended';
  const diff = end.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 30) return `${Math.floor(days / 30)}mo left`;
  if (days > 0) return `${days}d left`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `${hours}h left`;
}

function PhaseStepper({ currentPhase, phases: phasesJson }: { currentPhase: string; phases: string }) {
  let phases: { id: string; name: string; status: string }[] = [];
  try {
    phases = JSON.parse(phasesJson);
  } catch {
    phases = PHASE_ORDER.filter((p) => p !== 'closed').map((id) => ({
      id,
      name: PHASE_LABELS[id] || id,
      status: id === currentPhase ? 'active' : PHASE_ORDER.indexOf(id) < PHASE_ORDER.indexOf(currentPhase) ? 'completed' : 'upcoming',
    }));
  }

  const currentIndex = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div className="flex items-center gap-0 w-full overflow-hidden">
      {phases.filter((p) => p.id !== 'closed').map((phase, idx) => {
        const phaseIdx = PHASE_ORDER.indexOf(phase.id);
        const isActive = phase.id === currentPhase;
        const isCompleted = phaseIdx < currentIndex;

        return (
          <div key={phase.id} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 min-w-0 flex-shrink-0">
              <div
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isActive
                    ? `bg-cosmic-teal glow-teal scale-110`
                    : isCompleted
                    ? 'bg-cosmic-teal/60'
                    : 'bg-white/10'
                }`}
              >
                {isCompleted && (
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isActive && <Orbit className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0B1022]" />}
              </div>
              <span className={`text-[10px] sm:text-[9px] leading-tight text-center truncate max-w-[56px] sm:max-w-[48px] ${isActive ? 'text-cosmic-teal font-semibold' : isCompleted ? 'text-cosmic-muted' : 'text-white/30'}`}>
                {phase.name}
              </span>
            </div>
            {idx < phases.filter((p) => p.id !== 'closed').length - 1 && (
              <div className={`h-px flex-grow mx-0.5 ${isCompleted ? 'bg-cosmic-teal/40' : 'bg-white/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ParticipationHub() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ activeProcesses: 0, totalParticipants: 0, proposalsSubmitted: 0, budgetAllocated: 0 });
  const [filters, setFilters] = useState({ category: 'all', phase: 'all', scope: 'all', search: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchProcesses();
  }, [filters]);

  async function fetchProcesses() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category !== 'all') params.set('category', filters.category);
      if (filters.phase !== 'all') params.set('phase', filters.phase);
      if (filters.scope !== 'all') params.set('scope', filters.scope);
      params.set('status', 'active');

      const res = await fetch(`/api/participation/processes?${params}`);
      if (res.ok) {
        const data = await res.json();
        let filtered = data.processes;
        if (filters.search) {
          const q = filters.search.toLowerCase();
          filtered = filtered.filter((p: Process) =>
            p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
          );
        }
        setProcesses(filtered);
        setStats({
          activeProcesses: data.total,
          totalParticipants: filtered.reduce((s: number, p: Process) => s + p.participantCount, 0),
          proposalsSubmitted: filtered.reduce((s: number, p: Process) => s + p.proposalCount, 0),
          budgetAllocated: filtered.reduce((s: number, p: Process) => s + p.budgetAllocated, 0),
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Category group click handler
  const handleGroupClick = useCallback(
    (groupCategoryIds: string[]) => {
      if (
        filters.category !== 'all' &&
        groupCategoryIds.includes(filters.category)
      ) {
        setFilters((f) => ({ ...f, category: 'all' }));
      } else {
        setFilters((f) => ({ ...f, category: groupCategoryIds[0] }));
      }
    },
    [filters.category]
  );

  const handleCategoryChipClick = useCallback(
    (catId: string) => {
      setFilters((f) => ({ ...f, category: f.category === catId ? 'all' : catId }));
    },
    [filters.category]
  );

  // Determine which group is "active"
  const activeGroupId =
    filters.category !== 'all'
      ? CATEGORY_GROUPS.find((g) => g.categoryIds.includes(filters.category))?.id
      : null;

  return (
    <div className="space-y-4 sm:space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl glass-card-teal p-4 sm:p-6 lg:p-8">
        <div className="absolute inset-0 starfield opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="w-5 h-5 text-cosmic-teal" />
            <span className="text-cosmic-teal text-sm font-semibold tracking-wider uppercase">e-Participation Hub</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            Your Voice, Your Community,{' '}
            <span className="text-gradient">Your Power</span>
          </h1>
          <p className="text-cosmic-muted text-sm sm:text-base max-w-2xl mb-4 sm:mb-8">
            Shape the future of your community through participatory democracy. Propose ideas, deliberate with neighbors, vote on budgets, and hold leaders accountable.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {[
              { label: 'Active Processes', value: stats.activeProcesses, icon: Orbit, color: 'text-cosmic-teal' },
              { label: 'Participants', value: stats.totalParticipants, icon: Users, color: 'text-cosmic-accent' },
              { label: 'Proposals', value: stats.proposalsSubmitted, icon: FileText, color: 'text-cosmic-violet' },
              { label: 'Budget Allocated', value: formatCurrency(stats.budgetAllocated), icon: Wallet, color: 'text-cosmic-amber' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-3 sm:p-4 rounded-xl">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stat.color}`} />
                  <span className="text-[10px] sm:text-xs text-cosmic-muted">{stat.label}</span>
                </div>
                <p className={`text-lg sm:text-xl font-bold font-heading ${stat.color}`}>
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Create Process', icon: Plus, href: '#', colorClass: 'bg-cosmic-teal/10', iconColor: 'text-cosmic-teal', desc: 'Start a new participatory process' },
          { label: 'Budget Projects', icon: Wallet, href: '/dashboard/participation/budget', colorClass: 'bg-cosmic-amber/10', iconColor: 'text-cosmic-amber', desc: 'Allocate community funds' },
          { label: 'Sign Initiatives', icon: HandMetal, href: '#', colorClass: 'bg-cosmic-violet/10', iconColor: 'text-cosmic-violet', desc: 'Support citizen petitions' },
          { label: 'Join Assembly', icon: Users, href: '#', colorClass: 'bg-cosmic-accent/10', iconColor: 'text-cosmic-accent', desc: 'Participate in deliberation' },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="glass-card p-3 sm:p-4 rounded-xl hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${action.colorClass} flex items-center justify-center mb-2 sm:mb-3 transition-all`}>
              <action.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${action.iconColor}`} />
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-white mb-1">{action.label}</h3>
            <p className="text-[10px] sm:text-xs text-cosmic-muted">{action.desc}</p>
          </Link>
        ))}
      </div>

      {/* Browse by Aspect — Category Group Cards */}
      <div>
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
                  <span className="font-medium text-xs sm:text-sm text-white">{group.label}</span>
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
                    const isChipSelected = filters.category === catId;
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

      {/* Filters — Search + Category Chips + Phase + Scope */}
      <div className="space-y-3">
        {/* Search + Phase + Scope row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cosmic-muted" />
            <Input
              placeholder="Search processes..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>
          <Select value={filters.phase} onValueChange={(v) => setFilters((f) => ({ ...f, phase: v }))}>
            <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Phases</SelectItem>
              <SelectItem value="information">Information</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="deliberation">Deliberation</SelectItem>
              <SelectItem value="voting">Voting</SelectItem>
              <SelectItem value="implementation">Implementation</SelectItem>
              <SelectItem value="evaluation">Evaluation</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.scope} onValueChange={(v) => setFilters((f) => ({ ...f, scope: v }))}>
            <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scopes</SelectItem>
              <SelectItem value="city">City-wide</SelectItem>
              <SelectItem value="district">District</SelectItem>
              <SelectItem value="organization">Organization</SelectItem>
              <SelectItem value="global">Global</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter Bar — Horizontal Scrollable Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {/* All Categories chip */}
          <button
            onClick={() => setFilters((f) => ({ ...f, category: 'all' }))}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              filters.category === 'all'
                ? 'bg-white/15 text-white ring-1 ring-white/20'
                : 'bg-white/5 text-cosmic-muted hover:bg-white/10'
            }`}
          >
            <FileText className="w-3 h-3" />
            All Categories
          </button>

          {GOVERNANCE_CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            const isSelected = filters.category === cat.id;
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

      {/* Active Processes Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cosmic-teal" />
            Active Processes
          </h2>
          <span className="text-sm text-cosmic-muted">{processes.length} processes</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cosmic-teal animate-spin" />
          </div>
        ) : processes.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center">
            <Megaphone className="w-12 h-12 text-cosmic-muted/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Active Processes</h3>
            <p className="text-cosmic-muted text-sm mb-4">Be the first to start a participatory process in your community.</p>
            <Button className="bg-cosmic-teal text-[#0B1022] hover:bg-cosmic-teal/90">
              <Plus className="w-4 h-4 mr-2" /> Create New Process
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {processes.map((process) => {
              const catConfig = getCategory(resolveCategory(process.category));
              const scopeConfig = SCOPE_CONFIG[process.scope] || SCOPE_CONFIG.city;
              const ScopeIcon = scopeConfig.icon;
              const CatIcon = catConfig.icon;

              return (
                <Link key={process.id} href={`/dashboard/participation/${process.id}`}>
                  <Card className="glass-card rounded-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer group h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={`${catConfig.color} ${catConfig.bgColor} ${catConfig.borderColor} text-[10px] border`}>
                          <CatIcon className="w-3 h-3 mr-1" />
                          {catConfig.label}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-cosmic-muted">
                          <ScopeIcon className="w-3 h-3" />
                          {scopeConfig.label}
                        </div>
                      </div>
                      <h3 className="text-base font-semibold text-white group-hover:text-cosmic-teal transition-colors line-clamp-2">
                        {process.title}
                      </h3>
                      {process.shortDescription && (
                        <p className="text-xs text-cosmic-muted line-clamp-2 mt-1">
                          {process.shortDescription}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Phase Stepper */}
                      <PhaseStepper currentPhase={process.currentPhase} phases={process.phases} />

                      {/* Current Phase Badge */}
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${PHASE_COLORS[process.currentPhase]} ${process.currentPhase !== 'closed' ? 'animate-pulse' : ''}`} />
                        <span className="text-xs text-cosmic-muted">
                          Current: <span className="text-white font-medium">{PHASE_LABELS[process.currentPhase]}</span>
                        </span>
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <div className="flex items-center gap-1 text-xs text-cosmic-muted">
                            <Users className="w-3.5 h-3.5" />
                            {process.participantCount}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-cosmic-muted">
                            <FileText className="w-3.5 h-3.5" />
                            {process.proposalCount}
                          </div>
                          {process.totalBudget > 0 && (
                            <div className="flex items-center gap-1 text-xs text-cosmic-amber">
                              <Wallet className="w-3.5 h-3.5" />
                              {formatCurrency(process.budgetAllocated, process.currency)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-cosmic-muted">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTimeRemaining(process.endsAt)}
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="flex items-center text-xs text-cosmic-teal font-medium group-hover:gap-2 transition-all">
                        Participate Now <ArrowRight className="w-3 h-3 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
