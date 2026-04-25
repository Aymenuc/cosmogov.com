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
  Calendar,
  Plus,
  Search,
  Loader2,
  Clock,
  MapPin,
  Video,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  LayoutList,
  CalendarDays,
  Globe2,
  Building2,
  Link2,
  ChevronRight,
  Mic,
  Eye,
  FileText,
  Play,
  Trash2,
} from 'lucide-react';

interface MeetingAttendee {
  id: string;
  role: string;
  user: { id: string; name: string | null; avatarUrl: string | null };
}

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  type: string;
  address: string | null;
  videoUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  attendeeCount: number;
  maxAttendees: number | null;
  status: string;
  agenda: string;
  minutes: string | null;
  recordingUrl: string | null;
  createdAt: string;
  createdBy: string;
  creator: { id: string; name: string | null; avatarUrl: string | null };
  assembly: { id: string; name: string; slug: string } | null;
  attendees: MeetingAttendee[];
  _count: { attendees: number };
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  in_person: { label: 'In-Person', color: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20', icon: MapPin },
  virtual: { label: 'Virtual', color: 'text-cosmic-violet bg-cosmic-violet/10 border-cosmic-violet/20', icon: Video },
  hybrid: { label: 'Hybrid', color: 'text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20', icon: Globe2 },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20' },
  live: { label: 'Live Now', color: 'text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20' },
  completed: { label: 'Completed', color: 'text-cosmic-muted bg-white/5 border-white/10' },
  cancelled: { label: 'Cancelled', color: 'text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20' },
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'upcoming' | 'past'>('upcoming');
  const [filters, setFilters] = useState({ type: 'all', search: '' });
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // RSVP dialog
  const [rsvpDialogOpen, setRsvpDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [rsvping, setRsvping] = useState(false);
  const [rsvped, setRsvped] = useState(false);

  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailMeeting, setDetailMeeting] = useState<Meeting | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', description: '', type: 'hybrid', address: '', videoUrl: '',
    startsAt: '', endsAt: '', maxAttendees: '', assemblyId: '',
    agendaItems: [''] as string[],
  });
  const [creating, setCreating] = useState(false);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('timeframe', timeframe);
      if (filters.type !== 'all') params.set('type', filters.type);
      if (filters.search) params.set('search', filters.search);

      const res = await fetch(`/api/participation/meetings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [timeframe, filters]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const openRsvpDialog = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setRsvped(false);
    setRsvpDialogOpen(true);
  };

  const handleRsvp = async () => {
    if (!selectedMeeting) return;
    setRsvping(true);
    try {
      const res = await fetch(`/api/participation/meetings/${selectedMeeting.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'attendee' }),
      });
      if (res.ok) {
        setRsvped(true);
        fetchMeetings();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to RSVP');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRsvping(false);
    }
  };

  const openDetail = async (meeting: Meeting) => {
    setDetailMeeting(meeting);
    setDetailDialogOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/participation/meetings/${meeting.id}`);
      if (res.ok) {
        const data = await res.json();
        setDetailMeeting(data.meeting);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.title || !createForm.startsAt) return;
    setCreating(true);
    try {
      const agenda = createForm.agendaItems
        .filter(item => item.trim())
        .map(item => ({ item, duration: 15 }));

      const res = await fetch('/api/participation/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          agenda,
          maxAttendees: createForm.maxAttendees ? parseInt(createForm.maxAttendees) : null,
          assemblyId: createForm.assemblyId || null,
          endsAt: createForm.endsAt || null,
        }),
      });
      if (res.ok) {
        setCreateDialogOpen(false);
        setCreateForm({
          title: '', description: '', type: 'hybrid', address: '', videoUrl: '',
          startsAt: '', endsAt: '', maxAttendees: '', assemblyId: '',
          agendaItems: [''],
        });
        fetchMeetings();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create meeting');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
    });
  };

  const formatDuration = (startsAt: string, endsAt: string | null) => {
    if (!endsAt) return null;
    const diff = new Date(endsAt).getTime() - new Date(startsAt).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    return `${mins}m`;
  };

  const isUpcoming = (startsAt: string) => new Date(startsAt) > new Date();

  // Group meetings by date for calendar view
  const meetingsByDate = meetings.reduce((acc, meeting) => {
    const date = formatDate(meeting.startsAt);
    if (!acc[date]) acc[date] = [];
    acc[date].push(meeting);
    return acc;
  }, {} as Record<string, Meeting[]>);

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl glass-card-amber p-8 lg:p-12">
        <div className="absolute inset-0 starfield opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-cosmic-amber" />
            <span className="text-cosmic-amber text-sm font-semibold tracking-wider uppercase">Meetings</span>
          </div>
          <h1 className="font-heading text-3xl lg:text-4xl font-bold text-white mb-2">
            Gather, Discuss,{' '}
            <span className="text-gradient-warm">Decide</span>
          </h1>
          <p className="text-cosmic-muted max-w-2xl mb-8">
            Attend in-person, virtual, or hybrid meetings. Every gathering is a chance to shape the future of your community.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Upcoming', value: meetings.filter(m => isUpcoming(m.startsAt)).length, icon: Calendar, color: 'text-cosmic-amber' },
              { label: 'In-Person', value: meetings.filter(m => m.type === 'in_person').length, icon: MapPin, color: 'text-cosmic-teal' },
              { label: 'Virtual', value: meetings.filter(m => m.type === 'virtual').length, icon: Video, color: 'text-cosmic-violet' },
              { label: 'Total Attendees', value: meetings.reduce((s, m) => s + m.attendeeCount, 0), icon: Users, color: 'text-cosmic-accent' },
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

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-grow">
          {/* Timeframe toggle */}
          <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-0.5">
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                timeframe === 'upcoming' ? 'bg-cosmic-amber/20 text-cosmic-amber' : 'text-cosmic-muted hover:text-white'
              }`}
              onClick={() => setTimeframe('upcoming')}
            >
              Upcoming
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                timeframe === 'past' ? 'bg-cosmic-amber/20 text-cosmic-amber' : 'text-cosmic-muted hover:text-white'
              }`}
              onClick={() => setTimeframe('past')}
            >
              Past Meetings
            </button>
          </div>

          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cosmic-muted" />
            <Input
              placeholder="Search meetings..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>

          <Select value={filters.type} onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))}>
            <SelectTrigger className="w-full sm:w-36 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="in_person">In-Person</SelectItem>
              <SelectItem value="virtual">Virtual</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-0.5">
            <button
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'list' ? 'bg-cosmic-amber/20 text-cosmic-amber' : 'text-cosmic-muted hover:text-white'
              }`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'calendar' ? 'bg-cosmic-amber/20 text-cosmic-amber' : 'text-cosmic-muted hover:text-white'
              }`}
              onClick={() => setViewMode('calendar')}
              title="Calendar view"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>
        </div>

        <Button
          className="bg-cosmic-amber text-[#0B1022] hover:bg-cosmic-amber/90 shrink-0"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Create Meeting
        </Button>
      </div>

      {/* Meetings Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-cosmic-amber animate-spin" />
        </div>
      ) : meetings.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <Calendar className="w-12 h-12 text-cosmic-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {timeframe === 'upcoming' ? 'No Upcoming Meetings' : 'No Past Meetings'}
          </h3>
          <p className="text-cosmic-muted text-sm mb-4">
            {timeframe === 'upcoming' ? 'Schedule a meeting to bring your community together.' : 'Past meetings will appear here after they conclude.'}
          </p>
          {timeframe === 'upcoming' && (
            <Button className="bg-cosmic-amber text-[#0B1022] hover:bg-cosmic-amber/90" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create Meeting
            </Button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* List / Timeline View */
        <div className="space-y-3">
          {meetings.map((meeting) => {
            const typeConfig = TYPE_CONFIG[meeting.type] || TYPE_CONFIG.hybrid;
            const statusConfig = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.scheduled;
            const TypeIcon = typeConfig.icon;
            const duration = formatDuration(meeting.startsAt, meeting.endsAt);

            return (
              <Card key={meeting.id} className="glass-card rounded-xl hover:scale-[1.005] transition-all duration-300 group">
                <CardContent className="p-4 lg:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Date Block */}
                    <div className="flex items-center gap-4 lg:w-40 shrink-0">
                      <div className="text-center min-w-[52px]">
                        <div className="text-xs text-cosmic-muted uppercase">
                          {new Date(meeting.startsAt).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="text-2xl font-bold text-white font-heading">
                          {new Date(meeting.startsAt).getDate()}
                        </div>
                        <div className="text-xs text-cosmic-muted">
                          {formatTime(meeting.startsAt)}
                        </div>
                      </div>
                      <div className="w-px h-12 bg-white/10 hidden lg:block" />
                    </div>

                    {/* Main Content */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-base font-semibold text-white group-hover:text-cosmic-amber transition-colors truncate">
                          {meeting.title}
                        </h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge className={`${typeConfig.color} text-[10px] border`}>
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {typeConfig.label}
                          </Badge>
                          {meeting.status === 'live' && (
                            <Badge className={`${statusConfig.color} text-[10px] border animate-pulse`}>
                              {statusConfig.label}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {meeting.description && (
                        <p className="text-xs text-cosmic-muted line-clamp-1 mb-2">{meeting.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-cosmic-muted">
                        {meeting.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-cosmic-amber" />
                            {meeting.address}
                          </span>
                        )}
                        {meeting.videoUrl && (
                          <span className="flex items-center gap-1">
                            <Video className="w-3 h-3 text-cosmic-violet" />
                            Video Available
                          </span>
                        )}
                        {duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {duration}
                          </span>
                        )}
                        {meeting.assembly && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-cosmic-teal" />
                            {meeting.assembly.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {meeting.attendeeCount}{meeting.maxAttendees ? `/${meeting.maxAttendees}` : ''} attendees
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {timeframe === 'upcoming' && meeting.status !== 'cancelled' ? (
                        <>
                          <Button
                            className="bg-cosmic-amber/10 text-cosmic-amber border border-cosmic-amber/20 hover:bg-cosmic-amber/20"
                            variant="ghost"
                            size="sm"
                            onClick={() => openRsvpDialog(meeting)}
                          >
                            RSVP
                          </Button>
                          <Button
                            className="bg-white/5 text-cosmic-muted hover:bg-white/10"
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(meeting)}
                          >
                            Details
                          </Button>
                        </>
                      ) : timeframe === 'past' ? (
                        <div className="flex items-center gap-2">
                          {meeting.minutes && (
                            <Button
                              className="bg-white/5 text-cosmic-muted hover:bg-white/10"
                              variant="ghost"
                              size="sm"
                            >
                              <FileText className="w-3 h-3 mr-1" /> Minutes
                            </Button>
                          )}
                          {meeting.recordingUrl && (
                            <Button
                              className="bg-cosmic-violet/10 text-cosmic-violet border border-cosmic-violet/20 hover:bg-cosmic-violet/20"
                              variant="ghost"
                              size="sm"
                            >
                              <Play className="w-3 h-3 mr-1" /> Recording
                            </Button>
                          )}
                          <Button
                            className="bg-white/5 text-cosmic-muted hover:bg-white/10"
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(meeting)}
                          >
                            Details
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Calendar View */
        <div className="space-y-6">
          {Object.entries(meetingsByDate).map(([date, dateMeetings]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-cosmic-amber/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-cosmic-amber" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-white">{date}</h3>
                <span className="text-xs text-cosmic-muted">{dateMeetings.length} meeting{dateMeetings.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 ml-0 lg:ml-13">
                {dateMeetings.map((meeting) => {
                  const typeConfig = TYPE_CONFIG[meeting.type] || TYPE_CONFIG.hybrid;
                  const TypeIcon = typeConfig.icon;
                  return (
                    <Card key={meeting.id} className="glass-card rounded-xl hover:scale-[1.01] transition-all duration-300 group cursor-pointer" onClick={() => openDetail(meeting)}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <Badge className={`${typeConfig.color} text-[10px] border`}>
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {typeConfig.label}
                          </Badge>
                          <span className="text-xs text-cosmic-muted">{formatTime(meeting.startsAt)}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-white group-hover:text-cosmic-amber transition-colors">
                          {meeting.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-cosmic-muted">
                          <Users className="w-3 h-3" />
                          {meeting.attendeeCount} attendees
                        </div>
                        {timeframe === 'upcoming' && (
                          <Button
                            className="w-full bg-cosmic-amber/10 text-cosmic-amber border border-cosmic-amber/20 hover:bg-cosmic-amber/20"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); openRsvpDialog(meeting); }}
                          >
                            RSVP
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RSVP Dialog */}
      <Dialog open={rsvpDialogOpen} onOpenChange={setRsvpDialogOpen}>
        <DialogContent className="bg-[#0B1022] border-white/10 text-white max-w-md">
          {selectedMeeting && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cosmic-amber" />
                  RSVP to Meeting
                </DialogTitle>
                <DialogDescription className="text-cosmic-muted">
                  Confirm your attendance
                </DialogDescription>
              </DialogHeader>

              {!rsvped ? (
                <div className="space-y-4">
                  <div className="glass-card p-4 rounded-xl space-y-2">
                    <h3 className="text-white font-semibold">{selectedMeeting.title}</h3>
                    <div className="flex flex-wrap gap-3 text-xs text-cosmic-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(selectedMeeting.startsAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(selectedMeeting.startsAt)}
                      </span>
                      {selectedMeeting.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {selectedMeeting.address}
                        </span>
                      )}
                    </div>
                    {selectedMeeting.maxAttendees && (
                      <div className="text-xs text-cosmic-muted">
                        <Users className="w-3 h-3 inline mr-1" />
                        {selectedMeeting.attendeeCount}/{selectedMeeting.maxAttendees} spots filled
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      variant="ghost"
                      className="text-cosmic-muted hover:text-white"
                      onClick={() => setRsvpDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-cosmic-amber text-[#0B1022] hover:bg-cosmic-amber/90"
                      onClick={handleRsvp}
                      disabled={rsvping}
                    >
                      {rsvping ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      RSVP — I&apos;m Going
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-cosmic-amber/20 flex items-center justify-center glow-amber">
                    <CheckCircle2 className="w-8 h-8 text-cosmic-amber" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">You&apos;re In!</h3>
                  <p className="text-cosmic-muted text-sm">See you at {selectedMeeting.title}!</p>
                  <Button
                    className="bg-cosmic-amber/10 text-cosmic-amber border border-cosmic-amber/20 hover:bg-cosmic-amber/20"
                    variant="ghost"
                    onClick={() => setRsvpDialogOpen(false)}
                  >
                    Continue
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Meeting Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-[#0B1022] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cosmic-amber animate-spin" />
            </div>
          ) : detailMeeting ? (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-white text-xl">{detailMeeting.title}</DialogTitle>
                <DialogDescription className="text-cosmic-muted">{detailMeeting.description}</DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-2">
                <Badge className={`${TYPE_CONFIG[detailMeeting.type]?.color || ''} text-[10px] border`}>
                  {TYPE_CONFIG[detailMeeting.type]?.label}
                </Badge>
                <Badge className={`${STATUS_CONFIG[detailMeeting.status]?.color || ''} text-[10px] border`}>
                  {STATUS_CONFIG[detailMeeting.status]?.label}
                </Badge>
                {detailMeeting.assembly && (
                  <Badge className="text-[10px] bg-cosmic-teal/10 border-cosmic-teal/20 text-cosmic-teal">
                    <Building2 className="w-3 h-3 mr-1" />
                    {detailMeeting.assembly.name}
                  </Badge>
                )}
              </div>

              {/* Time & Location */}
              <div className="glass-card p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-cosmic-amber" />
                  <span className="text-white">{formatDate(detailMeeting.startsAt)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-cosmic-amber" />
                  <span className="text-white">
                    {formatTime(detailMeeting.startsAt)}
                    {detailMeeting.endsAt && ` — ${formatTime(detailMeeting.endsAt)}`}
                  </span>
                </div>
                {detailMeeting.address && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-cosmic-amber" />
                    <span className="text-white">{detailMeeting.address}</span>
                  </div>
                )}
                {detailMeeting.videoUrl && (
                  <div className="flex items-center gap-3 text-sm">
                    <Video className="w-4 h-4 text-cosmic-violet" />
                    <a href={detailMeeting.videoUrl} target="_blank" rel="noopener noreferrer" className="text-cosmic-violet hover:underline flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> Join Video Call
                    </a>
                  </div>
                )}
                {detailMeeting.recordingUrl && (
                  <div className="flex items-center gap-3 text-sm">
                    <Play className="w-4 h-4 text-cosmic-teal" />
                    <a href={detailMeeting.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-cosmic-teal hover:underline flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> Watch Recording
                    </a>
                  </div>
                )}
              </div>

              {/* Agenda */}
              {(() => {
                let agenda: { item: string; duration: number; presenter?: string }[] = [];
                try { agenda = JSON.parse(detailMeeting.agenda); } catch { /* empty */ }
                if (agenda.length === 0) return null;
                return (
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cosmic-amber" />
                      Agenda
                    </h4>
                    <div className="space-y-2">
                      {agenda.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between glass-card p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-cosmic-amber/10 flex items-center justify-center text-[10px] font-bold text-cosmic-amber">
                              {idx + 1}
                            </span>
                            <span className="text-sm text-white">{item.item}</span>
                          </div>
                          <span className="text-[10px] text-cosmic-muted">{item.duration}min</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Attendees */}
              {detailMeeting.attendees && detailMeeting.attendees.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-cosmic-teal" />
                    Attendees ({detailMeeting.attendeeCount})
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {detailMeeting.attendees.map((attendee) => (
                      <div key={attendee.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-cosmic-violet/20 flex items-center justify-center text-[10px] font-bold text-cosmic-violet">
                            {(attendee.user.name || 'U')[0].toUpperCase()}
                          </div>
                          <span className="text-sm text-white">{attendee.user.name || 'Anonymous'}</span>
                        </div>
                        <Badge className="text-[9px] bg-white/5 border-white/10 text-cosmic-muted">
                          {attendee.role === 'organizer' ? '🎤 Organizer' : attendee.role === 'presenter' ? '📋 Presenter' : '👤 Attendee'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Minutes */}
              {detailMeeting.minutes && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cosmic-amber" />
                    Meeting Minutes
                  </h4>
                  <div className="glass-card p-4 rounded-xl">
                    <p className="text-sm text-cosmic-muted whitespace-pre-wrap">{detailMeeting.minutes}</p>
                  </div>
                </div>
              )}

              {/* RSVP Button */}
              {isUpcoming(detailMeeting.startsAt) && detailMeeting.status !== 'cancelled' && (
                <Button
                  className="w-full bg-cosmic-amber text-[#0B1022] hover:bg-cosmic-amber/90"
                  onClick={() => {
                    setDetailDialogOpen(false);
                    openRsvpDialog(detailMeeting);
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> RSVP to This Meeting
                </Button>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Create Meeting Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#0B1022] border-white/10 text-white max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cosmic-amber" />
              Schedule New Meeting
            </DialogTitle>
            <DialogDescription className="text-cosmic-muted">
              Organize a gathering for your community
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Title *</label>
              <Input
                placeholder="e.g., Community Budget Review"
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Description</label>
              <Textarea
                placeholder="What will be discussed?"
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 min-h-[60px]"
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
                    <SelectItem value="in_person">In-Person</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Max Attendees</label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                  value={createForm.maxAttendees}
                  onChange={(e) => setCreateForm((f) => ({ ...f, maxAttendees: e.target.value }))}
                />
              </div>
            </div>

            {(createForm.type === 'in_person' || createForm.type === 'hybrid') && (
              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Address</label>
                <Input
                  placeholder="Meeting location"
                  className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                  value={createForm.address}
                  onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
            )}

            {(createForm.type === 'virtual' || createForm.type === 'hybrid') && (
              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Video URL</label>
                <Input
                  placeholder="https://zoom.us/j/..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                  value={createForm.videoUrl}
                  onChange={(e) => setCreateForm((f) => ({ ...f, videoUrl: e.target.value }))}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">Start Date/Time *</label>
                <Input
                  type="datetime-local"
                  className="bg-white/5 border-white/10 text-white"
                  value={createForm.startsAt}
                  onChange={(e) => setCreateForm((f) => ({ ...f, startsAt: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-cosmic-muted mb-1 block">End Date/Time</label>
                <Input
                  type="datetime-local"
                  className="bg-white/5 border-white/10 text-white"
                  value={createForm.endsAt}
                  onChange={(e) => setCreateForm((f) => ({ ...f, endsAt: e.target.value }))}
                />
              </div>
            </div>

            {/* Agenda Items */}
            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Agenda Items</label>
              <div className="space-y-2">
                {createForm.agendaItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cosmic-amber/10 flex items-center justify-center text-[10px] font-bold text-cosmic-amber shrink-0">
                      {idx + 1}
                    </span>
                    <Input
                      placeholder="Agenda item..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                      value={item}
                      onChange={(e) => {
                        const newItems = [...createForm.agendaItems];
                        newItems[idx] = e.target.value;
                        setCreateForm((f) => ({ ...f, agendaItems: newItems }));
                      }}
                    />
                    {createForm.agendaItems.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-cosmic-rose hover:bg-cosmic-rose/10 shrink-0"
                        onClick={() => {
                          setCreateForm((f) => ({
                            ...f,
                            agendaItems: f.agendaItems.filter((_, i) => i !== idx),
                          }));
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-cosmic-amber hover:bg-cosmic-amber/10"
                  onClick={() => setCreateForm((f) => ({ ...f, agendaItems: [...f.agendaItems, ''] }))}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Agenda Item
                </Button>
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
              className="bg-cosmic-amber text-[#0B1022] hover:bg-cosmic-amber/90"
              onClick={handleCreate}
              disabled={creating || !createForm.title || !createForm.startsAt}
            >
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
              Create Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
