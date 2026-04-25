'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Gavel,
  Plus,
  Loader2,
  Users,
  CheckCircle2,
  FileSignature,
  Clock,
  ChevronRight,
  Shield,
  Scale,
  TrendingUp,
  AlertTriangle,
  Share2,
  Building2,
} from 'lucide-react';
import Link from 'next/link';

interface Signature {
  id: string;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string | null; avatarUrl: string | null };
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  category: string | null;
  type: string;
  signatureGoal: number;
  signatureCount: number;
  status: string;
  isBinding: boolean;
  governmentResponse: string | null;
  closesAt: string | null;
  createdAt: string;
  creator: { id: string; name: string | null; avatarUrl: string | null };
  signatures: Signature[];
  _count: { signatures: number };
}

interface Stats {
  activeProposals: number;
  totalSignatures: number;
  governmentResponses: number;
  enacted: number;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  binding_proposal: { label: 'Binding Proposal', color: 'text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20', icon: Gavel },
  binding_referendum: { label: 'Binding Referendum', color: 'text-cosmic-violet bg-cosmic-violet/10 border-cosmic-violet/20', icon: Scale },
  citizen_bill: { label: 'Citizen Bill', color: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20', icon: FileSignature },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  collecting: { label: 'Collecting', color: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20' },
  threshold_reached: { label: 'Threshold Reached', color: 'text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20' },
  government_review: { label: 'Gov. Review', color: 'text-cosmic-violet bg-cosmic-violet/10 border-cosmic-violet/20' },
  government_response: { label: 'Gov. Response', color: 'text-cosmic-accent bg-cosmic-accent/10 border-cosmic-accent/20' },
  scheduled_vote: { label: 'Scheduled Vote', color: 'text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20' },
  passed: { label: 'Passed', color: 'text-cosmic-success bg-cosmic-success/10 border-cosmic-success/20' },
  rejected: { label: 'Rejected', color: 'text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20' },
  enacted: { label: 'Enacted', color: 'text-cosmic-success bg-cosmic-success/10 border-cosmic-success/20' },
};

const TYPE_TABS = [
  { key: 'all', label: 'All Types' },
  { key: 'binding_proposal', label: 'Binding Proposal' },
  { key: 'binding_referendum', label: 'Referendum' },
  { key: 'citizen_bill', label: 'Citizen Bill' },
];

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'collecting', label: 'Collecting' },
  { key: 'threshold_reached', label: 'Threshold' },
  { key: 'government_review', label: 'Review' },
  { key: 'government_response', label: 'Response' },
  { key: 'scheduled_vote', label: 'Vote' },
  { key: 'enacted', label: 'Enacted' },
];

