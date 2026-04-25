'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  FileSignature,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  Users,
  PenTool,
  Target,
  Sparkles,
  TrendingUp,
  Clock,
  Share2,
  ChevronRight,
  Zap,
  Layers,
  Building2,
} from 'lucide-react';
import { GOVERNANCE_CATEGORIES, getCategory, resolveCategory } from '@/lib/categories';

interface Initiative {
  id: string;
  title: string;
  description: string;
  type: string;
  signatureGoal: number;
  signatureCount: number;
  status: string;
  governmentResponse: string | null;
  closesAt: string | null;
  createdAt: string;
  createdBy: string;
  creator: { id: string; name: string | null; avatarUrl: string | null };
  signatures: { id: string; comment: string | null; createdAt: string; user: { id: string; name: string | null } }[];
  _count: { signatures: number };
}

interface Stats {
  activeInitiatives: number;
  totalSignatures: number;
  thresholdsReached: number;
  enactedPolicies: number;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  petition: { label: 'Petition', color: 'text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20', icon: PenTool },
  referendum: { label: 'Referendum', color: 'text-cosmic-violet bg-cosmic-violet/10 border-cosmic-violet/20', icon: FileSignature },
  recall: { label: 'Recall', color: 'text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20', icon: Target },
  proposal: { label: 'Proposal', color: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20', icon: Sparkles },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  collecting: { label: 'Collecting', color: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20' },
  threshold_reached: { label: 'Threshold Reached', color: 'text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20' },
  government_response: { label: 'Gov. Response', color: 'text-cosmic-accent bg-cosmic-accent/10 border-cosmic-accent/20' },
  voting: { label: 'Voting', color: 'text-cosmic-violet bg-cosmic-violet/10 border-cosmic-violet/20' },
  enacted: { label: 'Enacted', color: 'text-cosmic-success bg-cosmic-success/10 border-cosmic-success/20' },
  rejected: { label: 'Rejected', color: 'text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20' },
  expired: { label: 'Expired', color: 'text-cosmic-muted bg-white/5 border-white/10' },
};

/**
 * Keywords for client-side category matching.
 * Used when the DB doesn't have a native `category` field on CitizenInitiative.
 * Matches against initiative title + description text.
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  social: ['community', 'housing', 'welfare', 'equality', 'social', 'poverty', 'inclusion', 'disability', 'elderly', 'youth', 'family', 'refugee', 'minority', 'rights'],
  environment: ['climate', 'green', 'sustainability', 'pollution', 'environment', 'carbon', 'renewable', 'energy', 'waste', 'recycling', 'emissions', 'biodiversity', 'conservation', 'water'],
  political: ['governance', 'transparency', 'voting', 'election', 'reform', 'democracy', 'accountability', 'corruption', 'institution', 'political', 'civic', 'participation', 'representation'],
  economic: ['budget', 'tax', 'taxation', 'economic', 'employment', 'jobs', 'industry', 'trade', 'investment', 'revenue', 'fiscal', 'gdp', 'inflation', 'business', 'entrepreneur'],
  infrastructure: ['urban', 'transport', 'transit', 'road', 'bridge', 'highway', 'utility', 'public works', 'infrastructure', 'planning', 'zoning', 'construction', 'housing development', 'water supply', 'sewage'],
  education: ['school', 'education', 'training', 'research', 'literacy', 'university', 'college', 'student', 'teacher', 'curriculum', 'scholarship', 'digital literacy', 'academic'],
  health: ['health', 'healthcare', 'hospital', 'mental health', 'wellness', 'disease', 'medical', 'pharmaceutical', 'vaccination', 'nutrition', 'public health', 'safety', 'pandemic'],
  culture: ['arts', 'culture', 'heritage', 'sports', 'recreation', 'museum', 'library', 'festival', 'creative', 'music', 'theater', 'art', 'cultural', 'historical preservation'],
  technology: ['digital', 'technology', 'innovation', 'open data', 'connectivity', 'internet', 'software', 'ai', 'artificial intelligence', 'smart city', 'cybersecurity', 'broadband', 'tech', 'automation'],
  security: ['security', 'safety', 'emergency', 'police', 'justice', 'defense', 'crime', 'law enforcement', 'fire', 'disaster', 'terrorism', 'border', 'military', 'public safety'],
};

/**
 * Determine the best-matching category for an initiative based on its text content.
 * Returns the category ID or null if no strong match is found.
 */
