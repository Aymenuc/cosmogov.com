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
  Users,
  Plus,
  Search,
  Loader2,
  Calendar,
  Clock,
  Globe2,
  MapPin,
  Building2,
  Lightbulb,
  Shield,
  UserPlus,
  ChevronRight,
  Star,
  Eye,
} from 'lucide-react';

interface AssemblyMember {
  id: string;
  role: string;
  user: { id: string; name: string | null; avatarUrl: string | null };
}

interface Assembly {
  id: string;
  name: string;
  slug: string;
  description: string;
  purpose: string;
  scope: string;
  meetingCadence: string;
  memberCount: number;
  isPublic: boolean;
  createdAt: string;
  createdBy: string;
  creator: { id: string; name: string | null; avatarUrl: string | null };
  members: AssemblyMember[];
  _count: { members: number; meetings: number };
  meetings: { id: string; title: string; startsAt: string; type: string }[];
}

const PURPOSE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  deliberation: { label: 'Deliberation', color: 'text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20', icon: Lightbulb },
  advisory: { label: 'Advisory', color: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20', icon: Shield },
  decision_making: { label: 'Decision Making', color: 'text-cosmic-violet bg-cosmic-violet/10 border-cosmic-violet/20', icon: Star },
  working_group: { label: 'Working Group', color: 'text-cosmic-accent bg-cosmic-accent/10 border-cosmic-accent/20', icon: Users },
};

const SCOPE_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  general: { label: 'General', icon: Globe2 },
  neighborhood: { label: 'Neighborhood', icon: MapPin },
  thematic: { label: 'Thematic', icon: Lightbulb },
  sectoral: { label: 'Sectoral', icon: Building2 },
};

const CADENCE_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  ad_hoc: 'Ad Hoc',
};

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  coordinator: { label: 'Coordinator', color: 'text-cosmic-amber' },
  facilitator: { label: 'Facilitator', color: 'text-cosmic-teal' },
  member: { label: 'Member', color: 'text-cosmic-accent' },
  observer: { label: 'Observer', color: 'text-cosmic-muted' },
};

