'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Megaphone, Users, FileText, Wallet, Clock, ArrowLeft, ThumbsUp, ThumbsDown,
  MessageSquare, Plus, Orbit, Eye, Calendar, CheckCircle2, Circle, Loader2,
  MapPin, Send, ChevronDown, ChevronUp, Building2, TreePine, GraduationCap,
  Landmark, Globe2, Sparkles, AlertCircle,
} from 'lucide-react';

interface ProcessDetail {
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
  isPublic: boolean;
  allowProposals: boolean;
  allowComments: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  creator: { id: string; name: string | null; avatarUrl: string | null };
  organization: { id: string; name: string; slug: string; avatarUrl: string | null } | null;
  processProposals: Proposal[];
  budgetProjects: BudgetProjectItem[];
  milestones: Milestone[];
  meetings: Meeting[];
  assemblies: Assembly[];
  initiatives: Initiative[];
  participantCount: number;
  totalBudgetAllocated: number;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  category: string | null;
  budgetRequested: number | null;
  status: string;
  supportCount: number;
  oppositionCount: number;
  createdAt: string;
  creator: { id: string; name: string | null; avatarUrl: string | null };
  _count: { endorsements: number; comments: number };
  endorsementBreakdown?: { support: number; oppose: number; neutral: number };
}

interface BudgetProjectItem {
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
  _count: { budgetVotes: number };
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  dueDate: string | null;
  completedAt: string | null;
  evidence: string;
  createdAt: string;
}

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  type: string;
  startsAt: string;
  status: string;
}

interface Assembly {
  id: string;
  name: string;
  slug: string;
  purpose: string;
  memberCount: number;
  _count: { members: number };
}

interface Initiative {
  id: string;
  title: string;
  type: string;
  signatureGoal: number;
  signatureCount: number;
  status: string;
}

const PHASE_ORDER = ['information', 'proposal', 'deliberation', 'voting', 'implementation', 'evaluation', 'closed'];
const PHASE_LABELS: Record<string, string> = {
  information: 'Information', proposal: 'Proposal', deliberation: 'Deliberation',
  voting: 'Voting', implementation: 'Implementation', evaluation: 'Evaluation', closed: 'Closed',
};
const PHASE_COLORS: Record<string, string> = {
  information: 'text-cosmic-amber', proposal: 'text-cosmic-teal', deliberation: 'text-cosmic-violet',
  voting: 'text-cosmic-accent', implementation: 'text-cosmic-amber', evaluation: 'text-cosmic-success', closed: 'text-white/30',
};
const PHASE_BG: Record<string, string> = {
  information: 'bg-cosmic-amber', proposal: 'bg-cosmic-teal', deliberation: 'bg-cosmic-violet',
  voting: 'bg-cosmic-accent', implementation: 'bg-cosmic-amber', evaluation: 'bg-cosmic-success', closed: 'bg-white/20',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-white/20', in_progress: 'bg-cosmic-accent', completed: 'bg-cosmic-success', delayed: 'bg-cosmic-rose', cancelled: 'bg-white/10',
};

