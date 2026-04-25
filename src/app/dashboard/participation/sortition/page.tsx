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
  Dices,
  Plus,
  Loader2,
  Users,
  CheckCircle2,
  UserCheck,
  Building2,
  Clock,
  ChevronRight,
  Zap,
  Eye,
  Handshake,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

interface Candidate {
  id: string;
  status: string;
  userId: string;
  demographics: string;
}

interface Pool {
  id: string;
  name: string;
  description: string;
  purpose: string;
  selectionSize: number;
  candidateCount: number;
  status: string;
  selectionMethod: string;
  selectedMembers: string;
  selectionDate: string | null;
  termStartsAt: string | null;
  termEndsAt: string | null;
  createdAt: string;
  createdBy: string;
  creator: { id: string; name: string | null; avatarUrl: string | null };
  candidates: Candidate[];
}

interface Stats {
  activePools: number;
  totalCandidates: number;
  selectedCitizens: number;
  activeAssemblies: number;
}

const PURPOSE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  citizen_assembly: { label: 'Citizen Assembly', color: 'text-cosmic-violet bg-cosmic-violet/10 border-cosmic-violet/20', icon: Building2 },
  jury: { label: 'Jury', color: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20', icon: Shield },
  advisory_panel: { label: 'Advisory Panel', color: 'text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20', icon: Handshake },
  working_group: { label: 'Working Group', color: 'text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20', icon: Users },
  review_committee: { label: 'Review Committee', color: 'text-cosmic-accent bg-cosmic-accent/10 border-cosmic-accent/20', icon: Eye },
};

