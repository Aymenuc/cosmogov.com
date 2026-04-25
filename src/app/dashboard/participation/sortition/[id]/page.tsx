'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
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
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import {
  Dices,
  Loader2,
  Users,
  CheckCircle2,
  UserCheck,
  Building2,
  Clock,
  Handshake,
  Shield,
  Eye,
  ArrowLeft,
  Play,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

interface Candidate {
  id: string;
  status: string;
  userId: string;
  demographics: string;
  motivation: string | null;
  verifiedAt: string | null;
  createdAt: string;
  user: { id: string; name: string | null; avatarUrl: string | null; ageGroup: string | null };
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
  demographicTargets: string;
  criteria: string;
  selectionDate: string | null;
  termStartsAt: string | null;
  termEndsAt: string | null;
  createdAt: string;
  createdBy: string;
  creator: { id: string; name: string | null; avatarUrl: string | null; role: string };
  candidates: Candidate[];
}

const PURPOSE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  citizen_assembly: { label: 'Citizen Assembly', color: 'text-cosmic-violet bg-cosmic-violet/10 border-cosmic-violet/20', icon: Building2 },
  jury: { label: 'Jury', color: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20', icon: Shield },
  advisory_panel: { label: 'Advisory Panel', color: 'text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20', icon: Handshake },
  working_group: { label: 'Working Group', color: 'text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20', icon: Users },
  review_committee: { label: 'Review Committee', color: 'text-cosmic-accent bg-cosmic-accent/10 border-cosmic-accent/20', icon: Eye },
};

const STATUS_STEPS = [
  { key: 'recruiting', label: 'Recruiting' },
  { key: 'selection', label: 'Selection' },
  { key: 'selected', label: 'Selected' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

export default function SortitionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningSelection, setRunningSelection] = useState(false);

  // Volunteer dialog
  const [volunteerDialogOpen, setVolunteerDialogOpen] = useState(false);
  const [volunteerForm, setVolunteerForm] = useState({ ageGroup: '', gender: '', district: '', occupation: '', motivation: '' });
  const [volunteering, setVolunteering] = useState(false);
  const [volunteered, setVolunteered] = useState(false);

  const fetchPool = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sortition/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPool(data.pool);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchPool(); }, [fetchPool]);

  const handleVolunteer = async () => {
    setVolunteering(true);
    try {
      const res = await fetch(`/api/sortition/${id}/volunteer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demographics: { ageGroup: volunteerForm.ageGroup, gender: volunteerForm.gender, district: volunteerForm.district, occupation: volunteerForm.occupation },
          motivation: volunteerForm.motivation,
        }),
      });
      if (res.ok) {
        setVolunteered(true);
        fetchPool();
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

  const handleRunSelection = async () => {
    if (!confirm('Run the democratic lottery selection? This will randomly select members from the candidate pool.')) return;
    setRunningSelection(true);
    try {
      const res = await fetch(`/api/sortition/${id}/select`, { method: 'POST' });
      if (res.ok) {
        fetchPool();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to run selection');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunningSelection(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cosmic-violet animate-spin" />
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="glass-card p-12 rounded-2xl text-center">
        <Dices className="w-12 h-12 text-cosmic-muted/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Pool Not Found</h3>
        <Link href="/dashboard/participation/sortition">
          <Button className="bg-cosmic-violet text-white hover:bg-cosmic-violet/90">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sortition
          </Button>
        </Link>
      </div>
    );
  }

  const purposeConfig = PURPOSE_CONFIG[pool.purpose] || PURPOSE_CONFIG.citizen_assembly;
  const PurposeIcon = purposeConfig.icon;
  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === pool.status);

  // Parse selected members
  let selectedMembers: Array<{ candidateId?: string; userId?: string; name?: string; avatarUrl?: string | null; demographics?: Record<string, string> }> = [];
  try {
    selectedMembers = pool.selectedMembers ? JSON.parse(pool.selectedMembers) : [];
  } catch { /* empty */ }

  // Parse demographic targets
  let demographicTargets: Record<string, Record<string, number>> = {};
  try {
    demographicTargets = pool.demographicTargets ? JSON.parse(pool.demographicTargets) : {};
  } catch { /* empty */ }

  // Compute demographic breakdown from selected members
  const demographicBreakdown: Record<string, Record<string, number>> = {};
  for (const member of selectedMembers) {
    if (member.demographics) {
      for (const [key, value] of Object.entries(member.demographics)) {
        if (!demographicBreakdown[key]) demographicBreakdown[key] = {};
        demographicBreakdown[key][value] = (demographicBreakdown[key][value] || 0) + 1;
      }
    }
  }

  return (
    <div className="space-y-4 sm:space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Back navigation */}
      <Link href="/dashboard/participation/sortition" className="inline-flex items-center gap-1.5 text-sm text-cosmic-muted hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Sortition
      </Link>

      {/* Pool Info Card */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl glass-card-violet p-4 sm:p-6 lg:p-8">
        <div className="absolute inset-0 starfield opacity-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <PurposeIcon className="w-5 h-5 text-cosmic-violet" />
            <Badge className={`${purposeConfig.color} text-[10px] border`}>
              {purposeConfig.label}
            </Badge>
            <Badge className="text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20 text-[10px] border">
              {pool.selectionMethod === 'stratified_random' ? 'Stratified Random' : 'Simple Random'}
            </Badge>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-2">
            {pool.name}
          </h1>
          <p className="text-cosmic-muted text-sm sm:text-base max-w-3xl">
            {pool.description}
          </p>

          {/* Info row */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-cosmic-muted">
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              {pool.selectionSize} seats
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {pool.candidates?.length || pool.candidateCount} candidates
            </span>
            {pool.selectionDate && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Selected: {new Date(pool.selectionDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <Card className="glass-card rounded-2xl">
        <CardHeader className="pb-2">
          <h2 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cosmic-violet" />
            Selection Timeline
          </h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
            {STATUS_STEPS.map((step, idx) => {
              const isActive = idx === currentStepIdx;
              const isCompleted = idx < currentStepIdx;
              return (
                <div key={step.key} className="flex items-center shrink-0">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    isActive
                      ? 'bg-cosmic-violet/20 text-cosmic-violet border-cosmic-violet/30'
                      : isCompleted
                      ? 'bg-cosmic-success/10 text-cosmic-success border-cosmic-success/20'
                      : 'bg-white/5 text-cosmic-muted border-white/10'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : isActive ? <Dices className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full bg-white/10" />}
                    {step.label}
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div className={`w-4 sm:w-8 h-0.5 mx-1 ${isCompleted ? 'bg-cosmic-success/30' : 'bg-white/10'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Criteria card */}
      {pool.criteria && pool.criteria !== '{}' && (
        <Card className="glass-card rounded-2xl">
          <CardHeader className="pb-2">
            <h2 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cosmic-amber" />
              Selection Criteria
            </h2>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-cosmic-muted whitespace-pre-wrap">{JSON.stringify(JSON.parse(pool.criteria), null, 2)}</pre>
          </CardContent>
        </Card>
      )}

      {/* Volunteer section (if recruiting) */}
      {pool.status === 'recruiting' && (
        <Card className="glass-card rounded-2xl border-cosmic-violet/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">This pool is recruiting!</h3>
                <p className="text-cosmic-muted text-sm">Volunteer now to be considered for random selection. Every citizen has an equal chance.</p>
              </div>
              <Button
                className="bg-cosmic-violet text-white hover:bg-cosmic-violet/90 shrink-0"
                onClick={() => {
                  setVolunteerForm({ ageGroup: '', gender: '', district: '', occupation: '', motivation: '' });
                  setVolunteered(false);
                  setVolunteerDialogOpen(true);
                }}
              >
                <Handshake className="w-4 h-4 mr-2" /> Volunteer Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Run Selection (admin, if recruiting) */}
      {pool.status === 'recruiting' && (
        <Card className="glass-card rounded-2xl">
          <CardHeader className="pb-2">
            <h2 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-cosmic-amber" />
              Run Selection (Admin)
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-cosmic-muted text-sm mb-4">
              Run the democratic lottery algorithm to randomly select {pool.selectionSize} members from {pool.candidates?.length || 0} candidates.
              {pool.selectionMethod === 'stratified_random' && ' Stratified selection will respect demographic targets as closely as possible.'}
            </p>
            <Button
              className="bg-cosmic-amber text-white hover:bg-cosmic-amber/90"
              onClick={handleRunSelection}
              disabled={runningSelection || (pool.candidates?.length || 0) === 0}
            >
              {runningSelection ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Dices className="w-4 h-4 mr-2" />}
              Run Democratic Lottery
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Selected Members Grid with Avatars */}
      {selectedMembers.length > 0 && (
        <Card className="glass-card rounded-2xl">
          <CardHeader className="pb-2">
            <h2 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-cosmic-success" />
              Selected Members ({selectedMembers.length})
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedMembers.map((member, idx) => (
                <div key={member.userId || idx} className="glass-card p-4 rounded-xl flex items-center gap-3">
                  <Avatar className="w-10 h-10 shrink-0">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name || 'Member'} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-cosmic-violet/20 text-cosmic-violet text-sm font-bold">
                        {(member.name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{member.name || 'Anonymous'}</p>
                    {member.demographics && Object.keys(member.demographics).length > 0 && (
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {Object.entries(member.demographics).map(([key, val]) => (
                          <span key={key} className="text-[10px] text-cosmic-muted bg-white/5 px-1.5 py-0.5 rounded">
                            {val}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demographic Targets vs Actual */}
      {Object.keys(demographicTargets).length > 0 && selectedMembers.length > 0 && (
        <Card className="glass-card rounded-2xl">
          <CardHeader className="pb-2">
            <h2 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cosmic-amber" />
              Demographic Breakdown
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(demographicTargets).map(([dimension, targets]) => (
                <div key={dimension}>
                  <h3 className="text-sm font-medium text-white mb-2 capitalize">{dimension}</h3>
                  <div className="space-y-2">
                    {Object.entries(targets).map(([category, targetRatio]) => {
                      const actual = demographicBreakdown[dimension]?.[category] || 0;
                      const actualRatio = selectedMembers.length > 0 ? actual / selectedMembers.length : 0;
                      const targetPercent = Math.round(targetRatio * 100);
                      const actualPercent = Math.round(actualRatio * 100);

                      return (
                        <div key={category} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-cosmic-muted capitalize">{category}</span>
                            <span className="text-cosmic-muted">
                              Target: {targetPercent}% | Actual: {actualPercent}%
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cosmic-amber/50 rounded-full"
                                style={{ width: `${targetPercent}%` }}
                              />
                            </div>
                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${Math.abs(actualPercent - targetPercent) <= 10 ? 'bg-cosmic-violet' : 'bg-cosmic-rose'}`}
                                style={{ width: `${actualPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidate List */}
      {pool.candidates && pool.candidates.length > 0 && (
        <Card className="glass-card rounded-2xl">
          <CardHeader className="pb-2">
            <h2 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cosmic-violet" />
              Candidates ({pool.candidates.length})
            </h2>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {pool.candidates.map((candidate) => {
                let demo: Record<string, string> = {};
                try { demo = candidate.demographics ? JSON.parse(candidate.demographics) : {}; } catch { /* empty */ }
                const statusColors: Record<string, string> = {
                  volunteered: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20',
                  verified: 'text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20',
                  selected: 'text-cosmic-success bg-cosmic-success/10 border-cosmic-success/20',
                  declined: 'text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20',
                  alternate: 'text-cosmic-violet bg-cosmic-violet/10 border-cosmic-violet/20',
                };
                const sc = statusColors[candidate.status] || statusColors.volunteered;

                return (
                  <div key={candidate.id} className="glass-card p-3 rounded-xl flex items-center gap-3">
                    <Avatar className="w-8 h-8 shrink-0">
                      {candidate.user.avatarUrl ? (
                        <img src={candidate.user.avatarUrl} alt={candidate.user.name || 'Candidate'} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <AvatarFallback className="bg-cosmic-violet/20 text-cosmic-violet text-xs font-bold">
                          {(candidate.user.name || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{candidate.user.name || 'Anonymous'}</span>
                        <Badge className={`${sc} text-[9px] border`}>{candidate.status}</Badge>
                      </div>
                      {Object.keys(demo).length > 0 && (
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          {Object.entries(demo).map(([key, val]) => (
                            <span key={key} className="text-[10px] text-cosmic-muted bg-white/5 px-1.5 py-0.5 rounded capitalize">{val}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Volunteer Dialog */}
      <Dialog open={volunteerDialogOpen} onOpenChange={setVolunteerDialogOpen}>
        <DialogContent className="bg-[#0B1022] border-white/10 text-white max-w-lg">
          {pool && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-cosmic-violet" />
                  Volunteer for {pool.name}
                </DialogTitle>
                <DialogDescription className="text-cosmic-muted">
                  Submit your demographics for stratified selection
                </DialogDescription>
              </DialogHeader>

              {!volunteered ? (
                <div className="space-y-4">
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
                    You are now in the democratic lottery. Every volunteer has an equal chance of being selected.
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
    </div>
  );
}
