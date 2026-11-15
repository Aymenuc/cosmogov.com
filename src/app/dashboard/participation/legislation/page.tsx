'use client';

import WorkspaceHeading, { ToolEmpty } from "@/components/WorkspaceHeading";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  ScrollArea,
} from '@/components/ui/scroll-area';
import {
  FileText,
  Plus,
  Search,
  Loader2,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  GitPullRequest,
  CheckCircle2,
  Sparkles,
  Scale,
  Landmark,
  ChevronRight,
  Clock,
  User,
} from 'lucide-react';
import { GOVERNANCE_CATEGORIES, getCategory, resolveCategory } from '@/lib/categories';

interface LegislationItem {
  id: string;
  title: string;
  description: string;
  billNumber: string | null;
  status: string;
  category: string | null;
  sponsorName: string | null;
  sponsorId: string | null;
  commentCount: number;
  supportCount: number;
  opposeCount: number;
  amendmentCount: number;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  creator: { id: string; name: string | null; avatarUrl: string | null };
  _count: { comments: number; amendments: number; votes: number };
  voteSupportCount: number;
  voteOpposeCount: number;
}

interface Stats {
  totalBills: number;
  inPublicComment: number;
  amendmentsSubmitted: number;
  enacted: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'text-cosmic-muted bg-foreground/10 border-border', icon: FileText },
  review: { label: 'In Review', color: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20', icon: Clock },
  public_comment: { label: 'Public Comment', color: 'text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20', icon: MessageSquare },
  amendment: { label: 'Amendment', color: 'text-cosmic-violet bg-cosmic-violet/10 border-cosmic-violet/20', icon: GitPullRequest },
  voting: { label: 'Voting', color: 'text-cosmic-accent bg-cosmic-accent/10 border-cosmic-accent/20', icon: ThumbsUp },
  passed: { label: 'Passed', color: 'text-cosmic-success bg-cosmic-success/10 border-cosmic-success/20', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20', icon: ThumbsDown },
  enacted: { label: 'Enacted', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: Landmark },
};

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'public_comment', label: 'Public Comment' },
  { key: 'voting', label: 'Voting' },
  { key: 'enacted', label: 'Enacted' },
];