const PURPOSE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'citizen_assembly', label: 'Assembly' },
  { key: 'jury', label: 'Jury' },
  { key: 'advisory_panel', label: 'Advisory' },
  { key: 'working_group', label: 'Working Group' },
  { key: 'review_committee', label: 'Review' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  recruiting: { label: 'Recruiting', color: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20' },
  selection: { label: 'Selection', color: 'text-cosmic-violet bg-cosmic-violet/10 border-cosmic-violet/20' },
  selected: { label: 'Selected', color: 'text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20' },
  active: { label: 'Active', color: 'text-cosmic-success bg-cosmic-success/10 border-cosmic-success/20' },
  completed: { label: 'Completed', color: 'text-cosmic-muted bg-white/5 border-white/10' },
};

export default function SortitionPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [stats, setStats] = useState<Stats>({ activePools: 0, totalCandidates: 0, selectedCitizens: 0, activeAssemblies: 0 });
  const [loading, setLoading] = useState(true);
  const [purposeFilter, setPurposeFilter] = useState('all');

  // Volunteer dialog
  const [volunteerDialogOpen, setVolunteerDialogOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [volunteerForm, setVolunteerForm] = useState({ ageGroup: '', gender: '', district: '', occupation: '', motivation: '' });
  const [volunteering, setVolunteering] = useState(false);
  const [volunteered, setVolunteered] = useState(false);

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    purpose: 'citizen_assembly',
    selectionSize: 25,
    selectionMethod: 'stratified_random',
    termStartsAt: '',
    termEndsAt: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchPools = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (purposeFilter !== 'all') params.set('purpose', purposeFilter);
      const res = await fetch(`/api/sortition?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPools(data.pools);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [purposeFilter]);

  useEffect(() => { fetchPools(); }, [fetchPools]);

  const handleVolunteer = async () => {
    if (!selectedPool) return;
    setVolunteering(true);
    try {
      const res = await fetch(`/api/sortition/${selectedPool.id}/volunteer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demographics: { ageGroup: volunteerForm.ageGroup, gender: volunteerForm.gender, district: volunteerForm.district, occupation: volunteerForm.occupation },
          motivation: volunteerForm.motivation,
        }),
      });
      if (res.ok) {
        setVolunteered(true);
        fetchPools();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to volunteer');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVolunteering(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.description) return;
    setCreating(true);
    try {
      const res = await fetch('/api/sortition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        setCreateDialogOpen(false);
        setCreateForm({ name: '', description: '', purpose: 'citizen_assembly', selectionSize: 25, selectionMethod: 'stratified_random', termStartsAt: '', termEndsAt: '' });
        fetchPools();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create pool');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const openVolunteerDialog = (pool: Pool) => {
    setSelectedPool(pool);
    setVolunteerForm({ ageGroup: '', gender: '', district: '', occupation: '', motivation: '' });
    setVolunteered(false);
    setVolunteerDialogOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Hero Section — cosmic-violet theme */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl glass-card-violet p-4 sm:p-6 lg:p-8">
        <div className="absolute inset-0 starfield opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Dices className="w-5 h-5 text-cosmic-violet" />
            <span className="text-cosmic-violet text-sm font-semibold tracking-wider uppercase">Democratic Lottery</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            Sortition —{' '}
            <span className="text-gradient-violet">Fair Representation</span>
          </h1>
          <p className="text-cosmic-muted text-sm sm:text-base max-w-2xl mb-4 sm:mb-8">
            Fair representation through random selection — sortition ensures every citizen has an equal chance to participate in decision-making bodies.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {[
              { label: 'Active Pools', value: stats.activePools, icon: Dices, color: 'text-cosmic-violet' },
              { label: 'Candidates', value: stats.totalCandidates, icon: Users, color: 'text-cosmic-teal' },
              { label: 'Selected Citizens', value: stats.selectedCitizens, icon: UserCheck, color: 'text-cosmic-amber' },
              { label: 'Active Assemblies', value: stats.activeAssemblies, icon: Building2, color: 'text-cosmic-success' },
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

      {/* Action Bar — Purpose filter tabs + Create button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Purpose filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 w-full sm:w-auto">
          {PURPOSE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPurposeFilter(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                purposeFilter === tab.key
                  ? 'bg-cosmic-violet/20 text-cosmic-violet border-cosmic-violet/30'
                  : 'bg-white/5 text-cosmic-muted border-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button
          className="bg-cosmic-violet text-white hover:bg-cosmic-violet/90 shrink-0"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Create Pool
        </Button>
      </div>

      {/* Pool Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-cosmic-violet animate-spin" />
        </div>
      ) : pools.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <Dices className="w-12 h-12 text-cosmic-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Sortition Pools Yet</h3>
          <p className="text-cosmic-muted text-sm mb-4">Be the first to create a democratic lottery pool for fair representation.</p>
          <Button className="bg-cosmic-violet text-white hover:bg-cosmic-violet/90" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Pool
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {pools.map((pool) => {
            const purposeConfig = PURPOSE_CONFIG[pool.purpose] || PURPOSE_CONFIG.citizen_assembly;
            const statusConfig = STATUS_CONFIG[pool.status] || STATUS_CONFIG.recruiting;
            const PurposeIcon = purposeConfig.icon;
            const candidateCount = pool.candidates?.length || pool.candidateCount;

            return (
              <Card key={pool.id} className="glass-card rounded-2xl hover:scale-[1.01] transition-all duration-300 group h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between mb-2 flex-wrap gap-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-grow">
                      <Badge className={`${purposeConfig.color} text-[10px] border`}>
                        <PurposeIcon className="w-3 h-3 mr-1" />
                        {purposeConfig.label}
                      </Badge>
                    </div>
                    <Badge className={`${statusConfig.color} text-[10px] border`}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold text-white group-hover:text-cosmic-violet transition-colors line-clamp-2">
                    {pool.name}
                  </h3>
                  <p className="text-xs text-cosmic-muted line-clamp-2 mt-1">
                    {pool.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Info row */}
                  <div className="flex items-center gap-4 text-xs text-cosmic-muted">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      {pool.selectionSize} seats
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {candidateCount} candidates
                    </span>
                  </div>

                  {/* Selection date */}
                  {pool.selectionDate && (
                    <div className="flex items-center gap-1.5 text-xs text-cosmic-muted">
                      <Clock className="w-3 h-3" />
                      Selected: {new Date(pool.selectionDate).toLocaleDateString()}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-cosmic-muted">
                      <div className="w-5 h-5 rounded-full bg-cosmic-violet/20 flex items-center justify-center text-[9px] font-bold text-cosmic-violet">
                        {(pool.creator.name || 'U')[0].toUpperCase()}
                      </div>
                      {pool.creator.name || 'Anonymous'}
                    </div>
                  </div>

                  {/* Action Button */}
                  {pool.status === 'recruiting' ? (
                    <Button
                      className="w-full bg-cosmic-violet/10 text-cosmic-violet border border-cosmic-violet/20 hover:bg-cosmic-violet/20"
                      variant="ghost"
                      onClick={() => openVolunteerDialog(pool)}
                    >
                      <Handshake className="w-4 h-4 mr-2" />
                      Volunteer
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </Button>
                  ) : (
                    <Link href={`/dashboard/participation/sortition/${pool.id}`}>
                      <Button
                        className="w-full bg-cosmic-teal/10 text-cosmic-teal border border-cosmic-teal/20 hover:bg-cosmic-teal/20"
                        variant="ghost"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Results
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

      {/* Volunteer Dialog */}
      <Dialog open={volunteerDialogOpen} onOpenChange={setVolunteerDialogOpen}>
        <DialogContent className="bg-[#0B1022] border-white/10 text-white max-w-lg">
          {selectedPool && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-cosmic-violet" />
                  Volunteer for Sortition
                </DialogTitle>
                <DialogDescription className="text-cosmic-muted">
                  Apply to be considered for {selectedPool.name}
                </DialogDescription>
              </DialogHeader>

              {!volunteered ? (
                <div className="space-y-4">
                  <div className="glass-card p-4 rounded-xl">
                    <h3 className="text-white font-semibold mb-1">{selectedPool.name}</h3>
                    <p className="text-sm text-cosmic-muted line-clamp-3">{selectedPool.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-cosmic-muted">
                      <span>{selectedPool.selectionSize} seats</span>
                      <span>{selectedPool.candidateCount} candidates</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white">Demographics (for stratified selection)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-cosmic-muted mb-1 block">Age Group</label>
                        <Select value={volunteerForm.ageGroup} onValueChange={(v) => setVolunteerForm((f) => ({ ...f, ageGroup: v }))}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="youth">Youth (18-25)</SelectItem>
                            <SelectItem value="young_adult">Young Adult (26-35)</SelectItem>
                            <SelectItem value="adult">Adult (36-55)</SelectItem>
                            <SelectItem value="senior">Senior (56+)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-cosmic-muted mb-1 block">Gender</label>
                        <Select value={volunteerForm.gender} onValueChange={(v) => setVolunteerForm((f) => ({ ...f, gender: v }))}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="non_binary">Non-binary</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-cosmic-muted mb-1 block">District / Region</label>
                      <Input
                        placeholder="Your district or region"
                        className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                        value={volunteerForm.district}
                        onChange={(e) => setVolunteerForm((f) => ({ ...f, district: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-cosmic-muted mb-1 block">Occupation</label>
                      <Input
                        placeholder="Your occupation"
                        className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                        value={volunteerForm.occupation}
                        onChange={(e) => setVolunteerForm((f) => ({ ...f, occupation: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-cosmic-muted mb-1 block">Why do you want to participate? (optional)</label>
                      <Textarea
                        placeholder="Share your motivation..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 min-h-[80px]"
                        value={volunteerForm.motivation}
                        onChange={(e) => setVolunteerForm((f) => ({ ...f, motivation: e.target.value }))}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="ghost" className="text-cosmic-muted hover:text-white" onClick={() => setVolunteerDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="bg-cosmic-violet text-white hover:bg-cosmic-violet/90" onClick={handleVolunteer} disabled={volunteering}>
                      {volunteering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Handshake className="w-4 h-4 mr-2" />}
                      Volunteer
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-cosmic-violet/20">
                    <CheckCircle2 className="w-8 h-8 text-cosmic-violet" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">You&apos;ve Volunteered!</h3>
                  <p className="text-cosmic-muted text-sm">
                    Your name is now in the democratic lottery. Selection is random and fair — every volunteer has an equal chance.
                  </p>
                  <Button
                    className="bg-cosmic-violet/10 text-cosmic-violet border border-cosmic-violet/20 hover:bg-cosmic-violet/20"
                    variant="ghost"
                    onClick={() => setVolunteerDialogOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Pool Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#0B1022] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-cosmic-amber" />
              Create Sortition Pool
            </DialogTitle>
            <DialogDescription className="text-cosmic-muted">
              Set up a new democratic lottery for fair citizen representation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Pool Name *</label>
              <Input
                placeholder="e.g., Climate Action Citizen Assembly"
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Description *</label>
              <Textarea
                placeholder="Describe the purpose and scope of this sortition pool..."
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 min-h-[100px]"
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Purpose</label>
                <Select value={createForm.purpose} onValueChange={(v) => setCreateForm((f) => ({ ...f, purpose: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="citizen_assembly">Citizen Assembly</SelectItem>
                    <SelectItem value="jury">Jury</SelectItem>
                    <SelectItem value="advisory_panel">Advisory Panel</SelectItem>
                    <SelectItem value="working_group">Working Group</SelectItem>
                    <SelectItem value="review_committee">Review Committee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Selection Size</label>
                <Input
                  type="number"
                  min={5}
                  max={500}
                  className="bg-white/5 border-white/10 text-white"
                  value={createForm.selectionSize}
                  onChange={(e) => setCreateForm((f) => ({ ...f, selectionSize: parseInt(e.target.value) || 25 }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Selection Method</label>
              <Select value={createForm.selectionMethod} onValueChange={(v) => setCreateForm((f) => ({ ...f, selectionMethod: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stratified_random">Stratified Random</SelectItem>
                  <SelectItem value="simple_random">Simple Random</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Term Starts</label>
                <Input
                  type="datetime-local"
                  className="bg-white/5 border-white/10 text-white"
                  value={createForm.termStartsAt}
                  onChange={(e) => setCreateForm((f) => ({ ...f, termStartsAt: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Term Ends</label>
                <Input
                  type="datetime-local"
                  className="bg-white/5 border-white/10 text-white"
                  value={createForm.termEndsAt}
                  onChange={(e) => setCreateForm((f) => ({ ...f, termEndsAt: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" className="text-cosmic-muted hover:text-white" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-cosmic-violet text-white hover:bg-cosmic-violet/90"
              onClick={handleCreate}
              disabled={creating || !createForm.name || !createForm.description}
            >
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Dices className="w-4 h-4 mr-2" />}
              Create Pool
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