function formatCurrency(cents: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ProcessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [process, setProcess] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proposals');
  const [showNewProposal, setShowNewProposal] = useState(false);
  const [newProposal, setNewProposal] = useState({ title: '', description: '', category: '', budgetRequested: '' });
  const [submitting, setSubmitting] = useState(false);
  const [endorsingId, setEndorsingId] = useState<string | null>(null);
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProcess();
  }, [id]);

  async function fetchProcess() {
    try {
      const res = await fetch(`/api/participation/processes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProcess(data.process);
      } else {
        router.push('/dashboard/participation');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEndorse(proposalId: string, type: 'support' | 'oppose') {
    setEndorsingId(proposalId);
    try {
      const res = await fetch(`/api/participation/proposals/${proposalId}/endorse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        await fetchProcess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEndorsingId(null);
    }
  }

  async function handleCreateProposal() {
    if (!newProposal.title || !newProposal.description) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/participation/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processId: id,
          ...newProposal,
          budgetRequested: newProposal.budgetRequested ? Math.round(parseFloat(newProposal.budgetRequested) * 100) : null,
        }),
      });
      if (res.ok) {
        setNewProposal({ title: '', description: '', category: '', budgetRequested: '' });
        setShowNewProposal(false);
        await fetchProcess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function fetchComments(proposalId: string) {
    try {
      const res = await fetch(`/api/participation/proposals/${proposalId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => ({ ...prev, [proposalId]: data.comments }));
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmitComment(proposalId: string) {
    const content = commentInputs[proposalId];
    if (!content?.trim()) return;
    try {
      const res = await fetch(`/api/participation/proposals/${proposalId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setCommentInputs((prev) => ({ ...prev, [proposalId]: '' }));
        await fetchComments(proposalId);
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cosmic-teal animate-spin" />
      </div>
    );
  }

  if (!process) return null;

  const currentPhaseIdx = PHASE_ORDER.indexOf(process.currentPhase);
  const phases = (() => {
    try { return JSON.parse(process.phases); } catch { return PHASE_ORDER.filter(p => p !== 'closed').map(p => ({ id: p, name: PHASE_LABELS[p] })); }
  })();

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Back Navigation */}
      <Link href="/dashboard/participation" className="inline-flex items-center gap-2 text-sm text-cosmic-muted hover:text-cosmic-teal transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Participation Hub
      </Link>

      {/* Process Header */}
      <div className="glass-card rounded-2xl p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-cosmic-teal/10 text-cosmic-teal border border-cosmic-teal/20 text-[10px]">
                {PHASE_LABELS[process.currentPhase]}
              </Badge>
              {process.organization && (
                <Badge className="bg-white/5 text-cosmic-muted border border-white/10 text-[10px]">
                  <Building2 className="w-3 h-3 mr-1" /> {process.organization.name}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] border-white/10 text-cosmic-muted capitalize">
                <Globe2 className="w-3 h-3 mr-1" /> {process.scope}
              </Badge>
            </div>
            <h1 className="font-heading text-2xl lg:text-3xl font-bold text-white mb-2">{process.title}</h1>
            <p className="text-cosmic-muted text-sm max-w-3xl">{process.description}</p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-cosmic-muted">
              <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {process.participantCount} participants</div>
              <div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {process.processProposals.length} proposals</div>
              {process.totalBudget > 0 && (
                <div className="flex items-center gap-1 text-cosmic-amber"><Wallet className="w-3.5 h-3.5" /> {formatCurrency(process.totalBudget, process.currency)} budget</div>
              )}
              <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Started {new Date(process.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Phase Stepper - Vertical on desktop */}
          <div className="lg:w-72 flex-shrink-0">
            <h3 className="text-xs font-semibold text-cosmic-muted uppercase tracking-wider mb-3">Process Phases</h3>
            <div className="space-y-0">
              {phases.filter((p: {id: string}) => p.id !== 'closed').map((phase: {id: string; name: string}, idx: number) => {
                const phaseIdx = PHASE_ORDER.indexOf(phase.id);
                const isActive = phase.id === process.currentPhase;
                const isCompleted = phaseIdx < currentPhaseIdx;

                return (
                  <div key={phase.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                        isActive ? 'border-cosmic-teal bg-cosmic-teal/20 glow-teal' :
                        isCompleted ? 'border-cosmic-teal/50 bg-cosmic-teal/10' :
                        'border-white/10 bg-white/5'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-cosmic-teal" />
                        ) : isActive ? (
                          <Orbit className="w-3.5 h-3.5 text-cosmic-teal" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-white/20" />
                        )}
                      </div>
                      {idx < phases.filter((p: {id: string}) => p.id !== 'closed').length - 1 && (
                        <div className={`w-0.5 h-6 ${isCompleted ? 'bg-cosmic-teal/40' : 'bg-white/10'}`} />
                      )}
                    </div>
                    <div className="pt-0.5">
                      <p className={`text-sm font-medium ${isActive ? 'text-cosmic-teal' : isCompleted ? 'text-white/70' : 'text-white/30'}`}>
                        {phase.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10 p-1 h-auto">
          <TabsTrigger value="proposals" className="data-[state=active]:bg-cosmic-teal/10 data-[state=active]:text-cosmic-teal text-cosmic-muted text-xs">
            <FileText className="w-3.5 h-3.5 mr-1.5" /> Proposals ({process.processProposals.length})
          </TabsTrigger>
          <TabsTrigger value="budget" className="data-[state=active]:bg-cosmic-amber/10 data-[state=active]:text-cosmic-amber text-cosmic-muted text-xs">
            <Wallet className="w-3.5 h-3.5 mr-1.5" /> Budget ({process.budgetProjects.length})
          </TabsTrigger>
          <TabsTrigger value="accountability" className="data-[state=active]:bg-cosmic-violet/10 data-[state=active]:text-cosmic-violet text-cosmic-muted text-xs">
            <Eye className="w-3.5 h-3.5 mr-1.5" /> Accountability
          </TabsTrigger>
          <TabsTrigger value="about" className="data-[state=active]:bg-cosmic-accent/10 data-[state=active]:text-cosmic-accent text-cosmic-muted text-xs">
            <Megaphone className="w-3.5 h-3.5 mr-1.5" /> About
          </TabsTrigger>
        </TabsList>

        {/* Proposals Tab */}
        <TabsContent value="proposals" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-white">Community Proposals</h2>
            {process.allowProposals && process.currentPhase !== 'closed' && (
              <Button
                onClick={() => setShowNewProposal(!showNewProposal)}
                className="bg-cosmic-teal text-[#0B1022] hover:bg-cosmic-teal/90 text-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" /> New Proposal
              </Button>
            )}
          </div>

          {/* New Proposal Form */}
          {showNewProposal && (
            <Card className="glass-card-teal rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-heading font-semibold text-white">Submit a Proposal</h3>
                <Input
                  placeholder="Proposal title"
                  className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                  value={newProposal.title}
                  onChange={(e) => setNewProposal(p => ({ ...p, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Describe your proposal in detail..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 min-h-[120px]"
                  value={newProposal.description}
                  onChange={(e) => setNewProposal(p => ({ ...p, description: e.target.value }))}
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Budget requested (optional)"
                    type="number"
                    className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                    value={newProposal.budgetRequested}
                    onChange={(e) => setNewProposal(p => ({ ...p, budgetRequested: e.target.value }))}
                  />
                  <Button
                    onClick={handleCreateProposal}
                    disabled={submitting || !newProposal.title || !newProposal.description}
                    className="bg-cosmic-teal text-[#0B1022] hover:bg-cosmic-teal/90"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                    Submit Proposal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Proposals List */}
          {process.processProposals.length === 0 ? (
            <div className="glass-card p-12 rounded-2xl text-center">
              <FileText className="w-12 h-12 text-cosmic-muted/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Proposals Yet</h3>
              <p className="text-cosmic-muted text-sm">Be the first to submit a proposal for this process.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {process.processProposals.map((proposal) => {
                const isExpanded = expandedProposal === proposal.id;
                const breakdown = proposal.endorsementBreakdown || { support: proposal.supportCount, oppose: proposal.oppositionCount, neutral: 0 };
                const total = breakdown.support + breakdown.oppose + breakdown.neutral || 1;
                const supportPct = Math.round((breakdown.support / total) * 100);

                return (
                  <Card key={proposal.id} className="glass-card rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Vote buttons */}
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEndorse(proposal.id, 'support')}
                            disabled={endorsingId === proposal.id}
                            className="p-1.5 rounded-lg hover:bg-cosmic-teal/10 text-cosmic-muted hover:text-cosmic-teal transition-all"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-bold text-cosmic-teal">{breakdown.support}</span>
                          <button
                            onClick={() => handleEndorse(proposal.id, 'oppose')}
                            disabled={endorsingId === proposal.id}
                            className="p-1.5 rounded-lg hover:bg-cosmic-rose/10 text-cosmic-muted hover:text-cosmic-rose transition-all"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-bold text-cosmic-rose">{breakdown.oppose}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-white">{proposal.title}</h3>
                            <Badge className={`text-[9px] ${
                              proposal.status === 'published' ? 'bg-cosmic-teal/10 text-cosmic-teal border-cosmic-teal/20' :
                              proposal.status === 'accepted' ? 'bg-cosmic-success/10 text-cosmic-success border-cosmic-success/20' :
                              proposal.status === 'rejected' ? 'bg-cosmic-rose/10 text-cosmic-rose border-cosmic-rose/20' :
                              'bg-white/5 text-cosmic-muted border-white/10'
                            } border capitalize`}>
                              {proposal.status}
                            </Badge>
                          </div>

                          {/* Support bar */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-grow h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-cosmic-teal to-cosmic-teal/60 rounded-full transition-all duration-700" style={{ width: `${supportPct}%` }} />
                            </div>
                            <span className="text-[10px] text-cosmic-muted">{supportPct}% support</span>
                          </div>

                          {proposal.budgetRequested && (
                            <p className="text-xs text-cosmic-amber mb-1">
                              <Wallet className="w-3 h-3 inline mr-1" /> {formatCurrency(proposal.budgetRequested, process.currency)} requested
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-xs text-cosmic-muted">
                            <span>by {proposal.creator.name || 'Anonymous'}</span>
                            <span>{timeAgo(proposal.createdAt)}</span>
                            <button
                              onClick={() => {
                                if (isExpanded) { setExpandedProposal(null); }
                                else {
                                  setExpandedProposal(proposal.id);
                                  if (!comments[proposal.id]) fetchComments(proposal.id);
                                }
                              }}
                              className="flex items-center gap-1 hover:text-cosmic-teal transition-colors"
                            >
                              <MessageSquare className="w-3 h-3" />
                              {proposal._count.comments}
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>

                          {/* Expanded content */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
                              <p className="text-sm text-cosmic-muted">{proposal.description}</p>

                              {/* Comments */}
                              <div className="space-y-2">
                                {(comments[proposal.id] || []).map((c: { id: string; content: string; createdAt: string; author: { name: string | null } }) => (
                                  <div key={c.id} className="bg-white/3 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-5 h-5 rounded-full bg-cosmic-violet/20 flex items-center justify-center text-[9px] font-bold text-cosmic-violet">
                                        {(c.author.name || 'A')[0].toUpperCase()}
                                      </div>
                                      <span className="text-xs font-medium">{c.author.name || 'Anonymous'}</span>
                                      <span className="text-[10px] text-cosmic-muted">{timeAgo(c.createdAt)}</span>
                                    </div>
                                    <p className="text-xs text-cosmic-muted">{c.content}</p>
                                  </div>
                                ))}
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Write a comment..."
                                    className="bg-white/5 border-white/10 text-white text-xs placeholder:text-cosmic-muted/50"
                                    value={commentInputs[proposal.id] || ''}
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [proposal.id]: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitComment(proposal.id); }}
                                  />
                                  <Button size="sm" onClick={() => handleSubmitComment(proposal.id)} className="bg-cosmic-teal/20 text-cosmic-teal hover:bg-cosmic-teal/30 h-9">
                                    <Send className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
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
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-white">Budget Projects</h2>
            {process.totalBudget > 0 && (
              <div className="glass-card-amber px-4 py-2 rounded-xl">
                <div className="text-xs text-cosmic-amber">Total Budget</div>
                <div className="text-lg font-bold text-cosmic-amber font-heading">{formatCurrency(process.totalBudget, process.currency)}</div>
              </div>
            )}
          </div>

          {process.budgetProjects.length === 0 ? (
            <div className="glass-card p-12 rounded-2xl text-center">
              <Wallet className="w-12 h-12 text-cosmic-muted/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Budget Projects</h3>
              <p className="text-cosmic-muted text-sm">Budget projects will appear here when proposed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {process.budgetProjects.map((project) => (
                <Card key={project.id} className="glass-card-amber rounded-xl">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-semibold text-white">{project.title}</h3>
                      <Badge className={`text-[9px] border ${
                        project.status === 'approved' ? 'bg-cosmic-success/10 text-cosmic-success border-cosmic-success/20' :
                        project.status === 'implementing' ? 'bg-cosmic-amber/10 text-cosmic-amber border-cosmic-amber/20' :
                        project.status === 'completed' ? 'bg-cosmic-teal/10 text-cosmic-teal border-cosmic-teal/20' :
                        'bg-white/5 text-cosmic-muted border-white/10'
                      } capitalize`}>
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-cosmic-muted line-clamp-2">{project.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-cosmic-amber">{formatCurrency(project.budgetRequested, process.currency)}</span>
                      <span className="text-xs text-cosmic-muted">{project._count.budgetVotes} votes</span>
                    </div>
                    <Progress value={project.budgetApproved > 0 ? (project.budgetApproved / project.budgetRequested) * 100 : 0} className="h-1.5" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Accountability Tab */}
        <TabsContent value="accountability" className="mt-4 space-y-4">
          <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-cosmic-violet" /> Implementation Tracking
          </h2>
          {process.milestones.length === 0 ? (
            <div className="glass-card p-12 rounded-2xl text-center">
              <Eye className="w-12 h-12 text-cosmic-muted/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Milestones Yet</h3>
              <p className="text-cosmic-muted text-sm">Milestones will be added as proposals are implemented.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {process.milestones.map((milestone) => (
                <Card key={milestone.id} className="glass-card rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[milestone.status]} flex-shrink-0`} />
                      <div className="flex-grow min-w-0">
                        <h4 className="text-sm font-medium text-white">{milestone.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-cosmic-muted">
                          <span className="capitalize">{milestone.status.replace('_', ' ')}</span>
                          {milestone.dueDate && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due {new Date(milestone.dueDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Progress value={milestone.progress} className="w-20 h-1.5" />
                        <span className="text-xs text-cosmic-muted">{milestone.progress}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="glass-card rounded-2xl">
              <CardHeader className="pb-2">
                <h3 className="font-heading font-semibold text-white">About This Process</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-cosmic-muted">{process.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-cosmic-muted">Scope</span><span className="text-white capitalize">{process.scope}</span></div>
                  <div className="flex justify-between"><span className="text-cosmic-muted">Category</span><span className="text-white capitalize">{(process.category || 'General').replace('_', ' ')}</span></div>
                  <div className="flex justify-between"><span className="text-cosmic-muted">Current Phase</span><span className={PHASE_COLORS[process.currentPhase]}>{PHASE_LABELS[process.currentPhase]}</span></div>
                  <div className="flex justify-between"><span className="text-cosmic-muted">Created</span><span className="text-white">{new Date(process.createdAt).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-cosmic-muted">Organizer</span><span className="text-white">{process.creator.name || 'Unknown'}</span></div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card rounded-2xl">
              <CardHeader className="pb-2">
                <h3 className="font-heading font-semibold text-white">Process Rules</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  {process.allowProposals ? <CheckCircle2 className="w-4 h-4 text-cosmic-success" /> : <AlertCircle className="w-4 h-4 text-cosmic-rose" />}
                  <span className={process.allowProposals ? 'text-white' : 'text-cosmic-muted'}>Proposal submission {process.allowProposals ? 'enabled' : 'disabled'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {process.allowComments ? <CheckCircle2 className="w-4 h-4 text-cosmic-success" /> : <AlertCircle className="w-4 h-4 text-cosmic-rose" />}
                  <span className={process.allowComments ? 'text-white' : 'text-cosmic-muted'}>Comments {process.allowComments ? 'enabled' : 'disabled'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {process.isPublic ? <CheckCircle2 className="w-4 h-4 text-cosmic-success" /> : <AlertCircle className="w-4 h-4 text-cosmic-amber" />}
                  <span className={process.isPublic ? 'text-white' : 'text-cosmic-muted'}>Process is {process.isPublic ? 'public' : 'private'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
