'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Landmark,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Search,
  Clock,
  FileText,
  Gavel,
  ScrollText,
  BarChart3,
  ArrowLeft,
  Shield,
  MessageSquare,
  CalendarClock,
  Users,
  FileSignature,
  Vote,
  ArrowRight,
  ChevronRight,
  Scale,
  Eye,
  Send,
  TrendingUp,
  Hourglass,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';

/* ─── Types ─── */

interface DashboardStats {
  initiativesPending: number;
  initiativesResponded: number;
  bindingPending: number;
  bindingResponded: number;
  legislationPending: number;
  legislationPublicComment: number;
  overdueResponses: number;
  avgResponseDays: number;
}

interface Initiative {
  id: string;
  title: string;
  description: string;
  type: string;
  signatureGoal: number;
  signatureCount: number;
  status: string;
  governmentResponse: string | null;
  responseDate: string | null;
  createdAt: string;
  createdBy: string;
  creator?: { id: string; name: string };
  _count?: { signatures: number };
}

interface BindingProposal {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string | null;
  signatureGoal: number;
  signatureCount: number;
  status: string;
  governmentResponse: string | null;
  responseDate: string | null;
  responseDeadline: string | null;
  voteDate: string | null;
  legalReference: string | null;
  impactAssessment: string | null;
  createdAt: string;
  createdBy: string;
  creator?: { id: string; name: string };
  _count?: { signatures: number };
}

interface Legislation {
  id: string;
  title: string;
  description: string;
  billNumber: string | null;
  status: string;
  category: string | null;
  commentCount: number;
  amendmentCount: number;
  supportCount: number;
  opposeCount: number;
  createdAt: string;
  createdBy: string;
  creator?: { id: string; name: string };
  _count?: { comments: number; amendments: number; votes: number };
}

interface AnalyticsData {
  initiativeResponseRate: number;
  bindingResponseRate: number;
  totalInitiativesThreshold: number;
  respondedInitiatives: number;
  totalBindingThreshold: number;
  respondedBinding: number;
  byType: Record<string, { total: number; responded: number }>;
  byCategory: Record<string, { total: number; responded: number }>;
}

/* ─── Helpers ─── */

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `${diffDays}d remaining`;
}

