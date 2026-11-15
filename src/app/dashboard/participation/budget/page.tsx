'use client';

import WorkspaceHeading, { ToolEmpty } from "@/components/WorkspaceHeading";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Wallet, Users, Loader2, CheckCircle2, Clock,
  TreePine, Building2, GraduationCap, Heart, Zap, MapPin,
  TrendingUp, Sparkles, Map as MapIcon, Star, AlertCircle,
} from 'lucide-react';

interface BudgetProject {
  id: string;
  title: string;
  description: string;
  category: string | null;
  budgetRequested: number;
  budgetApproved: number;
  status: string;
  voteCount: number;
  createdAt: string;
  creator: { id: string; name: string | null; avatarUrl: string | null };
  process: { id: string; title: string; totalBudget: number; currency: string; currentPhase: string };
  budgetVotes: { amount: number; userId: string }[];
  totalAllocated: number;
  voterCount: number;
  _count: { budgetVotes: number; milestones: number };
}

interface BudgetPool {
  total: number;
  currency: string;
  allocated: number;
  remaining: number;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  infrastructure: { label: 'Infrastructure', icon: Building2, color: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20' },
  social: { label: 'Social', icon: Heart, color: 'text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20' },
  environment: { label: 'Environment', icon: TreePine, color: 'text-cosmic-success bg-cosmic-success/10 border-cosmic-success/20' },
  technology: { label: 'Technology', icon: Zap, color: 'text-cosmic-accent bg-cosmic-accent/10 border-cosmic-accent/20' },
  culture: { label: 'Culture', icon: Star, color: 'text-cosmic-violet bg-cosmic-violet/10 border-cosmic-violet/20' },
  health: { label: 'Health', icon: Heart, color: 'text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20' },
};

const STATUS_COLORS: Record<string, string> = {
  proposed: 'bg-foreground/10 text-cosmic-muted',
  shortlisted: 'bg-cosmic-accent/10 text-cosmic-accent',
  approved: 'bg-cosmic-success/10 text-cosmic-success',
  rejected: 'bg-cosmic-rose/10 text-cosmic-rose',
  implementing: 'bg-cosmic-amber/10 text-cosmic-amber',
  completed: 'bg-cosmic-teal/10 text-cosmic-teal',
};

function formatCurrency(cents: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export default function BudgetPage() {
  const [projects, setProjects] = useState<BudgetProject[]>([]);
  const [budgetPool, setBudgetPool] = useState<BudgetPool | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [userAllocations, setUserAllocations] = useState<Record<string, number>>({});
  const [allocationInputs, setAllocationInputs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<string>('all');
  const [availableProcesses, setAvailableProcesses] = useState<{ id: string; title: string; totalBudget: number }[]>([]);
  const [allocationError, setAllocationError] = useState('');

  useEffect(() => {
    fetchBudgetData();
  }, [selectedProcess, categoryFilter]);

  async function fetchBudgetData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProcess !== 'all') params.set('processId', selectedProcess);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      params.set('limit', '50');

      const res = await fetch(`/api/participation/budget?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
        setBudgetPool(data.budgetPool || null);
        setUserAllocations(Object.fromEntries(data.projects.flatMap((project: BudgetProject) => project.budgetVotes.map(vote => [project.id, vote.amount]))));

        // Extract unique processes from projects
        const procs = new Map<string, { id: string; title: string; totalBudget: number }>();
        data.projects.forEach((p: BudgetProject) => {
          if (p.process) procs.set(p.process.id, { id: p.process.id, title: p.process.title, totalBudget: p.process.totalBudget });
        });
        if (availableProcesses.length === 0) setAvailableProcesses(Array.from(procs.values()));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAllocate(projectId: string) {
    const amount = allocationInputs[projectId];
    if (amount === undefined || amount.trim() === "" || !Number.isFinite(Number(amount)) || Number(amount) < 0) return;
    setAllocationError('');

    setSubmitting(projectId);
    try {
      const centsAmount = Math.round(parseFloat(amount) * 100);
      const res = await fetch('/api/participation/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, amount: centsAmount }),
      });
      if (res.ok) {
        setUserAllocations((prev) => ({
          ...prev,
          [projectId]: centsAmount,
        }));
        setAllocationInputs((prev) => ({ ...prev, [projectId]: '' }));
        await fetchBudgetData();
      } else {
        const data = await res.json();
        setAllocationError(data.error || 'This allocation could not be saved.');
      }
    } catch {
      setAllocationError("This allocation could not be saved. Please try again.");
    } finally {
      setSubmitting(null);
    }
  }

  const totalUserAllocated = budgetPool?.allocated ?? Object.values(userAllocations).reduce((s, a) => s + a, 0);
  const userBudgetRemaining = budgetPool ? budgetPool.remaining : 0;
  const allocatedProjects = Object.entries(userAllocations).filter(([, amount]) => amount > 0);

  return (
    <div className="space-y-6 budget-workspace">
      {allocationError && <p role="alert" className="form-error">{allocationError}</p>}
      <WorkspaceHeading
        look="budget"
        title="Budgets"
        description="Allocate a share of the process budget across its projects. Your allocation records your priorities without spending money or approving a project."
        back={{ href: "/dashboard/participation", label: "Explore participation" }}
      />

      <div className="workspace-tool-stats">
        <div className="glass-card p-4 rounded-xl">
          <span className="text-xs text-cosmic-muted">Available Budget</span>
          <p className="text-xl font-bold text-cosmic-amber font-heading">
            {budgetPool ? formatCurrency(budgetPool.total, budgetPool.currency) : '$0'}
          </p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <span className="text-xs text-cosmic-muted">Your allocated allowance</span>
          <p className="text-xl font-bold text-cosmic-teal font-heading">
            {budgetPool ? formatCurrency(budgetPool.allocated, budgetPool.currency) : '$0'}
          </p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <span className="text-xs text-cosmic-muted">Your remaining allowance</span>
          <p className="text-xl font-bold text-foreground font-heading">
            {budgetPool ? formatCurrency(budgetPool.remaining, budgetPool.currency) : '$0'}
          </p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <span className="text-xs text-cosmic-muted">Projects</span>
          <p className="text-xl font-bold text-cosmic-violet font-heading">{projects.length}</p>
        </div>
      </div>
      {/* Budget progress bar */}
      {budgetPool && budgetPool.total > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-cosmic-muted mb-1">
            <span>Budget Allocation Progress</span>
            <span>{Math.round((budgetPool.allocated / budgetPool.total) * 100)}%</span>
          </div>
          <div className="h-3 bg-foreground/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cosmic-amber to-cosmic-teal rounded-full transition-all duration-1000 tally-bar"
              style={{ width: `${Math.min(100, (budgetPool.allocated / budgetPool.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-foreground/5 border-border text-foreground">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="infrastructure">Infrastructure</SelectItem>
            <SelectItem value="social">Social</SelectItem>
            <SelectItem value="environment">Environment</SelectItem>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="culture">Culture</SelectItem>
            <SelectItem value="health">Health</SelectItem>
          </SelectContent>
        </Select>
        {availableProcesses.length > 0 && (
          <Select value={selectedProcess} onValueChange={setSelectedProcess}>
            <SelectTrigger className="w-full sm:w-64 bg-foreground/5 border-border text-foreground">
              <SelectValue placeholder="Process" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Processes</SelectItem>
              {availableProcesses.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Cards */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-cosmic-amber animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <ToolEmpty look="budget" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => {
                const catConfig = CATEGORY_CONFIG[project.category || ''] || {
                  label: project.category || 'General',
                  icon: Building2,
                  color: 'text-cosmic-muted bg-foreground/5 border-border',
                };
                const CatIcon = catConfig.icon;
                const fundingPct = project.budgetRequested > 0 ? Math.round((project.totalAllocated / project.budgetRequested) * 100) : 0;
                const userAllocated = userAllocations[project.id] || 0;

                return (
                  <Card key={project.id} className={`glass-card rounded-xl transition-all duration-300 hover:scale-[1.01] ${userAllocated > 0 ? 'ring-1 ring-cosmic-amber/30' : ''}`}>
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <Badge className={`${catConfig.color} text-[10px] border`}>
                          <CatIcon className="w-3 h-3 mr-1" />
                          {catConfig.label}
                        </Badge>
                        <Badge className={`${STATUS_COLORS[project.status] || 'bg-foreground/5 text-cosmic-muted'} text-[10px] capitalize`}>
                          {project.status}
                        </Badge>
                      </div>

                      <h3 className="text-sm font-semibold text-foreground line-clamp-2">{project.title}</h3>
                      <p className="text-xs text-cosmic-muted line-clamp-2">{project.description}</p>

                      {/* Budget info */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-cosmic-muted">Funded</span>
                          <span className="text-cosmic-amber font-medium">{fundingPct}%</span>
                        </div>
                        <Progress value={fundingPct} className="h-2" />
                        <div className="flex items-center justify-between text-[10px] text-cosmic-muted mt-1">
                          <span>{formatCurrency(project.totalAllocated, project.process?.currency)}</span>
                          <span>of {formatCurrency(project.budgetRequested, project.process?.currency)}</span>
                        </div>
                      </div>

                      {/* Vote count */}
                      <div className="flex items-center gap-2 text-xs text-cosmic-muted">
                        <Users className="w-3.5 h-3.5" /> {project.voterCount} supporters
                      </div>

                      {/* Allocate button */}
                      {project.status === 'proposed' || project.status === 'shortlisted' ? (
                        <div className="flex flex-col gap-2 border-t border-border pt-2 sm:flex-row">
                          <div className="relative min-w-0 flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-cosmic-muted">$</span>
                            <Input
                              type="number"
                              placeholder="0"
                              aria-label={"Allocation for " + project.title}
                              className="h-[50px] border-border bg-foreground/5 pl-7 text-sm text-foreground placeholder:text-cosmic-muted/50"
                              value={allocationInputs[project.id] || ''}
                              onChange={(e) => setAllocationInputs(prev => ({ ...prev, [project.id]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleAllocate(project.id); }}
                            />
                          </div>
                          <Button
                            className="civic-button shrink-0"
                            onClick={() => handleAllocate(project.id)}
                            disabled={submitting === project.id || !allocationInputs[project.id]}
                          >
                            {submitting === project.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Save allocation"
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-border">
                          {project.status === 'approved' || project.status === 'implementing' ? (
                            <div className="flex items-center gap-1.5 text-xs text-cosmic-success">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved & In Progress
                            </div>
                          ) : project.status === 'completed' ? (
                            <div className="flex items-center gap-1.5 text-xs text-cosmic-teal">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-cosmic-rose">
                              <AlertCircle className="w-3.5 h-3.5" /> Not Approved
                            </div>
                          )}
                        </div>
                      )}

                      {userAllocated > 0 && (
                        <div className="text-xs text-cosmic-amber flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> You allocated {formatCurrency(userAllocated, project.process?.currency)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar - Your Allocation */}
        <div className="space-y-4">
          {/* Your Allocation Panel */}
          <Card className="glass-card-amber rounded-2xl sticky top-20">
            <CardHeader className="pb-2">
              <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                <Wallet className="w-5 h-5 text-cosmic-amber" /> Your Allocation
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-cosmic-muted">You allocated</span>
                  <span className="text-cosmic-amber font-bold">{formatCurrency(totalUserAllocated)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cosmic-muted">Available</span>
                  <span className="text-foreground font-bold">{formatCurrency(Math.max(0, userBudgetRemaining))}</span>
                </div>
                <Progress
                  value={budgetPool && budgetPool.total > 0 ? (totalUserAllocated / budgetPool.total) * 100 : 0}
                  className="h-2"
                />
              </div>

              {/* Funded projects list */}
              {allocatedProjects.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allocatedProjects.map(([projectId, amount]) => {
                    const project = projects.find((p) => p.id === projectId);
                    return (
                      <div key={projectId} className="flex items-center justify-between bg-foreground/5 rounded-lg p-2">
                        <span className="text-xs text-foreground truncate flex-grow mr-2">
                          {project?.title || 'Unknown Project'}
                        </span>
                        <span className="text-xs text-cosmic-amber font-medium flex-shrink-0">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-cosmic-muted text-center py-4">
                  Save an allocation on a project to record your priorities.
                </p>
              )}

            </CardContent>
          </Card>

          {/* Map Placeholder */}
          <Card className="glass-card rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="h-48 bg-gradient-to-br from-cosmic-teal/5 to-cosmic-violet/5 flex flex-col items-center justify-center gap-3 border border-border rounded-2xl">
                <MapIcon className="w-8 h-8 text-cosmic-muted/30" />
                <span className="text-xs text-cosmic-muted font-medium">Interactive Map Coming Soon</span>
                <span className="text-[10px] text-cosmic-muted/50">See project locations on a map</span>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="glass-card rounded-2xl">
            <CardHeader className="pb-2">
              <h3 className="font-heading font-semibold text-foreground flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-cosmic-success" /> Approved Projects
              </h3>
            </CardHeader>
            <CardContent>
              {projects.filter((p) => p.status === 'approved' || p.status === 'implementing' || p.status === 'completed').length === 0 ? (
                <p className="text-xs text-cosmic-muted text-center py-4">No approved projects yet</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {projects.filter((p) => p.status === 'approved' || p.status === 'implementing' || p.status === 'completed').map((project) => (
                    <div key={project.id} className="flex items-center justify-between bg-foreground/5 rounded-lg p-2">
                      <div className="min-w-0 flex-grow mr-2">
                        <p className="text-xs text-foreground truncate">{project.title}</p>
                        <div className="flex items-center gap-1 text-[10px] text-cosmic-muted">
                          <Clock className="w-2.5 h-2.5" />
                          {project.status === 'completed' ? 'Completed' : project.status === 'implementing' ? 'In Progress' : 'Approved'}
                        </div>
                      </div>
                      <span className="text-xs text-cosmic-success font-medium flex-shrink-0">
                        {formatCurrency(project.budgetApproved || project.budgetRequested, project.process?.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
