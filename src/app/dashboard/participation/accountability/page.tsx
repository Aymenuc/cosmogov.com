'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Eye, ArrowLeft, Loader2, CheckCircle2, Clock, AlertTriangle,
  Circle, FileText, Wallet, TrendingUp, Shield, BarChart3,
  Calendar, Activity, Sparkles, ArrowRight, ChevronDown, ChevronUp,
} from 'lucide-react';

interface Entity {
  id: string;
  title: string;
  type: 'proposal' | 'project';
  milestones: MilestoneItem[];
  overallProgress: number;
  status: string;
}

interface MilestoneItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  dueDate: string | null;
  completedAt: string | null;
  evidence: string;
  createdAt: string;
  creator: { id: string; name: string | null };
}

interface Stats {
  totalMilestones: number;
  completedMilestones: number;
  delayedMilestones: number;
  transparencyScore: number;
  onTimeRate: number;
  overallProgress: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  on_track: { label: 'On Track', color: 'text-cosmic-success', bg: 'bg-cosmic-success/10 border-cosmic-success/20', icon: CheckCircle2 },
  delayed: { label: 'Delayed', color: 'text-cosmic-rose', bg: 'bg-cosmic-rose/10 border-cosmic-rose/20', icon: AlertTriangle },
  completed: { label: 'Completed', color: 'text-cosmic-teal', bg: 'bg-cosmic-teal/10 border-cosmic-teal/20', icon: CheckCircle2 },
  at_risk: { label: 'At Risk', color: 'text-cosmic-amber', bg: 'bg-cosmic-amber/10 border-cosmic-amber/20', icon: AlertTriangle },
};

const MILESTONE_STATUS: Record<string, { label: string; dot: string; color: string }> = {
  pending: { label: 'Pending', dot: 'bg-white/20', color: 'text-cosmic-muted' },
  in_progress: { label: 'In Progress', dot: 'bg-cosmic-accent', color: 'text-cosmic-accent' },
  completed: { label: 'Completed', dot: 'bg-cosmic-success', color: 'text-cosmic-success' },
  delayed: { label: 'Delayed', dot: 'bg-cosmic-rose', color: 'text-cosmic-rose' },
  cancelled: { label: 'Cancelled', dot: 'bg-white/10', color: 'text-white/30' },
};