function inferCategoryFromText(title: string, description: string): string | null {
  const text = `${title} ${description}`.toLowerCase();
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const [categoryId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += keyword.length; // longer keyword matches are worth more
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = categoryId;
    }
  }

  // Only return a match if there's at least one keyword hit
  return bestScore > 0 ? bestMatch : null;
}

export default function InitiativesPage() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [stats, setStats] = useState<Stats>({ activeInitiatives: 0, totalSignatures: 0, thresholdsReached: 0, enactedPolicies: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: 'all', status: 'all', sort: 'newest', search: '' });
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Sign dialog
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);
  const [signComment, setSignComment] = useState('');
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [thresholdJustReached, setThresholdJustReached] = useState(false);

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    type: 'petition',
    signatureGoal: 1000,
    closesAt: '',
    category: 'social',
  });
  const [creating, setCreating] = useState(false);

  const fetchInitiatives = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.set('type', filters.type);
      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.sort) params.set('sort', filters.sort);
      if (filters.search) params.set('search', filters.search);

      const res = await fetch(`/api/participation/initiatives?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInitiatives(data.initiatives);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchInitiatives(); }, [fetchInitiatives]);

  // Apply client-side category filtering
  const filteredInitiatives = useMemo(() => {
    if (categoryFilter === 'all') return initiatives;
    return initiatives.filter((initiative) => {
      const inferred = inferCategoryFromText(initiative.title, initiative.description);
      return inferred === categoryFilter;
    });
  }, [initiatives, categoryFilter]);

  const handleSign = async () => {
    if (!selectedInitiative) return;
    setSigning(true);
    try {
      const res = await fetch(`/api/participation/initiatives/${selectedInitiative.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: signComment }),
      });
      if (res.ok) {
        const data = await res.json();
        setSigned(true);
        if (data.thresholdReached) setThresholdJustReached(true);
        fetchInitiatives();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to sign');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSigning(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.title || !createForm.description) return;
    setCreating(true);
    try {
      const res = await fetch('/api/participation/initiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        setCreateDialogOpen(false);
        setCreateForm({ title: '', description: '', type: 'petition', signatureGoal: 1000, closesAt: '', category: 'social' });
        fetchInitiatives();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create initiative');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const openSignDialog = (initiative: Initiative) => {
    setSelectedInitiative(initiative);
    setSignComment('');
    setSigned(false);
    setThresholdJustReached(false);
    setSignDialogOpen(true);
  };

  const progressPercent = (count: number, goal: number) => Math.min(Math.round((count / goal) * 100), 100);

  return (
    <div className="space-y-4 sm:space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl glass-card-violet p-4 sm:p-6 lg:p-8">
        <div className="absolute inset-0 starfield opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-cosmic-violet" />
            <span className="text-cosmic-violet text-sm font-semibold tracking-wider uppercase">Citizen Initiatives</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            Power to the{' '}
            <span className="text-gradient">People</span>
          </h1>
          <p className="text-cosmic-muted text-sm sm:text-base max-w-2xl mb-4 sm:mb-8">
            When signatures reach the threshold, the government MUST respond. This is real democratic power — create or sign initiatives that force action.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {[
              { label: 'Active Initiatives', value: stats.activeInitiatives, icon: FileSignature, color: 'text-cosmic-teal' },
              { label: 'Total Signatures', value: stats.totalSignatures, icon: PenTool, color: 'text-cosmic-violet' },
              { label: 'Thresholds Reached', value: stats.thresholdsReached, icon: Target, color: 'text-cosmic-amber' },
              { label: 'Enacted Policies', value: stats.enactedPolicies, icon: CheckCircle2, color: 'text-cosmic-success' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-3 sm:p-4 rounded-xl">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stat.color}`} />
                  <span className="text-[10px] sm:text-xs text-cosmic-muted">{stat.label}</span>
                </div>
                <p className={`text-lg sm:text-xl font-bold font-heading ${stat.color}`}>
                  {stat.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-cosmic-muted" />
          <span className="text-sm text-cosmic-muted font-medium">Browse by Category</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent -mx-1 px-1">
          {/* All Categories chip */}
          <button
            onClick={() => setCategoryFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 border ${
              categoryFilter === 'all'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-white/5 text-cosmic-muted border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All Categories
          </button>
          {GOVERNANCE_CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(isSelected ? 'all' : cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 border ${
                  isSelected
                    ? `${cat.bgColor} ${cat.color} ${cat.borderColor} ring-1 ring-current/20`
                    : 'bg-white/5 text-cosmic-muted border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <CatIcon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-grow w-full sm:w-auto">
          <div className="relative flex-grow w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cosmic-muted" />
            <Input
              placeholder="Search initiatives..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>
          <Select value={filters.type} onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))}>
            <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="petition">Petition</SelectItem>
              <SelectItem value="referendum">Referendum</SelectItem>
              <SelectItem value="recall">Recall</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
            <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="collecting">Collecting</SelectItem>
              <SelectItem value="threshold_reached">Threshold Reached</SelectItem>
              <SelectItem value="government_response">Gov. Response</SelectItem>
              <SelectItem value="voting">Voting</SelectItem>
              <SelectItem value="enacted">Enacted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.sort} onValueChange={(v) => setFilters((f) => ({ ...f, sort: v }))}>
            <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="most_signed">Most Signed</SelectItem>
              <SelectItem value="closing_soon">Closing Soon</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          className="bg-cosmic-violet text-white hover:bg-cosmic-violet/90 shrink-0"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Launch Initiative
        </Button>
      </div>

      {/* Active Filter Indicator */}
      {categoryFilter !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-cosmic-muted">Filtered by:</span>
          {(() => {
            const cat = getCategory(categoryFilter);
            const CatIcon = cat.icon;
            return (
              <Badge className={`${cat.bgColor} ${cat.color} ${cat.borderColor} border text-xs`}>
                <CatIcon className="w-3 h-3 mr-1" />
                {cat.label}
              </Badge>
            );
          })()}
          <button
            onClick={() => setCategoryFilter('all')}
            className="text-xs text-cosmic-muted hover:text-white transition-colors underline underline-offset-2"
          >
            Clear
          </button>
          <span className="text-xs text-cosmic-muted ml-2">
            {filteredInitiatives.length} result{filteredInitiatives.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Initiative Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-cosmic-violet animate-spin" />
        </div>
      ) : filteredInitiatives.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <FileSignature className="w-12 h-12 text-cosmic-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {categoryFilter !== 'all' ? 'No Matching Initiatives' : 'No Initiatives Yet'}
          </h3>
          <p className="text-cosmic-muted text-sm mb-4">
            {categoryFilter !== 'all'
              ? `No initiatives found for the "${getCategory(categoryFilter).label}" category. Try another category or clear the filter.`
              : 'Be the first to launch an initiative and rally your community.'}
          </p>
          {categoryFilter !== 'all' ? (
            <Button
              className="bg-white/10 text-white hover:bg-white/20"
              onClick={() => setCategoryFilter('all')}
            >
              Clear Category Filter
            </Button>
          ) : (
            <Button className="bg-cosmic-violet text-white hover:bg-cosmic-violet/90" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Launch Initiative
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {filteredInitiatives.map((initiative) => {
            const typeConfig = TYPE_CONFIG[initiative.type] || TYPE_CONFIG.petition;
            const statusConfig = STATUS_CONFIG[initiative.status] || STATUS_CONFIG.collecting;
            const progress = progressPercent(initiative.signatureCount, initiative.signatureGoal);
            const isThresholdReached = initiative.status !== 'collecting' && initiative.status !== 'expired' && initiative.status !== 'rejected';
            const TypeIcon = typeConfig.icon;

            // Infer category for display badge
            const inferredCategoryId = inferCategoryFromText(initiative.title, initiative.description);
            const categoryConfig = inferredCategoryId ? getCategory(inferredCategoryId) : null;
            const CategoryIcon = categoryConfig?.icon;

            return (
              <Card
                key={initiative.id}
                className={`glass-card rounded-2xl hover:scale-[1.01] transition-all duration-300 group h-full ${
                  isThresholdReached ? 'ring-1 ring-cosmic-teal/30' : ''
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between mb-2 flex-wrap gap-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-grow">
                      <Badge className={`${typeConfig.color} text-[10px] border`}>
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {typeConfig.label}
                      </Badge>
                      {categoryConfig && CategoryIcon && (
                        <Badge className={`${categoryConfig.bgColor} ${categoryConfig.color} ${categoryConfig.borderColor} border text-[10px]`}>
                          <CategoryIcon className="w-3 h-3 mr-1" />
                          {categoryConfig.label}
                        </Badge>
                      )}
                    </div>
                    <Badge className={`${statusConfig.color} text-[10px] border`}>
                      {statusConfig.label}
                    </Badge>
                    {initiative.governmentResponse && (
                      <Badge className="text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20 text-[10px] border">
                        <Building2 className="w-3 h-3 mr-0.5" />
                        Gov Responded
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-white group-hover:text-cosmic-teal transition-colors line-clamp-2">
                    {initiative.title}
                  </h3>
                  <p className="text-xs text-cosmic-muted line-clamp-2 mt-1">
                    {initiative.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Signature Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-cosmic-muted flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {initiative.signatureCount.toLocaleString()} / {initiative.signatureGoal.toLocaleString()} signatures
                      </span>
                      <span className={`font-medium ${isThresholdReached ? 'text-cosmic-teal' : 'text-cosmic-muted'}`}>
                        {progress}%
                      </span>
                    </div>
                    <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          isThresholdReached
                            ? 'bg-gradient-to-r from-cosmic-teal to-cosmic-success'
                            : progress >= 75
                            ? 'bg-gradient-to-r from-cosmic-amber to-cosmic-teal'
                            : 'bg-gradient-to-r from-cosmic-violet to-cosmic-accent'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                      {isThresholdReached && (
                        <div className="absolute inset-0 rounded-full animate-pulse opacity-30 bg-cosmic-teal" />
                      )}
                    </div>
                    {isThresholdReached && !initiative.governmentResponse && (
                      <div className="flex items-center gap-1.5 text-xs text-cosmic-teal font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Threshold Reached! Awaiting Response
                      </div>
                    )}
                    {initiative.governmentResponse && (
                      <div className="glass-card p-3 rounded-xl bg-cosmic-teal/5 border border-cosmic-teal/15 mt-1">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Badge className="text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20 text-[9px] border">
                            <Building2 className="w-2.5 h-2.5 mr-0.5" />
                            Official Response
                          </Badge>
                        </div>
                        <p className="text-xs text-white/90 line-clamp-3 whitespace-pre-wrap">{initiative.governmentResponse}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-cosmic-muted">
                      <div className="w-5 h-5 rounded-full bg-cosmic-violet/20 flex items-center justify-center text-[9px] font-bold text-cosmic-violet">
                        {(initiative.creator.name || 'U')[0].toUpperCase()}
                      </div>
                      {initiative.creator.name || 'Anonymous'}
                    </div>
                    {initiative.closesAt && (
                      <div className="flex items-center gap-1 text-xs text-cosmic-muted">
                        <Clock className="w-3 h-3" />
                        {new Date(initiative.closesAt) > new Date()
                          ? `${Math.ceil((new Date(initiative.closesAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d left`
                          : 'Closed'}
                      </div>
                    )}
                  </div>

                  {/* Sign Button */}
                  <Button
                    className={`w-full ${
                      isThresholdReached
                        ? 'bg-cosmic-teal/10 text-cosmic-teal border border-cosmic-teal/20 hover:bg-cosmic-teal/20'
                        : 'bg-cosmic-violet/10 text-cosmic-violet border border-cosmic-violet/20 hover:bg-cosmic-violet/20'
                    }`}
                    variant="ghost"
                    onClick={() => openSignDialog(initiative)}
                  >
                    <PenTool className="w-4 h-4 mr-2" />
                    Sign This Initiative
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sign Initiative Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="bg-[#0B1022] border-white/10 text-white max-w-lg">
          {selectedInitiative && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-cosmic-violet" />
                  Sign This Initiative
                </DialogTitle>
                <DialogDescription className="text-cosmic-muted">
                  Add your voice to force government response
                </DialogDescription>
              </DialogHeader>

              {!signed ? (
                <div className="space-y-4">
                  <div className="glass-card p-4 rounded-xl">
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      <Badge className={`${TYPE_CONFIG[selectedInitiative.type]?.color || ''} text-[10px] border`}>
                        {TYPE_CONFIG[selectedInitiative.type]?.label || selectedInitiative.type}
                      </Badge>
                      {(() => {
                        const selCatId = inferCategoryFromText(selectedInitiative.title, selectedInitiative.description);
                        const selCat = selCatId ? getCategory(selCatId) : null;
                        const SelCatIcon = selCat?.icon;
                        if (selCat && SelCatIcon) {
                          return (
                            <Badge className={`${selCat.bgColor} ${selCat.color} ${selCat.borderColor} border text-[10px]`}>
                              <SelCatIcon className="w-3 h-3 mr-1" />
                              {selCat.label}
                            </Badge>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <h3 className="text-white font-semibold mb-1">{selectedInitiative.title}</h3>
                    <p className="text-sm text-cosmic-muted line-clamp-3">{selectedInitiative.description}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-grow">
                        <Progress
                          value={progressPercent(selectedInitiative.signatureCount, selectedInitiative.signatureGoal)}
                          className="h-2 bg-white/5"
                        />
                      </div>
                      <span className="text-xs text-cosmic-muted whitespace-nowrap">
                        {selectedInitiative.signatureCount}/{selectedInitiative.signatureGoal}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-cosmic-muted mb-1 block">Why are you signing? (optional)</label>
                    <Textarea
                      placeholder="Share your reason for supporting this initiative..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 min-h-[80px]"
                      value={signComment}
                      onChange={(e) => setSignComment(e.target.value)}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      variant="ghost"
                      className="text-cosmic-muted hover:text-white"
                      onClick={() => setSignDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-cosmic-violet text-white hover:bg-cosmic-violet/90"
                      onClick={handleSign}
                      disabled={signing}
                    >
                      {signing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PenTool className="w-4 h-4 mr-2" />}
                      Sign Initiative
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${thresholdJustReached ? 'bg-cosmic-teal/20 glow-teal' : 'bg-cosmic-success/20'}`}>
                    <CheckCircle2 className={`w-8 h-8 ${thresholdJustReached ? 'text-cosmic-teal' : 'text-cosmic-success'}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white">You&apos;ve Signed!</h3>
                  <p className="text-cosmic-muted text-sm">
                    {thresholdJustReached
                      ? '🎉 Threshold Reached! This initiative now requires a government response.'
                      : 'Share this initiative to help reach the threshold.'}
                  </p>
                  {thresholdJustReached && (
                    <div className="glass-card-teal p-4 rounded-xl">
                      <p className="text-cosmic-teal text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        The government must now respond!
                      </p>
                    </div>
                  )}
                  <Button
                    className="bg-cosmic-violet/10 text-cosmic-violet border border-cosmic-violet/20 hover:bg-cosmic-violet/20"
                    variant="ghost"
                    onClick={() => setSignDialogOpen(false)}
                  >
                    <Share2 className="w-4 h-4 mr-2" /> Share to Help Reach Threshold
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Initiative Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#0B1022] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cosmic-amber" />
              Launch New Initiative
            </DialogTitle>
            <DialogDescription className="text-cosmic-muted">
              Start a citizen initiative that forces government response
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Title *</label>
              <Input
                placeholder="What change do you want to see?"
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Description *</label>
              <Textarea
                placeholder="Describe the initiative in detail. What problem does it address? What solution are you proposing?"
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 min-h-[100px]"
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Category</label>
              <Select value={createForm.category} onValueChange={(v) => setCreateForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOVERNANCE_CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <CatIcon className={`w-4 h-4 ${cat.color}`} />
                          {cat.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Type</label>
                <Select value={createForm.type} onValueChange={(v) => setCreateForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petition">Petition</SelectItem>
                    <SelectItem value="referendum">Referendum</SelectItem>
                    <SelectItem value="recall">Recall</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Signature Goal</label>
                <Input
                  type="number"
                  min={10}
                  max={100000}
                  className="bg-white/5 border-white/10 text-white"
                  value={createForm.signatureGoal}
                  onChange={(e) => setCreateForm((f) => ({ ...f, signatureGoal: parseInt(e.target.value) || 1000 }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Closing Date</label>
              <Input
                type="datetime-local"
                className="bg-white/5 border-white/10 text-white"
                value={createForm.closesAt}
                onChange={(e) => setCreateForm((f) => ({ ...f, closesAt: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              className="text-cosmic-muted hover:text-white"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-cosmic-violet text-white hover:bg-cosmic-violet/90"
              onClick={handleCreate}
              disabled={creating || !createForm.title || !createForm.description}
            >
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              Launch Initiative
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