export default function LegislationPage() {
  const [legislation, setLegislation] = useState<LegislationItem[]>([]);
  const [stats, setStats] = useState<Stats>({ totalBills: 0, inPublicComment: 0, amendmentsSubmitted: 0, enacted: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    billNumber: '',
    category: '',
    sponsorName: '',
    fullText: '',
    quorumRequired: 100,
  });
  const [creating, setCreating] = useState(false);

  const fetchLegislation = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/legislation?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLegislation(data.legislation);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, search]);

  useEffect(() => { fetchLegislation(); }, [fetchLegislation]);

  const handleCreate = async () => {
    if (!createForm.title || !createForm.description) return;
    setCreating(true);
    try {
      const res = await fetch('/api/legislation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        setCreateDialogOpen(false);
        setCreateForm({ title: '', description: '', billNumber: '', category: '', sponsorName: '', fullText: '', quorumRequired: 100 });
        fetchLegislation();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create legislation');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  function VoteRatio({ support, oppose }: { support: number; oppose: number }) {
    const total = support + oppose;
    if (total === 0) return <span className="text-cosmic-muted text-xs">No votes yet</span>;
    const supportPct = Math.round((support / total) * 100);
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-foreground/5 rounded-full overflow-hidden max-w-[80px]">
          <div className="h-full bg-cosmic-teal rounded-full" style={{ width: `${supportPct}%` }} />
        </div>
        <span className="text-[10px] text-cosmic-teal">{support}</span>
        <span className="text-[10px] text-cosmic-muted">/</span>
        <span className="text-[10px] text-cosmic-rose">{oppose}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <WorkspaceHeading
        look="legislation"
        title="Legislation"
        description="Follow proposed legislation, discuss drafts, and contribute amendments or votes when those stages are open."
        back={{ href: "/dashboard/participation", label: "Explore participation" }}
      >
        <button type="button" className="civic-button" onClick={() => setCreateDialogOpen(true)}>
          <Plus size={16} aria-hidden="true" /> Propose legislation
        </button>
      </WorkspaceHeading>

      <div className="workspace-tool-stats">
        {[
          { label: 'Total Bills', value: stats.totalBills, icon: FileText, color: 'text-cosmic-amber' },
          { label: 'In Public Comment', value: stats.inPublicComment, icon: MessageSquare, color: 'text-cosmic-teal' },
          { label: 'Amendments', value: stats.amendmentsSubmitted, icon: GitPullRequest, color: 'text-cosmic-violet' },
          { label: 'Enacted', value: stats.enacted, icon: CheckCircle2, color: 'text-cosmic-success' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-3 sm:p-4 rounded-xl">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stat.color}`} />
              <span className="text-xs text-cosmic-muted">{stat.label}</span>
            </div>
            <p className={`text-lg sm:text-xl font-bold font-heading ${stat.color}`}>
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent -mx-1 px-1">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.key;
          const TabIcon = tab.key !== 'all' ? STATUS_CONFIG[tab.key]?.icon : null;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 border ${
                isActive
                  ? 'bg-cosmic-amber/20 text-cosmic-amber border-cosmic-amber/30'
                  : 'bg-foreground/5 text-cosmic-muted border-border hover:bg-foreground/10 hover:text-foreground'
              }`}
            >
              {TabIcon && <TabIcon className="w-3 h-3" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Category Filter Chips + Search + Create */}
      <div className="space-y-3">
        {/* Search + Create row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative flex-grow w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cosmic-muted" />
            <Input
              placeholder="Search legislation..."
              className="pl-10 bg-foreground/5 border-border text-foreground placeholder:text-cosmic-muted/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent -mx-1 px-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 border ${
              categoryFilter === 'all'
                ? 'bg-foreground/15 text-foreground border-border'
                : 'bg-foreground/5 text-cosmic-muted border-border hover:bg-foreground/10 hover:text-foreground'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
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
                    : 'bg-foreground/5 text-cosmic-muted border-border hover:bg-foreground/10 hover:text-foreground'
                }`}
              >
                <CatIcon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legislation Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-cosmic-amber animate-spin" />
        </div>
      ) : legislation.length === 0 ? (
        statusFilter !== 'all' || categoryFilter !== 'all' ? (
          <div className="glass-card p-12 rounded-2xl text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Nothing matches these filters</h3>
            <p className="text-cosmic-muted text-sm">Try another status or category.</p>
          </div>
        ) : (
          <ToolEmpty look="legislation">
            <Button className="civic-button" onClick={() => setCreateDialogOpen(true)}>
              <Plus size={16} aria-hidden="true" /> Propose legislation
            </Button>
          </ToolEmpty>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {legislation.map((bill) => {
            const statusCfg = STATUS_CONFIG[bill.status] || STATUS_CONFIG.draft;
            const StatusIcon = statusCfg.icon;
            const categoryCfg = getCategory(resolveCategory(bill.category));
            const CategoryIcon = categoryCfg.icon;

            return (
              <Link key={bill.id} href={`/dashboard/participation/legislation/${bill.id}`}>
                <Card className="glass-card rounded-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer group h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between mb-2 flex-wrap gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-grow">
                        {bill.billNumber && (
                          <Badge className="text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20 text-[10px] border font-mono">
                            {bill.billNumber}
                          </Badge>
                        )}
                        <Badge className={`${categoryCfg.color} ${categoryCfg.bgColor} ${categoryCfg.borderColor} text-[10px] border`}>
                          <CategoryIcon className="w-3 h-3 mr-1" />
                          {categoryCfg.label}
                        </Badge>
                      </div>
                      <Badge className={`${statusCfg.color} text-[10px] border`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <h3 className="text-base font-semibold text-foreground group-hover:text-cosmic-amber transition-colors line-clamp-2">
                      {bill.title}
                    </h3>
                    <p className="text-xs text-cosmic-muted line-clamp-2 mt-1">
                      {bill.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Sponsor */}
                    {bill.sponsorName && (
                      <div className="flex items-center gap-1.5 text-xs text-cosmic-muted">
                        <User className="w-3 h-3" />
                        Sponsored by <span className="text-foreground">{bill.sponsorName}</span>
                      </div>
                    )}

                    {/* Vote Ratio */}
                    <VoteRatio support={bill.voteSupportCount} oppose={bill.voteOpposeCount} />

                    {/* Footer Stats */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs text-cosmic-muted">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {bill._count.comments}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-cosmic-muted">
                          <GitPullRequest className="w-3.5 h-3.5" />
                          {bill._count.amendments}
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-cosmic-amber font-medium group-hover:gap-2 transition-all">
                        View Bill <ChevronRight className="w-3 h-3 ml-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Legislation Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cosmic-amber" />
              Propose New Legislation
            </DialogTitle>
            <DialogDescription className="text-cosmic-muted">
              Draft a new bill for community review and deliberation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Bill Number (optional)</label>
                <Input
                  placeholder="e.g., HB-2026-042"
                  className="bg-foreground/5 border-border text-foreground placeholder:text-cosmic-muted/50 font-mono"
                  value={createForm.billNumber}
                  onChange={(e) => setCreateForm((f) => ({ ...f, billNumber: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Category</label>
                <Select value={createForm.category} onValueChange={(v) => setCreateForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger className="bg-foreground/5 border-border text-foreground">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {GOVERNANCE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Title *</label>
              <Input
                placeholder="What is this legislation about?"
                className="bg-foreground/5 border-border text-foreground placeholder:text-cosmic-muted/50"
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Description *</label>
              <Textarea
                placeholder="Summarize the purpose and key provisions of this legislation..."
                className="bg-foreground/5 border-border text-foreground placeholder:text-cosmic-muted/50 min-h-[80px]"
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Sponsor Name</label>
              <Input
                placeholder="Who is sponsoring this bill?"
                className="bg-foreground/5 border-border text-foreground placeholder:text-cosmic-muted/50"
                value={createForm.sponsorName}
                onChange={(e) => setCreateForm((f) => ({ ...f, sponsorName: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Full Text (optional)</label>
              <Textarea
                placeholder="Paste the full legislative text here..."
                className="bg-foreground/5 border-border text-foreground placeholder:text-cosmic-muted/50 min-h-[120px] font-mono text-xs"
                value={createForm.fullText}
                onChange={(e) => setCreateForm((f) => ({ ...f, fullText: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Quorum Required</label>
              <Input
                type="number"
                min={1}
                className="bg-foreground/5 border-border text-foreground w-32"
                value={createForm.quorumRequired}
                onChange={(e) => setCreateForm((f) => ({ ...f, quorumRequired: parseInt(e.target.value) || 100 }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" className="text-cosmic-muted hover:text-foreground" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="civic-button"
              onClick={handleCreate}
              disabled={creating || !createForm.title || !createForm.description}
            >
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Propose Legislation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