export default function AssembliesPage() {
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ purpose: 'all', scope: 'all', search: '' });

  // Join dialog
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedAssembly, setSelectedAssembly] = useState<Assembly | null>(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailAssembly, setDetailAssembly] = useState<Assembly | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailIsMember, setDetailIsMember] = useState(false);
  const [detailMemberRole, setDetailMemberRole] = useState<string | null>(null);

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '', description: '', purpose: 'deliberation', scope: 'general',
    meetingCadence: 'monthly', isPublic: true,
  });
  const [creating, setCreating] = useState(false);

  const fetchAssemblies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.purpose !== 'all') params.set('purpose', filters.purpose);
      if (filters.scope !== 'all') params.set('scope', filters.scope);
      if (filters.search) params.set('search', filters.search);

      const res = await fetch(`/api/participation/assemblies?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAssemblies(data.assemblies);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchAssemblies(); }, [fetchAssemblies]);

  const openJoinDialog = (assembly: Assembly) => {
    setSelectedAssembly(assembly);
    setJoined(false);
    setJoinDialogOpen(true);
  };

  const handleJoin = async () => {
    if (!selectedAssembly) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/participation/assemblies/${selectedAssembly.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setJoined(true);
        fetchAssemblies();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to join');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  const openDetail = async (assembly: Assembly) => {
    setDetailAssembly(assembly);
    setDetailDialogOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/participation/assemblies/${assembly.id}`);
      if (res.ok) {
        const data = await res.json();
        setDetailAssembly(data.assembly);
        setDetailIsMember(data.isMember);
        setDetailMemberRole(data.memberRole);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.description) return;
    setCreating(true);
    try {
      const res = await fetch('/api/participation/assemblies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        setCreateDialogOpen(false);
        setCreateForm({ name: '', description: '', purpose: 'deliberation', scope: 'general', meetingCadence: 'monthly', isPublic: true });
        fetchAssemblies();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create assembly');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl glass-card-teal p-8 lg:p-12">
        <div className="absolute inset-0 starfield opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-cosmic-teal" />
            <span className="text-cosmic-teal text-sm font-semibold tracking-wider uppercase">Assemblies</span>
          </div>
          <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-2">
            Deliberate Together,{' '}
            <span className="text-gradient">Decide Together</span>
          </h1>
          <p className="text-cosmic-muted max-w-2xl mb-8">
            Assemblies are ongoing spaces for collective deliberation. Join or create assemblies to discuss, advise, and make decisions that shape your community.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Assemblies', value: assemblies.length, icon: Users, color: 'text-cosmic-teal' },
              { label: 'Total Members', value: assemblies.reduce((s, a) => s + a._count.members, 0), icon: UserPlus, color: 'text-cosmic-violet' },
              { label: 'Deliberative', value: assemblies.filter(a => a.purpose === 'deliberation').length, icon: Lightbulb, color: 'text-cosmic-amber' },
              { label: 'Decision Making', value: assemblies.filter(a => a.purpose === 'decision_making').length, icon: Star, color: 'text-cosmic-accent' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-cosmic-muted">{stat.label}</span>
                </div>
                <p className={`text-xl font-bold font-heading ${stat.color}`}>
                  {stat.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-grow">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cosmic-muted" />
            <Input
              placeholder="Search assemblies..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>
          <Select value={filters.purpose} onValueChange={(v) => setFilters((f) => ({ ...f, purpose: v }))}>
            <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Purposes</SelectItem>
              <SelectItem value="deliberation">Deliberation</SelectItem>
              <SelectItem value="advisory">Advisory</SelectItem>
              <SelectItem value="decision_making">Decision Making</SelectItem>
              <SelectItem value="working_group">Working Group</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.scope} onValueChange={(v) => setFilters((f) => ({ ...f, scope: v }))}>
            <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scopes</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="neighborhood">Neighborhood</SelectItem>
              <SelectItem value="thematic">Thematic</SelectItem>
              <SelectItem value="sectoral">Sectoral</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          className="bg-cosmic-teal text-[#0B1022] hover:bg-cosmic-teal/90 shrink-0"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Create Assembly
        </Button>
      </div>

      {/* Assembly Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-cosmic-teal animate-spin" />
        </div>
      ) : assemblies.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <Users className="w-12 h-12 text-cosmic-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Assemblies Yet</h3>
          <p className="text-cosmic-muted text-sm mb-4">Create the first assembly and start deliberating with your community.</p>
          <Button className="bg-cosmic-teal text-[#0B1022] hover:bg-cosmic-teal/90" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Assembly
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {assemblies.map((assembly) => {
            const purposeConfig = PURPOSE_CONFIG[assembly.purpose] || PURPOSE_CONFIG.deliberation;
            const scopeConfig = SCOPE_CONFIG[assembly.scope] || SCOPE_CONFIG.general;
            const ScopeIcon = scopeConfig.icon;
            const PurposeIcon = purposeConfig.icon;
            const nextMeeting = assembly.meetings?.[0];

            return (
              <Card key={assembly.id} className="glass-card rounded-2xl hover:scale-[1.01] transition-all duration-300 group h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={`${purposeConfig.color} text-[10px] border`}>
                      <PurposeIcon className="w-3 h-3 mr-1" />
                      {purposeConfig.label}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <Badge className="text-[10px] bg-white/5 border-white/10 text-cosmic-muted">
                        <ScopeIcon className="w-3 h-3 mr-1" />
                        {scopeConfig.label}
                      </Badge>
                      {!assembly.isPublic && (
                        <Eye className="w-3 h-3 text-cosmic-muted/50" />
                      )}
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-white group-hover:text-cosmic-teal transition-colors">
                    {assembly.name}
                  </h3>
                  <p className="text-xs text-cosmic-muted line-clamp-2 mt-1">
                    {assembly.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cadence */}
                  <div className="flex items-center gap-2 text-xs text-cosmic-muted">
                    <Calendar className="w-3.5 h-3.5 text-cosmic-teal" />
                    <span>{CADENCE_LABELS[assembly.meetingCadence] || assembly.meetingCadence}</span>
                  </div>

                  {/* Next Meeting */}
                  {nextMeeting && (
                    <div className="glass-card p-3 rounded-xl">
                      <div className="flex items-center gap-2 text-xs text-cosmic-teal font-medium mb-1">
                        <Clock className="w-3 h-3" />
                        Next Meeting
                      </div>
                      <p className="text-xs text-white font-medium">{nextMeeting.title}</p>
                      <p className="text-[10px] text-cosmic-muted mt-0.5">
                        {new Date(nextMeeting.startsAt).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}

                  {/* Member Avatars */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {assembly.members.slice(0, 5).map((member, idx) => (
                        <div
                          key={member.id}
                          className="w-7 h-7 rounded-full bg-cosmic-teal/20 flex items-center justify-center text-[10px] font-bold text-cosmic-teal border-2 border-[#0B1022] -ml-1 first:ml-0"
                          style={{ zIndex: 5 - idx }}
                        >
                          {(member.user.name || 'U')[0].toUpperCase()}
                        </div>
                      ))}
                      {assembly._count.members > 5 && (
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-cosmic-muted border-2 border-[#0B1022] -ml-1">
                          +{assembly._count.members - 5}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-cosmic-muted">
                      {assembly._count.members} member{assembly._count.members !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-white/5">
                    <Button
                      className="flex-1 bg-cosmic-teal/10 text-cosmic-teal border border-cosmic-teal/20 hover:bg-cosmic-teal/20"
                      variant="ghost"
                      onClick={() => openJoinDialog(assembly)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" /> Join
                    </Button>
                    <Button
                      className="flex-1 bg-white/5 text-cosmic-muted border border-white/10 hover:bg-white/10"
                      variant="ghost"
                      onClick={() => openDetail(assembly)}
                    >
                      Details <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Join Assembly Dialog */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className="bg-[#0B1022] border-white/10 text-white max-w-md">
          {selectedAssembly && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-cosmic-teal" />
                  Join Assembly
                </DialogTitle>
                <DialogDescription className="text-cosmic-muted">
                  Become part of the deliberation
                </DialogDescription>
              </DialogHeader>

              {!joined ? (
                <div className="space-y-4">
                  <div className="glass-card p-4 rounded-xl">
                    <h3 className="text-white font-semibold mb-1">{selectedAssembly.name}</h3>
                    <p className="text-sm text-cosmic-muted line-clamp-3">{selectedAssembly.description}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs">
                      <Badge className={`${PURPOSE_CONFIG[selectedAssembly.purpose]?.color || ''} text-[10px] border`}>
                        {PURPOSE_CONFIG[selectedAssembly.purpose]?.label}
                      </Badge>
                      <span className="text-cosmic-muted">
                        {selectedAssembly._count.members} members · {CADENCE_LABELS[selectedAssembly.meetingCadence]}
                      </span>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="ghost"
                      className="text-cosmic-muted hover:text-white"
                      onClick={() => setJoinDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-cosmic-teal text-[#0B1022] hover:bg-cosmic-teal/90"
                      onClick={handleJoin}
                      disabled={joining}
                    >
                      {joining ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                      Join Assembly
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-cosmic-teal/20 flex items-center justify-center glow-teal">
                    <Users className="w-8 h-8 text-cosmic-teal" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Welcome Aboard!</h3>
                  <p className="text-cosmic-muted text-sm">You&apos;re now a member of {selectedAssembly.name}.</p>
                  <Button
                    className="bg-cosmic-teal/10 text-cosmic-teal border border-cosmic-teal/20 hover:bg-cosmic-teal/20"
                    variant="ghost"
                    onClick={() => setJoinDialogOpen(false)}
                  >
                    Continue
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Assembly Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-[#0B1022] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cosmic-teal animate-spin" />
            </div>
          ) : detailAssembly ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-white text-xl">{detailAssembly.name}</DialogTitle>
                <DialogDescription className="text-cosmic-muted">{detailAssembly.description}</DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-2">
                <Badge className={`${PURPOSE_CONFIG[detailAssembly.purpose]?.color || ''} text-[10px] border`}>
                  {PURPOSE_CONFIG[detailAssembly.purpose]?.label}
                </Badge>
                <Badge className="text-[10px] bg-white/5 border-white/10 text-cosmic-muted">
                  {SCOPE_CONFIG[detailAssembly.scope]?.label}
                </Badge>
                <Badge className="text-[10px] bg-white/5 border-white/10 text-cosmic-muted">
                  <Calendar className="w-3 h-3 mr-1" />
                  {CADENCE_LABELS[detailAssembly.meetingCadence]}
                </Badge>
                {detailIsMember && detailMemberRole && (
                  <Badge className="text-[10px] bg-cosmic-teal/10 border-cosmic-teal/20 text-cosmic-teal">
                    You: {ROLE_CONFIG[detailMemberRole]?.label || detailMemberRole}
                  </Badge>
                )}
              </div>

              {/* Members */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-cosmic-teal" />
                  Members ({detailAssembly._count?.members || detailAssembly.members?.length || 0})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {detailAssembly.members?.map((member: AssemblyMember) => {
                    const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
                    return (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-cosmic-violet/20 flex items-center justify-center text-[10px] font-bold text-cosmic-violet">
                            {(member.user.name || 'U')[0].toUpperCase()}
                          </div>
                          <span className="text-sm text-white">{member.user.name || 'Anonymous'}</span>
                        </div>
                        <span className={`text-[10px] font-medium ${roleConfig.color}`}>{roleConfig.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming Meetings */}
              {detailAssembly.meetings && detailAssembly.meetings.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cosmic-amber" />
                    Recent / Upcoming Meetings
                  </h4>
                  <div className="space-y-2">
                    {detailAssembly.meetings.slice(0, 5).map((meeting) => (
                      <div key={meeting.id} className="glass-card p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white font-medium">{meeting.title}</p>
                          <p className="text-[10px] text-cosmic-muted">
                            {new Date(meeting.startsAt).toLocaleDateString('en-US', {
                              weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <Badge className="text-[9px] bg-white/5 border-white/10 text-cosmic-muted">
                          {meeting.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Join button if not a member */}
              {!detailIsMember && (
                <Button
                  className="w-full bg-cosmic-teal text-[#0B1022] hover:bg-cosmic-teal/90"
                  onClick={() => {
                    setDetailDialogOpen(false);
                    openJoinDialog(detailAssembly);
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" /> Join This Assembly
                </Button>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Create Assembly Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#0B1022] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cosmic-teal" />
              Create New Assembly
            </DialogTitle>
            <DialogDescription className="text-cosmic-muted">
              Start a deliberative space for your community
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Name *</label>
              <Input
                placeholder="e.g., Neighborhood Advisory Council"
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Description *</label>
              <Textarea
                placeholder="What will this assembly discuss and decide?"
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 min-h-[80px]"
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
                    <SelectItem value="deliberation">Deliberation</SelectItem>
                    <SelectItem value="advisory">Advisory</SelectItem>
                    <SelectItem value="decision_making">Decision Making</SelectItem>
                    <SelectItem value="working_group">Working Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Scope</label>
                <Select value={createForm.scope} onValueChange={(v) => setCreateForm((f) => ({ ...f, scope: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="neighborhood">Neighborhood</SelectItem>
                    <SelectItem value="thematic">Thematic</SelectItem>
                    <SelectItem value="sectoral">Sectoral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Meeting Cadence</label>
                <Select value={createForm.meetingCadence} onValueChange={(v) => setCreateForm((f) => ({ ...f, meetingCadence: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="ad_hoc">Ad Hoc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Visibility</label>
                <Select value={createForm.isPublic ? 'public' : 'private'} onValueChange={(v) => setCreateForm((f) => ({ ...f, isPublic: v === 'public' }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              className="bg-cosmic-teal text-[#0B1022] hover:bg-cosmic-teal/90"
              onClick={handleCreate}
              disabled={creating || !createForm.name || !createForm.description}
            >
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
              Create Assembly
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
