'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StartProcessDialog from '@/components/StartProcessDialog';
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
  ArrowUpRight,
  Sparkles,
  Orbit,
  ClipboardList,
  Dices,
  Eye,
  PenLine,
  Scale,
  Vote,
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

// What people come here to do, in their words, and the tool made for it.
const intents = [
  {
    want: 'Get something done',
    tool: 'Mission studio',
    copy: 'Bring a goal. Get help researching it, planning it and gathering what you need.',
    href: '/dashboard/missions',
    icon: Sparkles,
    tint: 'sun',
  },
  {
    want: 'Decide something together',
    tool: 'Proposals & voting',
    copy: 'Put a question to your group, discuss it, and vote with the rules in view.',
    href: '/dashboard/proposals',
    icon: Vote,
    tint: 'lilac',
  },
  {
    want: 'Share out a budget',
    tool: 'Budgets',
    copy: 'Let people propose projects and choose where the money goes.',
    href: '/dashboard/participation/budget',
    icon: Wallet,
    tint: 'mint',
  },
  {
    want: 'Ask what people think',
    tool: 'Surveys & polls',
    copy: 'A few quick questions when you need a sense of the room.',
    href: '/dashboard/participation/surveys',
    icon: ClipboardList,
    tint: 'sky',
  },
  {
    want: 'Gather support for an idea',
    tool: 'Initiatives',
    copy: 'Collect signatures to show an idea has backing.',
    href: '/dashboard/participation/initiatives',
    icon: PenLine,
    tint: 'peach',
  },
  {
    want: 'Talk it through',
    tool: 'Assemblies',
    copy: 'Bring people together to discuss before anything is decided.',
    href: '/dashboard/participation/assemblies',
    icon: Users,
    tint: 'lilac',
  },
  {
    want: 'Pick a panel by lottery',
    tool: 'Sortition',
    copy: 'Draw a small group at random to look closely at a question.',
    href: '/dashboard/participation/sortition',
    icon: Dices,
    tint: 'sun',
  },
  {
    want: 'Shape a rule or policy',
    tool: 'Legislation',
    copy: 'Read a draft text, comment on it, and suggest changes.',
    href: '/dashboard/participation/legislation',
    icon: Scale,
    tint: 'sky',
  },
  {
    want: 'See what happened next',
    tool: 'Accountability',
    copy: 'Follow what was promised and what has been done.',
    href: '/dashboard/participation/accountability',
    icon: Eye,
    tint: 'mint',
  },
];

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
  closed: 'bg-foreground/20',
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
                    : 'bg-foreground/10'
                }`}
              >
                {isCompleted && (
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isActive && <Orbit className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-foreground" />}
              </div>
              <span className={`text-[10px] sm:text-[9px] leading-tight text-center truncate max-w-[56px] sm:max-w-[48px] ${isActive ? 'text-cosmic-teal font-semibold' : isCompleted ? 'text-cosmic-muted' : 'text-foreground/30'}`}>
                {phase.name}
              </span>
            </div>
            {idx < phases.filter((p) => p.id !== 'closed').length - 1 && (
              <div className={`h-px flex-grow mx-0.5 ${isCompleted ? 'bg-cosmic-teal/40' : 'bg-foreground/10'}`} />
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
      <div className="app-page-heading">
        <div>
          <div className="eyebrow">
            <span className="status-dot" /> MORE THAN A VOTE
          </div>
          <h1>What do you want to do together?</h1>
          <p>Pick what you’re trying to do. Each card opens the tool made for it.</p>
        </div>
        <button className="civic-button" onClick={() => setShowCreateModal(true)}>
          <Plus size={15} />
          Start a process
        </button>
      </div>

      <ul className="intent-grid">
        {intents.map((intent) => (
          <li key={intent.want}>
            <Link href={intent.href} className={`intent-card tint-${intent.tint}`}>
              <span className="intent-icon">
                <intent.icon size={22} aria-hidden="true" />
              </span>
              <strong>{intent.want}</strong>
              <span>{intent.copy}</span>
              <small>
                {intent.tool} <ArrowUpRight size={14} aria-hidden="true" />
              </small>
            </Link>
          </li>
        ))}
      </ul>

      <StartProcessDialog open={showCreateModal} onOpenChange={setShowCreateModal} />

      <div className="intent-divider">
        <h2>Or join a process that’s already under way</h2>
        <p>A process is a longer piece of shared work with stages, from first ideas to a decision.</p>
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
                    : 'border-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <GroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-cosmic-accent" />
                  <span className="font-medium text-xs sm:text-sm text-foreground">{group.label}</span>
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
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-foreground transition-all cursor-pointer ${cat.bgColor} ${
                          isChipSelected
                            ? `ring-2 ring-foreground ${cat.bgColor.replace('/10', '/25')}`
                            : ''
                        }`}
                      >
                        <CatIcon className={`w-3 h-3 ${cat.color}`} />
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
              className="pl-10 bg-foreground/5 border-border text-foreground placeholder:text-cosmic-muted/50"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>
          <Select value={filters.phase} onValueChange={(v) => setFilters((f) => ({ ...f, phase: v }))}>
            <SelectTrigger aria-label="Phase" className="w-full sm:w-44 bg-foreground/5 border-border text-foreground">
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
            <SelectTrigger aria-label="Scope" className="w-full sm:w-40 bg-foreground/5 border-border text-foreground">
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
                ? 'bg-foreground/15 text-foreground ring-1 ring-foreground/20'
                : 'bg-foreground/5 text-cosmic-muted hover:bg-foreground/10'
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
                aria-pressed={isSelected}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-foreground whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? `${cat.bgColor.replace('/10', '/25')} ring-2 ring-foreground`
                    : `${cat.bgColor} hover:ring-1 hover:ring-foreground/40`
                }`}
              >
                <CatIcon className={`w-3.5 h-3.5 ${cat.color}`} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Processes Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cosmic-teal" />
            Processes under way
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
            <h3 className="text-lg font-semibold text-foreground mb-2">Nothing under way yet</h3>
            <p className="text-foreground text-sm mb-4">Start a process when a piece of shared work needs stages and time.</p>
            <button className="civic-button outline" onClick={() => setShowCreateModal(true)}>
              <Plus size={15} /> Start the first one
            </button>
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
                      <h3 className="text-base font-semibold text-foreground group-hover:text-cosmic-teal transition-colors line-clamp-2">
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
                          Current: <span className="text-foreground font-medium">{PHASE_LABELS[process.currentPhase]}</span>
                        </span>
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
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