export default function BindingProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<Stats>({ activeProposals: 0, totalSignatures: 0, governmentResponses: 0, enacted: 0 });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sign dialog
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [signComment, setSignComment] = useState('');
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [thresholdJustReached, setThresholdJustReached] = useState(false);

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: 'social',
    type: 'binding_proposal',
    signatureGoal: 5000,
    legalReference: '',
    impactAssessment: '',
    responseDeadline: '',
    closesAt: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/binding-proposals?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  const handleSign = async () => {
    if (!selectedProposal) return;
    setSigning(true);
    try {
      const res = await fetch(`/api/binding-proposals/${selectedProposal.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: signComment }),
      });
      if (res.ok) {
        const data = await res.json();
        setSigned(true);
        if (data.thresholdReached) setThresholdJustReached(true);
        fetchProposals();
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
      const res = await fetch('/api/binding-proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        setCreateDialogOpen(false);
        setCreateForm({ title: '', description: '', category: 'social', type: 'binding_proposal', signatureGoal: 5000, legalReference: '', impactAssessment: '', responseDeadline: '', closesAt: '' });
        fetchProposals();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create proposal');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const openSignDialog = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setSignComment('');
    setSigned(false);
    setThresholdJustReached(false);
    setSignDialogOpen(true);
  };

  const progressPercent = (count: number, goal: number) => Math.min(Math.round((count / goal) * 100), 100);

  return (
    <div className="space-y-4 sm:space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Hero Section — cosmic-rose theme */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl glass-card-rose p-4 sm:p-6 lg:p-8">
        <div className="absolute inset-0 starfield opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Gavel className="w-5 h-5 text-cosmic-rose" />
            <span className="text-cosmic-rose text-sm font-semibold tracking-wider uppercase">Binding Proposals</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            Your Voice Has{' '}
            <span className="text-gradient-rose">Real Power</span>
          </h1>
          <p className="text-cosmic-muted text-sm sm:text-base max-w-2xl mb-4 sm:mb-8">
            When citizens reach the signature threshold, the government is legally required to respond. Your voice has real power.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {[
              { label: 'Active Proposals', value: stats.activeProposals, icon: FileSignature, color: 'text-cosmic-rose' },
              { label: 'Total Signatures', value: stats.totalSignatures, icon: Users, color: 'text-cosmic-violet' },
              { label: 'Gov. Responses', value: stats.governmentResponses, icon: Building2, color: 'text-cosmic-amber' },
              { label: 'Enacted', value: stats.enacted, icon: CheckCircle2, color: 'text-cosmic-success' },
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

      {/* Binding Banner */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-cosmic-rose/20 bg-gradient-to-r from-cosmic-rose/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cosmic-rose/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-cosmic-rose" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Binding = Government MUST Respond
            </h3>
            <p className="text-xs text-cosmic-muted mt-0.5">
              When a binding proposal reaches its signature threshold, the government is legally obligated to provide an official response within the deadline.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs — Type + Status */}
      <div className="space-y-3">
        {/* Type filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                typeFilter === tab.key
                  ? 'bg-cosmic-rose/20 text-cosmic-rose border-cosmic-rose/30'
                  : 'bg-white/5 text-cosmic-muted border-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-cosmic-violet/20 text-cosmic-violet border-cosmic-violet/30'
                  : 'bg-white/5 text-cosmic-muted border-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Create Button */}
      <div className="flex justify-end">
        <Button
          className="bg-cosmic-rose text-white hover:bg-cosmic-rose/90"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Create Binding Proposal
        </Button>
      </div>

      {/* Proposals Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-cosmic-rose animate-spin" />
        </div>
      ) : proposals.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <Gavel className="w-12 h-12 text-cosmic-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Binding Proposals Yet</h3>
          <p className="text-cosmic-muted text-sm mb-4">Create a binding proposal and rally citizens to force government action.</p>
          <Button className="bg-cosmic-rose text-white hover:bg-cosmic-rose/90" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Binding Proposal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {proposals.map((proposal) => {
            const typeConfig = TYPE_CONFIG[proposal.type] || TYPE_CONFIG.binding_proposal;
            const statusConfig = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.collecting;
            const TypeIcon = typeConfig.icon;
            const progress = progressPercent(proposal.signatureCount, proposal.signatureGoal);
            const isThresholdReached = proposal.status !== 'collecting' && proposal.status !== 'rejected';

            return (
              <Card key={proposal.id} className={`glass-card rounded-2xl hover:scale-[1.01] transition-all duration-300 group h-full ${isThresholdReached ? 'ring-1 ring-cosmic-rose/20' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between mb-2 flex-wrap gap-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-grow">
                      <Badge className={`${typeConfig.color} text-[10px] border`}>
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {typeConfig.label}
                      </Badge>
                      {proposal.category && (
                        <Badge className="text-cosmic-muted bg-white/5 border-white/10 text-[10px] border capitalize">
                          {proposal.category}
                        </Badge>
                      )}
                    </div>
                    <Badge className={`${statusConfig.color} text-[10px] border`}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold text-white group-hover:text-cosmic-rose transition-colors line-clamp-2">
                    {proposal.title}
                  </h3>
                  <p className="text-xs text-cosmic-muted line-clamp-2 mt-1">
                    {proposal.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* LARGE Signature Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-cosmic-muted flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {proposal.signatureCount.toLocaleString()} / {proposal.signatureGoal.toLocaleString()}
                      </span>
                      <span className={`font-bold text-sm ${isThresholdReached ? 'text-cosmic-teal' : 'text-cosmic-rose'}`}>
                        {progress}%
                      </span>
                    </div>
                    <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          isThresholdReached
                            ? 'bg-gradient-to-r from-cosmic-teal to-cosmic-success'
                            : progress >= 75
                            ? 'bg-gradient-to-r from-cosmic-amber to-cosmic-teal'
                            : 'bg-gradient-to-r from-cosmic-rose to-cosmic-violet'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                      {isThresholdReached && (
                        <div className="absolute inset-0 rounded-full animate-pulse opacity-30 bg-cosmic-teal" />
                      )}
                    </div>
                    {isThresholdReached && (
                      <div className="flex items-center gap-1.5 text-xs text-cosmic-teal font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Threshold Reached!
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-cosmic-muted">
                      <div className="w-5 h-5 rounded-full bg-cosmic-rose/20 flex items-center justify-center text-[9px] font-bold text-cosmic-rose">
                        {(proposal.creator.name || 'U')[0].toUpperCase()}
                      </div>
                      {proposal.creator.name || 'Anonymous'}
                    </div>
                    {proposal.closesAt && (
                      <div className="flex items-center gap-1 text-xs text-cosmic-muted">
                        <Clock className="w-3 h-3" />
                        {new Date(proposal.closesAt) > new Date()
                          ? `${Math.ceil((new Date(proposal.closesAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d left`
                          : 'Closed'}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  {proposal.status === 'collecting' ? (
                    <Button
                      className="w-full bg-cosmic-rose/10 text-cosmic-rose border border-cosmic-rose/20 hover:bg-cosmic-rose/20"
                      variant="ghost"
                      onClick={() => openSignDialog(proposal)}
                    >
                      <FileSignature className="w-4 h-4 mr-2" />
                      Sign Now
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </Button>
                  ) : (
                    <Link href={`/dashboard/participation/binding-proposals/${proposal.id}`}>
                      <Button
                        className="w-full bg-cosmic-violet/10 text-cosmic-violet border border-cosmic-violet/20 hover:bg-cosmic-violet/20"
                        variant="ghost"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Progress
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sign Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="bg-[#0B1022] border-white/10 text-white max-w-lg">
          {selectedProposal && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <FileSignature className="w-5 h-5 text-cosmic-rose" />
                  Sign This Proposal
                </DialogTitle>
                <DialogDescription className="text-cosmic-muted">
                  Add your signature to force government response
                </DialogDescription>
              </DialogHeader>

              {!signed ? (
                <div className="space-y-4">
                  <div className="glass-card p-4 rounded-xl">
                    <h3 className="text-white font-semibold mb-1">{selectedProposal.title}</h3>
                    <p className="text-sm text-cosmic-muted line-clamp-3">{selectedProposal.description}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-grow">
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cosmic-rose to-cosmic-violet"
                            style={{ width: `${progressPercent(selectedProposal.signatureCount, selectedProposal.signatureGoal)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-cosmic-muted whitespace-nowrap">
                        {selectedProposal.signatureCount}/{selectedProposal.signatureGoal}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-cosmic-muted mb-1 block">Comment (optional)</label>
                    <Textarea
                      placeholder="Why are you signing this proposal?"
                      className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 min-h-[80px]"
                      value={signComment}
                      onChange={(e) => setSignComment(e.target.value)}
                    />
                  </div>

                  <DialogFooter>
                    <Button variant="ghost" className="text-cosmic-muted hover:text-white" onClick={() => setSignDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="bg-cosmic-rose text-white hover:bg-cosmic-rose/90" onClick={handleSign} disabled={signing}>
                      {signing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSignature className="w-4 h-4 mr-2" />}
                      Sign Proposal
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${thresholdJustReached ? 'bg-cosmic-teal/20' : 'bg-cosmic-success/20'}`}>
                    <CheckCircle2 className={`w-8 h-8 ${thresholdJustReached ? 'text-cosmic-teal' : 'text-cosmic-success'}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white">You&apos;ve Signed!</h3>
                  <p className="text-cosmic-muted text-sm">
                    {thresholdJustReached
                      ? 'Threshold Reached! The government must now respond!'
                      : 'Share this proposal to help reach the threshold.'}
                  </p>
                  {thresholdJustReached && (
                    <div className="glass-card p-4 rounded-xl border border-cosmic-teal/20">
                      <p className="text-cosmic-teal text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        The government must now respond!
                      </p>
                    </div>
                  )}
                  <Button
                    className="bg-cosmic-rose/10 text-cosmic-rose border border-cosmic-rose/20 hover:bg-cosmic-rose/20"
                    variant="ghost"
                    onClick={() => setSignDialogOpen(false)}
                  >
                    <Share2 className="w-4 h-4 mr-2" /> Share to Collect Signatures
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#0B1022] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Gavel className="w-5 h-5 text-cosmic-rose" />
              Create Binding Proposal
            </DialogTitle>
            <DialogDescription className="text-cosmic-muted">
              Create a proposal that legally requires government response at threshold
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Title *</label>
              <Input
                placeholder="What change do you demand?"
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Description *</label>
              <Textarea
                placeholder="Describe the proposal in detail. What problem does it address? What solution are you proposing?"
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 min-h-[100px]"
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Type</label>
                <Select value={createForm.type} onValueChange={(v) => setCreateForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="binding_proposal">Binding Proposal</SelectItem>
                    <SelectItem value="binding_referendum">Binding Referendum</SelectItem>
                    <SelectItem value="citizen_bill">Citizen Bill</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Category</label>
                <Select value={createForm.category} onValueChange={(v) => setCreateForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="environment">Environment</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="housing">Housing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Signature Goal</label>
              <Input
                type="number"
                min={100}
                max={1000000}
                className="bg-white/5 border-white/10 text-white"
                value={createForm.signatureGoal}
                onChange={(e) => setCreateForm((f) => ({ ...f, signatureGoal: parseInt(e.target.value) || 5000 }))}
              />
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Legal Reference (optional)</label>
              <Input
                placeholder="e.g., Article 47 of the Constitution"
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                value={createForm.legalReference}
                onChange={(e) => setCreateForm((f) => ({ ...f, legalReference: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Impact Assessment (optional)</label>
              <Textarea
                placeholder="Describe the expected impact of this proposal..."
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 min-h-[80px]"
                value={createForm.impactAssessment}
                onChange={(e) => setCreateForm((f) => ({ ...f, impactAssessment: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Response Deadline</label>
                <Input
                  type="datetime-local"
                  className="bg-white/5 border-white/10 text-white"
                  value={createForm.responseDeadline}
                  onChange={(e) => setCreateForm((f) => ({ ...f, responseDeadline: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Closes At</label>
                <Input
                  type="datetime-local"
                  className="bg-white/5 border-white/10 text-white"
                  value={createForm.closesAt}
                  onChange={(e) => setCreateForm((f) => ({ ...f, closesAt: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" className="text-cosmic-muted hover:text-white" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-cosmic-rose text-white hover:bg-cosmic-rose/90"
              onClick={handleCreate}
              disabled={creating || !createForm.title || !createForm.description}
            >
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Gavel className="w-4 h-4 mr-2" />}
              Create Binding Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