function isOverdue(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function signatureProgress(current: number, goal: number): number {
  if (goal <= 0) return 100;
  return Math.min(100, Math.round((current / goal) * 100));
}

function typeBadgeColor(type: string): string {
  const map: Record<string, string> = {
    petition: 'border-cosmic-teal/30 text-cosmic-teal bg-cosmic-teal/10',
    referendum: 'border-cosmic-violet/30 text-cosmic-violet bg-cosmic-violet/10',
    recall: 'border-cosmic-rose/30 text-cosmic-rose bg-cosmic-rose/10',
    proposal: 'border-cosmic-accent/30 text-cosmic-accent bg-cosmic-accent/10',
    binding_proposal: 'border-cosmic-amber/30 text-cosmic-amber bg-cosmic-amber/10',
    binding_referendum: 'border-cosmic-rose/30 text-cosmic-rose bg-cosmic-rose/10',
    citizen_bill: 'border-cosmic-teal/30 text-cosmic-teal bg-cosmic-teal/10',
  };
  return map[type] || 'border-white/10 text-cosmic-muted bg-white/5';
}

function statusBadgeColor(status: string): string {
  const map: Record<string, string> = {
    collecting: 'border-white/10 text-cosmic-muted bg-white/5',
    threshold_reached: 'border-cosmic-amber/30 text-cosmic-amber bg-cosmic-amber/10',
    government_review: 'border-cosmic-violet/30 text-cosmic-violet bg-cosmic-violet/10',
    government_response: 'border-cosmic-teal/30 text-cosmic-teal bg-cosmic-teal/10',
    voting: 'border-cosmic-accent/30 text-cosmic-accent bg-cosmic-accent/10',
    scheduled_vote: 'border-cosmic-accent/30 text-cosmic-accent bg-cosmic-accent/10',
    passed: 'border-cosmic-success/30 text-cosmic-success bg-cosmic-success/10',
    enacted: 'border-cosmic-success/30 text-cosmic-success bg-cosmic-success/10',
    rejected: 'border-cosmic-rose/30 text-cosmic-rose bg-cosmic-rose/10',
    expired: 'border-white/10 text-cosmic-muted bg-white/5',
    draft: 'border-white/10 text-cosmic-muted bg-white/5',
    review: 'border-cosmic-violet/30 text-cosmic-violet bg-cosmic-violet/10',
    public_comment: 'border-cosmic-teal/30 text-cosmic-teal bg-cosmic-teal/10',
    amendment: 'border-cosmic-amber/30 text-cosmic-amber bg-cosmic-amber/10',
  };
  return map[status] || 'border-white/10 text-cosmic-muted bg-white/5';
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/* ─── Component ─── */

export default function GovPortalPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dashboard
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInitiatives, setRecentInitiatives] = useState<Initiative[]>([]);
  const [recentBinding, setRecentBinding] = useState<BindingProposal[]>([]);

  // Initiatives
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [initStatus, setInitStatus] = useState('all_pending');
  const [initSearch, setInitSearch] = useState('');
  const [initSort, setInitSort] = useState('newest');
  const [initLoading, setInitLoading] = useState(false);

  // Binding Proposals
  const [proposals, setProposals] = useState<BindingProposal[]>([]);
  const [bpStatus, setBpStatus] = useState('pending');
  const [bpSearch, setBpSearch] = useState('');
  const [bpSort, setBpSort] = useState('newest');
  const [bpLoading, setBpLoading] = useState(false);

  // Legislation
  const [legislation, setLegislation] = useState<Legislation[]>([]);
  const [legStatus, setLegStatus] = useState('all');
  const [legSearch, setLegSearch] = useState('');
  const [legLoading, setLegLoading] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Response dialog
  const [responseDialog, setResponseDialog] = useState<{
    type: 'initiative' | 'binding';
    item: Initiative | BindingProposal | null;
  }>({ type: 'initiative', item: null });

  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState('government_response');
  const [impactAssessment, setImpactAssessment] = useState('');
  const [legalRef, setLegalRef] = useState('');
  const [voteDate, setVoteDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  /* ─── Auth ─── */

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => {
        if (
          user &&
          (user.role === 'gov_official' ||
            user.role === 'admin' ||
            user.role === 'super_admin')
        ) {
          setIsAuthorized(true);
        }
        setAuthChecked(true);
      })
      .catch(() => {
        setAuthChecked(true);
      });
  }, []);

  /* ─── Data Fetching ─── */

  const fetchDashboard = useCallback(() => {
    fetch('/api/gov-portal/dashboard')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setStats(data.stats);
          setRecentInitiatives(data.recentInitiatives || []);
          setRecentBinding(data.recentBinding || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fetchInitiatives = useCallback(() => {
    setInitLoading(true);
    const params = new URLSearchParams({
      status: initStatus,
      search: initSearch,
      sort: initSort,
    });
    fetch(`/api/gov-portal/initiatives?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setInitiatives(data.initiatives || []);
        setInitLoading(false);
      })
      .catch(() => setInitLoading(false));
  }, [initStatus, initSearch, initSort]);

  const fetchProposals = useCallback(() => {
    setBpLoading(true);
    const params = new URLSearchParams({
      status: bpStatus,
      search: bpSearch,
      sort: bpSort,
    });
    fetch(`/api/gov-portal/binding-proposals?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setProposals(data.proposals || []);
        setBpLoading(false);
      })
      .catch(() => setBpLoading(false));
  }, [bpStatus, bpSearch, bpSort]);

  const fetchLegislation = useCallback(() => {
    setLegLoading(true);
    const params = new URLSearchParams({
      status: legStatus === 'all' ? '' : legStatus,
      search: legSearch,
    });
    fetch(`/api/gov-portal/legislation?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setLegislation(data.legislation || []);
        setLegLoading(false);
      })
      .catch(() => setLegLoading(false));
  }, [legStatus, legSearch]);

  const fetchAnalytics = useCallback(() => {
    setAnalyticsLoading(true);
    fetch('/api/gov-portal/analytics')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setAnalytics(data);
        setAnalyticsLoading(false);
      })
      .catch(() => setAnalyticsLoading(false));
  }, []);

  /* ─── Load Data on Tab Change ─── */

  useEffect(() => {
    if (!isAuthorized) return;
    if (activeTab === 'overview') fetchDashboard();
    if (activeTab === 'initiatives') fetchInitiatives();
    if (activeTab === 'binding') fetchProposals();
    if (activeTab === 'legislation') fetchLegislation();
    if (activeTab === 'analytics') fetchAnalytics();
  }, [
    activeTab,
    isAuthorized,
    fetchDashboard,
    fetchInitiatives,
    fetchProposals,
    fetchLegislation,
    fetchAnalytics,
  ]);

  /* ─── Handlers ─── */

  const openResponseDialog = (type: 'initiative' | 'binding', item: Initiative | BindingProposal) => {
    setResponseDialog({ type, item });
    setResponseText('');
    setResponseStatus('government_response');
    setImpactAssessment('');
    setLegalRef('');
    setVoteDate('');
    setSubmitSuccess(false);
  };

  const closeResponseDialog = () => {
    setResponseDialog({ type: 'initiative', item: null });
    setSubmitSuccess(false);
  };

  const submitResponse = async () => {
    if (!responseDialog.item || !responseText.trim()) return;
    setSubmitting(true);

    try {
      if (responseDialog.type === 'initiative') {
        const res = await fetch(`/api/gov-portal/initiatives/${responseDialog.item.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            governmentResponse: responseText,
            status: responseStatus,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to submit response');
        }
      } else {
        const body: Record<string, unknown> = {
          governmentResponse: responseText,
          status: responseStatus,
        };
        if (impactAssessment.trim()) body.impactAssessment = impactAssessment;
        if (legalRef.trim()) body.legalReference = legalRef;
        if (voteDate) body.voteDate = voteDate;

        const res = await fetch(`/api/gov-portal/binding-proposals/${responseDialog.item.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to submit response');
        }
      }

      setSubmitSuccess(true);
      // Refresh the relevant lists
      fetchDashboard();
      if (activeTab === 'initiatives') fetchInitiatives();
      if (activeTab === 'binding') fetchProposals();

      setTimeout(() => {
        closeResponseDialog();
      }, 1500);
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const updateLegislationStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/gov-portal/legislation/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update legislation');
      }
      fetchLegislation();
      fetchDashboard();
    } catch (error) {
      console.error('Error updating legislation:', error);
    }
  };

  /* ─── Auth Guard ─── */

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Landmark className="w-8 h-8 text-cosmic-teal animate-pulse" />
          <span className="text-cosmic-muted text-sm">Verifying access...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div
          className="glass-card-rose p-10 text-center max-w-md"
          style={{ animation: 'scaleIn 0.4s ease-out' }}
        >
          <div className="w-20 h-20 rounded-full bg-cosmic-rose/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-cosmic-rose" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 font-heading">
            Access Restricted
          </h1>
          <p className="text-cosmic-muted mb-8 leading-relaxed">
            You need government official privileges to access this portal. This
            area is reserved for authorized CosmoGov officials only.
          </p>
          <Link href="/dashboard">
            <Button className="bg-cosmic-accent hover:bg-cosmic-accent/90 text-white rounded-xl px-6">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Landmark className="w-8 h-8 text-cosmic-teal animate-pulse" />
          <span className="text-cosmic-muted text-sm">
            Loading government portal...
          </span>
        </div>
      </div>
    );
  }

  /* ─── Stat Cards Data ─── */

  const statCards = stats
    ? [
        {
          label: 'Initiatives Pending Response',
          value: stats.initiativesPending,
          icon: Hourglass,
          color: 'text-cosmic-amber',
          bg: 'bg-cosmic-amber/10',
        },
        {
          label: 'Initiatives Responded',
          value: stats.initiativesResponded,
          icon: CheckCircle2,
          color: 'text-cosmic-success',
          bg: 'bg-cosmic-success/10',
        },
        {
          label: 'Binding Proposals Pending',
          value: stats.bindingPending,
          icon: FileSignature,
          color: 'text-cosmic-rose',
          bg: 'bg-cosmic-rose/10',
        },
        {
          label: 'Binding Proposals Responded',
          value: stats.bindingResponded,
          icon: ShieldCheck,
          color: 'text-cosmic-teal',
          bg: 'bg-cosmic-teal/10',
        },
        {
          label: 'Legislation Under Review',
          value: stats.legislationPending,
          icon: ScrollText,
          color: 'text-cosmic-violet',
          bg: 'bg-cosmic-violet/10',
        },
        {
          label: 'Legislation in Public Comment',
          value: stats.legislationPublicComment,
          icon: MessageSquare,
          color: 'text-cosmic-accent',
          bg: 'bg-cosmic-accent/10',
        },
        {
          label: 'Overdue Responses',
          value: stats.overdueResponses,
          icon: AlertTriangle,
          color: 'text-cosmic-rose',
          bg: 'bg-cosmic-rose/10',
          highlight: stats.overdueResponses > 0,
        },
        {
          label: 'Avg Response Time',
          value: `${stats.avgResponseDays}d`,
          icon: Clock,
          color: 'text-cosmic-teal',
          bg: 'bg-cosmic-teal/10',
        },
      ]
    : [];

  /* ─── Render ─── */

  return (
    <div className="animate-[fadeIn_0.5s_ease-out]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-cosmic-muted hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cosmic-teal/10 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-cosmic-teal" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-gradient">
              Government Portal
            </h1>
            <p className="text-cosmic-muted text-sm">
              Review, respond, and engage with citizen participation
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#0B1022] border border-white/5 p-1 mb-6 overflow-x-auto flex-nowrap min-w-max h-auto gap-1">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-cosmic-teal/10 data-[state=active]:text-cosmic-teal"
          >
            <Landmark className="w-4 h-4 mr-1.5" /> Overview
          </TabsTrigger>
          <TabsTrigger
            value="initiatives"
            className="data-[state=active]:bg-cosmic-amber/10 data-[state=active]:text-cosmic-amber"
          >
            <FileText className="w-4 h-4 mr-1.5" /> Initiatives
          </TabsTrigger>
          <TabsTrigger
            value="binding"
            className="data-[state=active]:bg-cosmic-rose/10 data-[state=active]:text-cosmic-rose"
          >
            <Gavel className="w-4 h-4 mr-1.5" /> Binding Proposals
          </TabsTrigger>
          <TabsTrigger
            value="legislation"
            className="data-[state=active]:bg-cosmic-violet/10 data-[state=active]:text-cosmic-violet"
          >
            <ScrollText className="w-4 h-4 mr-1.5" /> Legislation
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-cosmic-accent/10 data-[state=active]:text-cosmic-accent"
          >
            <BarChart3 className="w-4 h-4 mr-1.5" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════ */}
        {/* OVERVIEW TAB */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="overview">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((s) => (
              <div
                key={s.label}
                className={`glass-card rounded-2xl p-4 transition-all ${
                  s.highlight
                    ? 'border-cosmic-rose/40 ring-1 ring-cosmic-rose/20'
                    : ''
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}
                >
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold font-heading">{s.value}</p>
                <p className="text-xs text-cosmic-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Initiatives Awaiting Response */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cosmic-amber" /> Initiatives
                Awaiting Response
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentInitiatives.length === 0 ? (
                  <div className="py-8 text-center text-cosmic-muted">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No pending initiatives</p>
                  </div>
                ) : (
                  recentInitiatives.map((init) => (
                    <div
                      key={init.id}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-grow">
                          <p className="text-sm font-medium truncate">
                            {init.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${typeBadgeColor(init.type)}`}
                            >
                              {formatType(init.type)}
                            </Badge>
                            <span className="text-xs text-cosmic-muted flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {init.signatureCount}/{init.signatureGoal}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-cosmic-teal/20 text-cosmic-teal hover:bg-cosmic-teal/30 border-0 text-xs h-7"
                          onClick={() =>
                            openResponseDialog('initiative', init)
                          }
                        >
                          <Send className="w-3 h-3 mr-1" /> Respond
                        </Button>
                      </div>
                      <p className="text-xs text-cosmic-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(init.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
              {recentInitiatives.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3 text-cosmic-muted hover:text-cosmic-amber"
                  onClick={() => setActiveTab('initiatives')}
                >
                  View All Initiatives <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>

            {/* Right: Binding Proposals Awaiting Response */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                <Gavel className="w-5 h-5 text-cosmic-rose" /> Binding
                Proposals Awaiting Response
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentBinding.length === 0 ? (
                  <div className="py-8 text-center text-cosmic-muted">
                    <Gavel className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No pending binding proposals</p>
                  </div>
                ) : (
                  recentBinding.map((bp) => {
                    const overdue = isOverdue(bp.responseDeadline);
                    return (
                      <div
                        key={bp.id}
                        className={`p-3 rounded-xl bg-white/[0.02] border hover:border-white/10 transition-colors ${
                          overdue
                            ? 'border-cosmic-rose/30'
                            : 'border-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-grow">
                            <p className="text-sm font-medium truncate">
                              {bp.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${typeBadgeColor(bp.type)}`}
                              >
                                {formatType(bp.type)}
                              </Badge>
                              <span className="text-xs text-cosmic-muted flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {bp.signatureCount}/{bp.signatureGoal}
                              </span>
                              {bp.responseDeadline && (
                                <span
                                  className={`text-[10px] flex items-center gap-0.5 ${
                                    overdue
                                      ? 'text-cosmic-rose font-medium'
                                      : 'text-cosmic-amber'
                                  }`}
                                >
                                  <CalendarClock className="w-3 h-3" />
                                  {formatRelative(bp.responseDeadline)}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="bg-cosmic-teal/20 text-cosmic-teal hover:bg-cosmic-teal/30 border-0 text-xs h-7"
                            onClick={() => openResponseDialog('binding', bp)}
                          >
                            <Send className="w-3 h-3 mr-1" /> Respond
                          </Button>
                        </div>
                        {bp.legalReference && (
                          <p className="text-xs text-cosmic-muted flex items-center gap-1">
                            <Scale className="w-3 h-3" />
                            {bp.legalReference}
                          </p>
                        )}
                        <p className="text-xs text-cosmic-muted flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(bp.createdAt)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
              {recentBinding.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3 text-cosmic-muted hover:text-cosmic-rose"
                  onClick={() => setActiveTab('binding')}
                >
                  View All Binding Proposals{' '}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════ */}
        {/* INITIATIVES TAB */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="initiatives">
          {/* Filter bar */}
          <div className="glass-card rounded-2xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={initStatus} onValueChange={setInitStatus}>
                <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_pending">All Pending</SelectItem>
                  <SelectItem value="pending">Pending Response</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cosmic-muted" />
                <Input
                  placeholder="Search initiatives..."
                  className="pl-9 bg-white/5 border-white/10"
                  value={initSearch}
                  onChange={(e) => setInitSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchInitiatives()}
                />
              </div>
              <Select value={initSort} onValueChange={setInitSort}>
                <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="most_signed">Most Signed</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Initiatives grid */}
          {initLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-cosmic-amber animate-spin" />
            </div>
          ) : initiatives.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-cosmic-muted opacity-30" />
              <p className="text-cosmic-muted">No initiatives found</p>
              <p className="text-cosmic-muted text-xs mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {initiatives.map((init) => (
                <div
                  key={init.id}
                  className="glass-card rounded-2xl p-5 flex flex-col"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${typeBadgeColor(init.type)}`}
                    >
                      {formatType(init.type)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${statusBadgeColor(init.status)}`}
                    >
                      {formatStatus(init.status)}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm mb-2 line-clamp-1">
                    {init.title}
                  </h4>
                  <p className="text-xs text-cosmic-muted line-clamp-2 mb-3 flex-grow">
                    {init.description}
                  </p>

                  {/* Signature progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-cosmic-muted flex items-center gap-1">
                        <Users className="w-3 h-3" /> Signatures
                      </span>
                      <span className="font-medium">
                        {init.signatureCount}/{init.signatureGoal}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cosmic-teal to-cosmic-accent rounded-full transition-all duration-700"
                        style={{
                          width: `${signatureProgress(init.signatureCount, init.signatureGoal)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-cosmic-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(init.createdAt)}
                    </span>
                    {!init.governmentResponse && (
                      <Button
                        size="sm"
                        className="bg-cosmic-teal/20 text-cosmic-teal hover:bg-cosmic-teal/30 border-0 text-xs h-7"
                        onClick={() =>
                          openResponseDialog('initiative', init)
                        }
                      >
                        <Send className="w-3 h-3 mr-1" /> Respond
                      </Button>
                    )}
                    {init.governmentResponse && (
                      <Badge className="text-[10px] bg-cosmic-success/20 text-cosmic-success border-0">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Responded
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════ */}
        {/* BINDING PROPOSALS TAB */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="binding">
          {/* Filter bar */}
          <div className="glass-card rounded-2xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={bpStatus} onValueChange={setBpStatus}>
                <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending Response</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cosmic-muted" />
                <Input
                  placeholder="Search binding proposals..."
                  className="pl-9 bg-white/5 border-white/10"
                  value={bpSearch}
                  onChange={(e) => setBpSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchProposals()}
                />
              </div>
              <Select value={bpSort} onValueChange={setBpSort}>
                <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="most_signed">Most Signed</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Proposals grid */}
          {bpLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-cosmic-rose animate-spin" />
            </div>
          ) : proposals.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Gavel className="w-12 h-12 mx-auto mb-3 text-cosmic-muted opacity-30" />
              <p className="text-cosmic-muted">No binding proposals found</p>
              <p className="text-cosmic-muted text-xs mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {proposals.map((bp) => {
                const overdue = isOverdue(bp.responseDeadline);
                return (
                  <div
                    key={bp.id}
                    className={`glass-card rounded-2xl p-5 flex flex-col ${
                      overdue
                        ? 'ring-1 ring-cosmic-rose/40 border-cosmic-rose/30'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${typeBadgeColor(bp.type)}`}
                      >
                        {formatType(bp.type)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${statusBadgeColor(bp.status)}`}
                      >
                        {formatStatus(bp.status)}
                      </Badge>
                      {overdue && (
                        <Badge className="text-[10px] bg-cosmic-rose/20 text-cosmic-rose border-0">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Overdue
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm mb-2 line-clamp-1">
                      {bp.title}
                    </h4>
                    <p className="text-xs text-cosmic-muted line-clamp-2 mb-3">
                      {bp.description}
                    </p>

                    {/* Signature progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-cosmic-muted flex items-center gap-1">
                          <Users className="w-3 h-3" /> Signatures
                        </span>
                        <span className="font-medium">
                          {bp.signatureCount}/{bp.signatureGoal}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cosmic-rose to-cosmic-violet rounded-full transition-all duration-700"
                          style={{
                            width: `${signatureProgress(bp.signatureCount, bp.signatureGoal)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Deadline & Legal Reference */}
                    <div className="flex flex-col gap-1 mb-3">
                      {bp.responseDeadline && (
                        <span
                          className={`text-[10px] flex items-center gap-1 ${
                            overdue
                              ? 'text-cosmic-rose font-medium'
                              : 'text-cosmic-amber'
                          }`}
                        >
                          <CalendarClock className="w-3 h-3" />
                          {formatRelative(bp.responseDeadline)}
                        </span>
                      )}
                      {bp.legalReference && (
                        <span className="text-[10px] text-cosmic-muted flex items-center gap-1">
                          <Scale className="w-3 h-3" />
                          {bp.legalReference}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[10px] text-cosmic-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(bp.createdAt)}
                      </span>
                      {!bp.governmentResponse ? (
                        <Button
                          size="sm"
                          className="bg-cosmic-teal/20 text-cosmic-teal hover:bg-cosmic-teal/30 border-0 text-xs h-7"
                          onClick={() =>
                            openResponseDialog('binding', bp)
                          }
                        >
                          <Send className="w-3 h-3 mr-1" /> Respond
                        </Button>
                      ) : (
                        <Badge className="text-[10px] bg-cosmic-success/20 text-cosmic-success border-0">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Responded
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════ */}
        {/* LEGISLATION TAB */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="legislation">
          {/* Filter bar */}
          <div className="glass-card rounded-2xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={legStatus} onValueChange={setLegStatus}>
                <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="public_comment">Public Comment</SelectItem>
                  <SelectItem value="amendment">Amendment</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cosmic-muted" />
                <Input
                  placeholder="Search legislation..."
                  className="pl-9 bg-white/5 border-white/10"
                  value={legSearch}
                  onChange={(e) => setLegSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchLegislation()}
                />
              </div>
            </div>
          </div>

          {/* Legislation list */}
          {legLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-cosmic-violet animate-spin" />
            </div>
          ) : legislation.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <ScrollText className="w-12 h-12 mx-auto mb-3 text-cosmic-muted opacity-30" />
              <p className="text-cosmic-muted">No legislation found</p>
              <p className="text-cosmic-muted text-xs mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {legislation.map((leg) => {
                const comments = leg._count?.comments ?? leg.commentCount ?? 0;
                const amendments = leg._count?.amendments ?? leg.amendmentCount ?? 0;
                const votes = leg._count?.votes ?? (leg.supportCount + leg.opposeCount) ?? 0;

                return (
                  <div
                    key={leg.id}
                    className="glass-card rounded-2xl p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="min-w-0 flex-grow">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {leg.billNumber && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-cosmic-accent/30 text-cosmic-accent bg-cosmic-accent/10 font-mono"
                            >
                              {leg.billNumber}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${statusBadgeColor(leg.status)}`}
                          >
                            {formatStatus(leg.status)}
                          </Badge>
                          {leg.category && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-white/10 text-cosmic-muted"
                            >
                              {leg.category}
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold text-sm mb-1">
                          {leg.title}
                        </h4>
                        <p className="text-xs text-cosmic-muted line-clamp-2 mb-3">
                          {leg.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-cosmic-muted">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {comments} comments
                          </span>
                          <span className="flex items-center gap-1">
                            <FileCheck className="w-3 h-3" />
                            {amendments} amendments
                          </span>
                          <span className="flex items-center gap-1">
                            <Vote className="w-3 h-3" />
                            {votes} votes
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(leg.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        {(leg.status === 'review' ||
                          leg.status === 'amendment') && (
                          <Button
                            size="sm"
                            className="bg-cosmic-teal/20 text-cosmic-teal hover:bg-cosmic-teal/30 border-0 text-xs h-7"
                            onClick={() =>
                              updateLegislationStatus(leg.id, 'public_comment')
                            }
                          >
                            <ChevronRight className="w-3 h-3 mr-1" /> Public
                            Comment
                          </Button>
                        )}
                        {leg.status === 'public_comment' && (
                          <Button
                            size="sm"
                            className="bg-cosmic-accent/20 text-cosmic-accent hover:bg-cosmic-accent/30 border-0 text-xs h-7"
                            onClick={() =>
                              updateLegislationStatus(leg.id, 'voting')
                            }
                          >
                            <Vote className="w-3 h-3 mr-1" /> Advance to Voting
                          </Button>
                        )}
                        {leg.status === 'voting' && (
                          <Button
                            size="sm"
                            className="bg-cosmic-success/20 text-cosmic-success hover:bg-cosmic-success/30 border-0 text-xs h-7"
                            onClick={() =>
                              updateLegislationStatus(leg.id, 'enacted')
                            }
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Enact
                          </Button>
                        )}
                        {leg.status === 'enacted' && (
                          <Badge className="text-[10px] bg-cosmic-success/20 text-cosmic-success border-0">
                            <ShieldCheck className="w-3 h-3 mr-1" /> Enacted
                          </Badge>
                        )}
                        {leg.status === 'rejected' && (
                          <Badge className="text-[10px] bg-cosmic-rose/20 text-cosmic-rose border-0">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Rejected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════ */}
        {/* ANALYTICS TAB */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="analytics">
          {analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-cosmic-accent animate-spin" />
            </div>
          ) : !analytics ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-cosmic-muted opacity-30" />
              <p className="text-cosmic-muted">Failed to load analytics</p>
            </div>
          ) : (
            <>
              {/* Two big stat cards */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="glass-card-teal rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-cosmic-teal/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-cosmic-teal" />
                    </div>
                    <div>
                      <p className="text-xs text-cosmic-muted">
                        Initiative Response Rate
                      </p>
                      <p className="text-3xl font-bold font-heading text-cosmic-teal">
                        {analytics.initiativeResponseRate}%
                      </p>
                    </div>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-cosmic-teal to-cosmic-accent rounded-full transition-all duration-700"
                      style={{ width: `${analytics.initiativeResponseRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-cosmic-muted">
                    {analytics.respondedInitiatives} of{' '}
                    {analytics.totalInitiativesThreshold} initiatives responded
                  </p>
                </div>

                <div className="glass-card-rose rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-cosmic-rose/20 flex items-center justify-center">
                      <Gavel className="w-5 h-5 text-cosmic-rose" />
                    </div>
                    <div>
                      <p className="text-xs text-cosmic-muted">
                        Binding Proposal Response Rate
                      </p>
                      <p className="text-3xl font-bold font-heading text-cosmic-rose">
                        {analytics.bindingResponseRate}%
                      </p>
                    </div>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-cosmic-rose to-cosmic-violet rounded-full transition-all duration-700"
                      style={{ width: `${analytics.bindingResponseRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-cosmic-muted">
                    {analytics.respondedBinding} of{' '}
                    {analytics.totalBindingThreshold} proposals responded
                  </p>
                </div>
              </div>

              {/* Breakdowns */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* By Initiative Type */}
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cosmic-amber" /> By
                    Initiative Type
                  </h3>
                  {Object.keys(analytics.byType).length === 0 ? (
                    <div className="py-6 text-center text-sm text-cosmic-muted">
                      No threshold-reached initiatives yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(analytics.byType).map(([type, data]) => {
                        const pct =
                          data.total > 0
                            ? Math.round((data.responded / data.total) * 100)
                            : 0;
                        return (
                          <div key={type}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${typeBadgeColor(type)}`}
                                >
                                  {formatType(type)}
                                </Badge>
                              </div>
                              <span className="text-xs text-cosmic-muted">
                                {data.responded}/{data.total} responded ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cosmic-amber to-cosmic-teal rounded-full transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* By Binding Category */}
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cosmic-violet" /> By
                    Binding Category
                  </h3>
                  {Object.keys(analytics.byCategory).length === 0 ? (
                    <div className="py-6 text-center text-sm text-cosmic-muted">
                      No threshold-reached proposals yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(analytics.byCategory).map(
                        ([category, data]) => {
                          const pct =
                            data.total > 0
                              ? Math.round(
                                  (data.responded / data.total) * 100
                                )
                              : 0;
                          const colorMap: Record<string, string> = {
                            finance: 'from-cosmic-amber to-cosmic-accent',
                            environment: 'from-cosmic-teal to-cosmic-success',
                            infrastructure: 'from-cosmic-accent to-cosmic-teal',
                            social: 'from-cosmic-violet to-cosmic-rose',
                            education: 'from-cosmic-teal to-cosmic-accent',
                            health: 'from-cosmic-success to-cosmic-teal',
                            housing: 'from-cosmic-rose to-cosmic-amber',
                            uncategorized:
                              'from-white/30 to-white/20',
                          };
                          const grad =
                            colorMap[category] ||
                            'from-cosmic-violet to-cosmic-accent';
                          return (
                            <div key={category}>
                              <div className="flex items-center justify-between mb-1">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-white/10 text-cosmic-muted capitalize"
                                >
                                  {formatType(category)}
                                </Badge>
                                <span className="text-xs text-cosmic-muted">
                                  {data.responded}/{data.total} responded ({pct}
                                  %)
                                </span>
                              </div>
                              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full bg-gradient-to-r ${grad} rounded-full transition-all duration-700`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════ */}
      {/* RESPONSE DIALOG */}
      {/* ═══════════════════════════════════════════ */}
      <Dialog
        open={responseDialog.item !== null}
        onOpenChange={(open) => {
          if (!open) closeResponseDialog();
        }}
      >
        <DialogContent className="glass-card rounded-2xl border-white/10 max-w-lg">
          {submitSuccess ? (
            <div className="py-8 text-center" style={{ animation: 'scaleIn 0.3s ease-out' }}>
              <div className="w-16 h-16 rounded-full bg-cosmic-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-cosmic-success" />
              </div>
              <h3 className="text-lg font-semibold font-heading mb-2">
                Response Submitted
              </h3>
              <p className="text-sm text-cosmic-muted">
                Your response has been recorded and the creator has been
                notified.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading flex items-center gap-2">
                  {responseDialog.type === 'initiative' ? (
                    <FileText className="w-5 h-5 text-cosmic-amber" />
                  ) : (
                    <Gavel className="w-5 h-5 text-cosmic-rose" />
                  )}
                  Respond to {responseDialog.type === 'initiative' ? 'Initiative' : 'Binding Proposal'}
                </DialogTitle>
                <DialogDescription className="text-cosmic-muted text-sm">
                  {responseDialog.item?.title}
                </DialogDescription>
              </DialogHeader>

              {responseDialog.item && (
                <div className="space-y-4 mt-2">
                  {/* Description preview */}
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <p className="text-xs text-cosmic-muted line-clamp-3">
                      {responseDialog.item.description}
                    </p>
                  </div>

                  {/* Response text */}
                  <div>
                    <label className="text-xs font-medium text-cosmic-muted mb-1.5 block">
                      Government Response <span className="text-cosmic-rose">*</span>
                    </label>
                    <Textarea
                      placeholder="Enter the official government response..."
                      className="bg-white/5 border-white/10 min-h-[120px] resize-y"
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                    />
                  </div>

                  {/* Status selector */}
                  <div>
                    <label className="text-xs font-medium text-cosmic-muted mb-1.5 block">
                      Set Status
                    </label>
                    <Select
                      value={responseStatus}
                      onValueChange={setResponseStatus}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="government_response">
                          Government Response
                        </SelectItem>
                        <SelectItem value="voting">Voting</SelectItem>
                        {responseDialog.type === 'binding' && (
                          <SelectItem value="scheduled_vote">
                            Scheduled Vote
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Binding-specific fields */}
                  {responseDialog.type === 'binding' && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-cosmic-muted mb-1.5 block">
                          Impact Assessment (optional)
                        </label>
                        <Textarea
                          placeholder="Assess the impact of this proposal..."
                          className="bg-white/5 border-white/10 min-h-[80px] resize-y"
                          value={impactAssessment}
                          onChange={(e) => setImpactAssessment(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-cosmic-muted mb-1.5 block">
                          Legal Reference (optional)
                        </label>
                        <Input
                          placeholder="e.g., Art. 47 Sec. 3"
                          className="bg-white/5 border-white/10"
                          value={legalRef}
                          onChange={(e) => setLegalRef(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-cosmic-muted mb-1.5 block">
                          Vote Date (optional)
                        </label>
                        <Input
                          type="datetime-local"
                          className="bg-white/5 border-white/10"
                          value={voteDate}
                          onChange={(e) => setVoteDate(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* Submit */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      variant="ghost"
                      className="text-cosmic-muted"
                      onClick={closeResponseDialog}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-cosmic-teal hover:bg-cosmic-teal/90 text-white rounded-xl px-6"
                      onClick={submitResponse}
                      disabled={submitting || !responseText.trim()}
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Submit Response
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