function daysSince(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export default function AccountabilityPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [stats, setStats] = useState<Stats>({ totalMilestones: 0, completedMilestones: 0, delayedMilestones: 0, transparencyScore: 0, onTimeRate: 0, overallProgress: 0 });
  const [loading, setLoading] = useState(true);
  const [processFilter, setProcessFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [processFilter, statusFilter]);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (processFilter !== 'all') params.set('processId', processFilter);

      const res = await fetch(`/api/participation/accountability?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntities(data.entities || []);
        setStats(data.stats || { totalMilestones: 0, completedMilestones: 0, delayedMilestones: 0, transparencyScore: 0, onTimeRate: 0, overallProgress: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredEntities = entities.filter((e) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'on_track') return e.status === 'on_track';
    if (statusFilter === 'delayed') return e.status === 'delayed';
    if (statusFilter === 'completed') return e.status === 'completed';
    if (statusFilter === 'at_risk') return e.status === 'at_risk';
    return true;
  });

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Back Navigation */}
      <Link href="/dashboard/participation" className="inline-flex items-center gap-2 text-sm text-cosmic-muted hover:text-cosmic-teal transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Participation Hub
      </Link>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl glass-card-violet p-8">
        <div className="absolute inset-0 starfield opacity-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-cosmic-violet" />
            <span className="text-cosmic-violet text-sm font-semibold tracking-wider uppercase">Accountability Tracker</span>
          </div>
          <h1 className="font-heading text-2xl lg:text-3xl font-bold text-white mb-2">
            Promises Made, <span className="text-gradient-cool">Promises Kept</span>
          </h1>
          <p className="text-cosmic-muted text-sm max-w-2xl mb-6">
            Track implementation of approved proposals and budget projects. See milestones, evidence, and progress — because democracy doesn&apos;t end at the ballot box.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="glass-card p-3 rounded-xl">
              <span className="text-[10px] text-cosmic-muted">Overall</span>
              <p className="text-lg font-bold text-cosmic-violet font-heading">{stats.overallProgress}%</p>
            </div>
            <div className="glass-card p-3 rounded-xl">
              <span className="text-[10px] text-cosmic-muted">Milestones</span>
              <p className="text-lg font-bold text-white font-heading">{stats.totalMilestones}</p>
            </div>
            <div className="glass-card p-3 rounded-xl">
              <span className="text-[10px] text-cosmic-muted">Completed</span>
              <p className="text-lg font-bold text-cosmic-success font-heading">{stats.completedMilestones}</p>
            </div>
            <div className="glass-card p-3 rounded-xl">
              <span className="text-[10px] text-cosmic-muted">Delayed</span>
              <p className="text-lg font-bold text-cosmic-rose font-heading">{stats.delayedMilestones}</p>
            </div>
            <div className="glass-card p-3 rounded-xl">
              <span className="text-[10px] text-cosmic-muted">Transparency</span>
              <p className="text-lg font-bold text-cosmic-amber font-heading">{stats.transparencyScore}%</p>
            </div>
            <div className="glass-card p-3 rounded-xl">
              <span className="text-[10px] text-cosmic-muted">On-Time</span>
              <p className="text-lg font-bold text-cosmic-teal font-heading">{stats.onTimeRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transparency Score Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cosmic-amber/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-cosmic-amber" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Transparency Score</h3>
                <p className="text-[10px] text-cosmic-muted">% milestones with evidence</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-grow">
                <Progress value={stats.transparencyScore} className="h-2" />
              </div>
              <span className="text-lg font-bold text-cosmic-amber font-heading">{stats.transparencyScore}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cosmic-teal/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-cosmic-teal" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">On-Time Completion</h3>
                <p className="text-[10px] text-cosmic-muted">Completed before deadline</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-grow">
                <Progress value={stats.onTimeRate} className="h-2" />
              </div>
              <span className="text-lg font-bold text-cosmic-teal font-heading">{stats.onTimeRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cosmic-violet/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-cosmic-violet" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Overall Progress</h3>
                <p className="text-[10px] text-cosmic-muted">Average milestone progress</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-grow">
                <Progress value={stats.overallProgress} className="h-2" />
              </div>
              <span className="text-lg font-bold text-cosmic-violet font-heading">{stats.overallProgress}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="on_track">On Track</SelectItem>
            <SelectItem value="delayed">Delayed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="at_risk">At Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Implementation Dashboard */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-cosmic-violet animate-spin" />
        </div>
      ) : filteredEntities.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <Eye className="w-12 h-12 text-cosmic-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Implementation Data</h3>
          <p className="text-cosmic-muted text-sm">Implementation tracking will appear once proposals are accepted and milestones are created.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntities.map((entity) => {
            const statusCfg = STATUS_CONFIG[entity.status] || STATUS_CONFIG.on_track;
            const StatusIcon = statusCfg.icon;
            const isExpanded = expandedEntity === `${entity.type}-${entity.id}`;

            return (
              <Card key={`${entity.type}-${entity.id}`} className="glass-card rounded-xl">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Type icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      entity.type === 'project' ? 'bg-cosmic-amber/10' : 'bg-cosmic-violet/10'
                    }`}>
                      {entity.type === 'project' ? (
                        <Wallet className="w-5 h-5 text-cosmic-amber" />
                      ) : (
                        <FileText className="w-5 h-5 text-cosmic-violet" />
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h3 className="text-sm font-semibold text-white">{entity.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-[9px] border ${statusCfg.bg} ${statusCfg.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusCfg.label}
                            </Badge>
                            <span className="text-[10px] text-cosmic-muted capitalize">{entity.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Progress value={entity.overallProgress} className="w-16 h-1.5" />
                          <span className="text-sm font-bold text-white font-heading">{entity.overallProgress}%</span>
                        </div>
                      </div>

                      {/* Milestone Timeline Preview */}
                      {entity.milestones.length > 0 && (
                        <div className="flex items-center gap-1 mt-3">
                          {entity.milestones.slice(0, 8).map((m) => {
                            const ms = MILESTONE_STATUS[m.status] || MILESTONE_STATUS.pending;
                            return (
                              <div key={m.id} className="group relative">
                                <div className={`w-4 h-4 rounded-full ${ms.dot} cursor-pointer transition-all hover:scale-125`} />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                  <div className="glass-card px-2 py-1 rounded-lg whitespace-nowrap">
                                    <p className="text-[10px] text-white font-medium">{m.title}</p>
                                    <p className={`text-[9px] ${ms.color}`}>{ms.label} · {m.progress}%</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {entity.milestones.length > 8 && (
                            <span className="text-[10px] text-cosmic-muted ml-1">+{entity.milestones.length - 8} more</span>
                          )}
                        </div>
                      )}

                      {/* Expand/Collapse button */}
                      {entity.milestones.length > 0 && (
                        <button
                          onClick={() => setExpandedEntity(isExpanded ? null : `${entity.type}-${entity.id}`)}
                          className="flex items-center gap-1 text-xs text-cosmic-muted hover:text-cosmic-teal transition-colors mt-2"
                        >
                          {entity.milestones.length} milestones
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}

                      {/* Expanded milestone detail */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-white/5 space-y-2 max-h-72 overflow-y-auto">
                          {entity.milestones.map((milestone) => {
                            const ms = MILESTONE_STATUS[milestone.status] || MILESTONE_STATUS.pending;
                            let evidenceItems: { type: string; url: string; description: string }[] = [];
                            try { evidenceItems = JSON.parse(milestone.evidence); } catch { /* empty */ }

                            return (
                              <div key={milestone.id} className="bg-white/3 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={`w-2.5 h-2.5 rounded-full ${ms.dot}`} />
                                  <h4 className="text-xs font-medium text-white flex-grow">{milestone.title}</h4>
                                  <span className={`text-[10px] ${ms.color}`}>{ms.label}</span>
                                </div>
                                {milestone.description && (
                                  <p className="text-[11px] text-cosmic-muted ml-[18px] mb-1">{milestone.description}</p>
                                )}
                                <div className="flex items-center gap-3 ml-[18px]">
                                  <div className="flex items-center gap-1.5 flex-grow">
                                    <Progress value={milestone.progress} className="h-1 w-16" />
                                    <span className="text-[10px] text-cosmic-muted">{milestone.progress}%</span>
                                  </div>
                                  {milestone.dueDate && (
                                    <span className="text-[10px] text-cosmic-muted flex items-center gap-0.5">
                                      <Calendar className="w-2.5 h-2.5" />
                                      Due {new Date(milestone.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                  {milestone.completedAt && (
                                    <span className="text-[10px] text-cosmic-success flex items-center gap-0.5">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      {new Date(milestone.completedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                {/* Evidence */}
                                {evidenceItems.length > 0 && (
                                  <div className="ml-[18px] mt-1 flex items-center gap-1">
                                    <Activity className="w-2.5 h-2.5 text-cosmic-amber" />
                                    <span className="text-[10px] text-cosmic-amber">{evidenceItems.length} evidence item{evidenceItems.length !== 1 ? 's' : ''}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
