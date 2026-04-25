'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  GitPullRequest,
  CheckCircle2,
  Scale,
  ChevronRight,
  ChevronDown,
  Clock,
  User,
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
  Hand,
  Send,
  Plus,
  Orbit,
} from 'lucide-react';
import { getCategory, resolveCategory } from '@/lib/categories';

interface Comment {
  id: string;
  content: string;
  sectionRef: string | null;
  type: string;
  parentCommentId: string | null;
  aiSentiment: string | null;
  createdAt: string;
  user: { id: string; name: string | null; avatarUrl: string | null };
  replies?: Comment[];
}

interface Amendment {
  id: string;
  title: string;
  description: string;
  sectionRef: string | null;
  originalText: string | null;
  proposedText: string | null;
  rationale: string | null;
  status: string;
  secondCount: number;
  supportCount: number;
  opposeCount: number;
  createdAt: string;
  updatedAt: string;
  proposer: { id: string; name: string | null; avatarUrl: string | null };
}

interface LegislationDetail {
  id: string;
  title: string;
  description: string;
  billNumber: string | null;
  status: string;
  category: string | null;
  sponsorName: string | null;
  sponsorId: string | null;
  cosponsors: string;
  fullText: string | null;
  summaryAi: string | null;
  currentVersion: number;
  versions: string;
  commentCount: number;
  supportCount: number;
  opposeCount: number;
  amendmentCount: number;
  quorumRequired: number;
  votingOpensAt: string | null;
  votingClosesAt: string | null;
  enactedAt: string | null;
  createdAt: string;
  updatedAt: string;
  creator: { id: string; name: string | null; avatarUrl: string | null };
  comments: Comment[];
  amendments: Amendment[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'text-cosmic-muted bg-white/10 border-white/10', icon: FileText },
  review: { label: 'In Review', color: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20', icon: Clock },
  public_comment: { label: 'Public Comment', color: 'text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20', icon: MessageSquare },
  amendment: { label: 'Amendment', color: 'text-cosmic-violet bg-cosmic-violet/10 border-cosmic-violet/20', icon: GitPullRequest },
  voting: { label: 'Voting', color: 'text-cosmic-accent bg-cosmic-accent/10 border-cosmic-accent/20', icon: ThumbsUp },
  passed: { label: 'Passed', color: 'text-cosmic-success bg-cosmic-success/10 border-cosmic-success/20', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20', icon: ThumbsDown },
  enacted: { label: 'Enacted', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: Scale },
};

const TIMELINE_STEPS = [
  { key: 'draft', label: 'Draft' },
  { key: 'review', label: 'Review' },
  { key: 'public_comment', label: 'Comment' },
  { key: 'amendment', label: 'Amend' },
  { key: 'voting', label: 'Vote' },
  { key: 'passed', label: 'Passed' },
  { key: 'enacted', label: 'Enacted' },
];

const COMMENT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  comment: { label: 'Comment', color: 'text-cosmic-muted bg-white/10 border-white/10', icon: MessageSquare },
  suggestion: { label: 'Suggestion', color: 'text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20', icon: Sparkles },
  question: { label: 'Question', color: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20', icon: HelpCircle },
  objection: { label: 'Objection', color: 'text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20', icon: AlertCircle },
  support: { label: 'Support', color: 'text-cosmic-success bg-cosmic-success/10 border-cosmic-success/20', icon: Hand },
};

const AMENDMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  proposed: { label: 'Proposed', color: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20' },
  seconded: { label: 'Seconded', color: 'text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20' },
  under_review: { label: 'Under Review', color: 'text-cosmic-violet bg-cosmic-violet/10 border-cosmic-violet/20' },
  accepted: { label: 'Accepted', color: 'text-cosmic-success bg-cosmic-success/10 border-cosmic-success/20' },
  rejected: { label: 'Rejected', color: 'text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20' },
  incorporated: { label: 'Incorporated', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
};

function getTimelineIndex(status: string): number {
  if (status === 'rejected') return 4; // at voting step but failed
  const idx = TIMELINE_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

export default function LegislationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [legislation, setLegislation] = useState<LegislationDetail | null>(null);
  const [voteCounts, setVoteCounts] = useState({ support: 0, oppose: 0, abstain: 0, total: 0 });
  const [userVote, setUserVote] = useState<{ id: string; position: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullTextOpen, setFullTextOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('comments');

  // Comment form
  const [commentContent, setCommentContent] = useState('');
  const [commentType, setCommentType] = useState('comment');
  const [commentSectionRef, setCommentSectionRef] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Amendment form
  const [amendDialogOpen, setAmendDialogOpen] = useState(false);
  const [amendForm, setAmendForm] = useState({
    title: '',
    description: '',
    sectionRef: '',
    originalText: '',
    proposedText: '',
    rationale: '',
  });
  const [submittingAmend, setSubmittingAmend] = useState(false);

  // Voting
  const [voting, setVoting] = useState(false);

  const fetchLegislation = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/legislation/${id}`);
      if (res.ok) {
        const data = await res.json();
        setLegislation(data.legislation);
        setVoteCounts(data.voteCounts);
        setUserVote(data.userVote);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchLegislation(); }, [fetchLegislation]);

  const handleVote = async (position: 'support' | 'oppose' | 'abstain') => {
    setVoting(true);
    try {
      const res = await fetch(`/api/legislation/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position }),
      });
      if (res.ok) {
        fetchLegislation();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to vote');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVoting(false);
    }
  };

  const handleComment = async () => {
    if (!commentContent.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/legislation/${id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentContent,
          type: commentType,
          sectionRef: commentSectionRef || null,
        }),
      });
      if (res.ok) {
        setCommentContent('');
        setCommentType('comment');
        setCommentSectionRef('');
        fetchLegislation();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add comment');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAmendment = async () => {
    if (!amendForm.title || !amendForm.description) return;
    setSubmittingAmend(true);
    try {
      const res = await fetch(`/api/legislation/${id}/amendment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(amendForm),
      });
      if (res.ok) {
        setAmendDialogOpen(false);
        setAmendForm({ title: '', description: '', sectionRef: '', originalText: '', proposedText: '', rationale: '' });
        fetchLegislation();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to propose amendment');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAmend(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cosmic-amber animate-spin" />
      </div>
    );
  }

  if (!legislation) {
    return (
      <div className="glass-card p-12 rounded-2xl text-center">
        <Scale className="w-12 h-12 text-cosmic-muted/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Legislation Not Found</h3>
        <p className="text-cosmic-muted text-sm mb-4">This bill may have been removed or the link is incorrect.</p>
        <Button className="bg-cosmic-amber text-[#0B1022]" onClick={() => router.push('/dashboard/participation/legislation')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Legislation
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[legislation.status] || STATUS_CONFIG.draft;
  const StatusIcon = statusCfg.icon;
  const categoryCfg = getCategory(resolveCategory(legislation.category));
  const CategoryIcon = categoryCfg.icon;
  const timelineIdx = getTimelineIndex(legislation.status);
  const cosponsors: string[] = JSON.parse(legislation.cosponsors || '[]');

  // Group comments into threads
  const topLevelComments = legislation.comments.filter((c) => !c.parentCommentId);
  const getReplies = (parentId: string) => legislation.comments.filter((c) => c.parentCommentId === parentId);

  return (
    <div className="space-y-4 sm:space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Back nav + Bill Number */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="text-cosmic-muted hover:text-white p-2" onClick={() => router.push('/dashboard/participation/legislation')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        {legislation.billNumber && (
          <Badge className="text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20 border font-mono">
            {legislation.billNumber}
          </Badge>
        )}
        <Badge className={`${categoryCfg.color} ${categoryCfg.bgColor} ${categoryCfg.borderColor} border`}>
          <CategoryIcon className="w-3 h-3 mr-1" />
          {categoryCfg.label}
        </Badge>
        <Badge className={`${statusCfg.color} border`}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {statusCfg.label}
        </Badge>
      </div>

      {/* Title + Description */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-2">
          {legislation.title}
        </h1>
        <p className="text-cosmic-muted text-sm sm:text-base max-w-3xl">
          {legislation.description}
        </p>
        {(legislation.sponsorName || cosponsors.length > 0) && (
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {legislation.sponsorName && (
              <div className="flex items-center gap-1.5 text-xs text-cosmic-muted">
                <User className="w-3 h-3" />
                Sponsor: <span className="text-white">{legislation.sponsorName}</span>
              </div>
            )}
            {cosponsors.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-cosmic-muted">
                <Orbit className="w-3 h-3" />
                Co-sponsors: <span className="text-white">{cosponsors.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Timeline */}
      <div className="glass-card p-4 sm:p-6 rounded-xl">
        <h3 className="text-sm font-semibold text-cosmic-muted uppercase tracking-wider mb-4">Legislative Progress</h3>
        <div className="flex items-center gap-0 w-full overflow-x-auto">
          {TIMELINE_STEPS.map((step, idx) => {
            const isCompleted = idx < timelineIdx;
            const isActive = idx === timelineIdx;
            const isRejected = legislation.status === 'rejected' && idx === 4;

            return (
              <div key={step.key} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1 min-w-0 flex-shrink-0">
                  <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isActive
                        ? 'bg-cosmic-amber glow-amber scale-110'
                        : isRejected
                        ? 'bg-cosmic-rose'
                        : isCompleted
                        ? 'bg-cosmic-teal/60'
                        : 'bg-white/10'
                    }`}
                  >
                    {isCompleted && (
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {isRejected && <ThumbsDown className="w-3 h-3 text-white" />}
                    {isActive && <Orbit className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0B1022]" />}
                  </div>
                  <span className={`text-[9px] sm:text-[10px] leading-tight text-center truncate max-w-[56px] ${
                    isActive ? 'text-cosmic-amber font-semibold' : isCompleted ? 'text-cosmic-muted' : 'text-white/30'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {idx < TIMELINE_STEPS.length - 1 && (
                  <div className={`h-px flex-grow mx-0.5 ${isCompleted ? 'bg-cosmic-teal/40' : 'bg-white/10'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column: Full Text + AI Summary */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Full Text (Collapsible) */}
          {legislation.fullText && (
            <Collapsible open={fullTextOpen} onOpenChange={setFullTextOpen}>
              <Card className="glass-card rounded-xl">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cosmic-amber" />
                        Full Legislative Text
                      </h3>
                      <ChevronDown className={`w-4 h-4 text-cosmic-muted transition-transform ${fullTextOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-cosmic-muted font-sans leading-relaxed">
                        {legislation.fullText}
                      </pre>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* AI Summary Card */}
          {legislation.summaryAi && (
            <Card className="glass-card-violet rounded-xl">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-cosmic-violet" />
                  <h3 className="text-sm font-semibold text-cosmic-violet">AI Summary</h3>
                </div>
                <p className="text-sm text-cosmic-muted leading-relaxed">
                  {legislation.summaryAi}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Vote Section */}
          <Card className="glass-card rounded-xl">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-cosmic-muted uppercase tracking-wider mb-4">Cast Your Vote</h3>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Button
                  className={`flex-1 sm:flex-none min-w-[120px] ${
                    userVote?.position === 'support'
                      ? 'bg-cosmic-teal text-[#0B1022] hover:bg-cosmic-teal/90'
                      : 'bg-cosmic-teal/10 text-cosmic-teal border border-cosmic-teal/20 hover:bg-cosmic-teal/20'
                  }`}
                  variant={userVote?.position === 'support' ? 'default' : 'ghost'}
                  onClick={() => handleVote('support')}
                  disabled={voting}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Support ({voteCounts.support})
                </Button>
                <Button
                  className={`flex-1 sm:flex-none min-w-[120px] ${
                    userVote?.position === 'oppose'
                      ? 'bg-cosmic-rose text-white hover:bg-cosmic-rose/90'
                      : 'bg-cosmic-rose/10 text-cosmic-rose border border-cosmic-rose/20 hover:bg-cosmic-rose/20'
                  }`}
                  variant={userVote?.position === 'oppose' ? 'default' : 'ghost'}
                  onClick={() => handleVote('oppose')}
                  disabled={voting}
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Oppose ({voteCounts.oppose})
                </Button>
                <Button
                  className={`flex-1 sm:flex-none min-w-[120px] ${
                    userVote?.position === 'abstain'
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'bg-white/5 text-cosmic-muted border border-white/10 hover:bg-white/10'
                  }`}
                  variant={userVote?.position === 'abstain' ? 'default' : 'ghost'}
                  onClick={() => handleVote('abstain')}
                  disabled={voting}
                >
                  <Minus className="w-4 h-4 mr-2" />
                  Abstain ({voteCounts.abstain})
                </Button>
              </div>

              {/* Vote bar */}
              {voteCounts.total > 0 && (
                <div className="space-y-2">
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden flex">
                    {voteCounts.support > 0 && (
                      <div
                        className="h-full bg-cosmic-teal transition-all duration-700"
                        style={{ width: `${(voteCounts.support / voteCounts.total) * 100}%` }}
                      />
                    )}
                    {voteCounts.abstain > 0 && (
                      <div
                        className="h-full bg-white/20 transition-all duration-700"
                        style={{ width: `${(voteCounts.abstain / voteCounts.total) * 100}%` }}
                      />
                    )}
                    {voteCounts.oppose > 0 && (
                      <div
                        className="h-full bg-cosmic-rose transition-all duration-700"
                        style={{ width: `${(voteCounts.oppose / voteCounts.total) * 100}%` }}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-cosmic-muted">
                    <span>{voteCounts.total} total votes</span>
                    <span>Quorum: {voteCounts.total}/{legislation.quorumRequired}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments & Amendments Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-3">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="comments" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-cosmic-muted">
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                  Comments ({legislation.comments.length})
                </TabsTrigger>
                <TabsTrigger value="amendments" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-cosmic-muted">
                  <GitPullRequest className="w-3.5 h-3.5 mr-1.5" />
                  Amendments ({legislation.amendments.length})
                </TabsTrigger>
              </TabsList>
              {activeTab === 'amendments' && (
                <Button
                  className="bg-cosmic-violet/10 text-cosmic-violet border border-cosmic-violet/20 hover:bg-cosmic-violet/20"
                  variant="ghost"
                  onClick={() => setAmendDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Propose Amendment
                </Button>
              )}
            </div>

            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-4">
              {/* Add Comment */}
              <div className="glass-card p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.entries(COMMENT_TYPE_CONFIG).map(([key, cfg]) => {
                    const CfgIcon = cfg.icon;
                    const isActive = commentType === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setCommentType(key)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                          isActive
                            ? `${cfg.color} ring-1 ring-current/20`
                            : 'bg-white/5 text-cosmic-muted border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <CfgIcon className="w-3 h-3" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
                <Input
                  placeholder="Section reference (optional, e.g., Section 3.2)"
                  className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 text-xs"
                  value={commentSectionRef}
                  onChange={(e) => setCommentSectionRef(e.target.value)}
                />
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Share your thoughts on this legislation..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 min-h-[60px]"
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                  />
                  <Button
                    className="bg-cosmic-teal text-[#0B1022] hover:bg-cosmic-teal/90 self-end shrink-0"
                    onClick={handleComment}
                    disabled={submittingComment || !commentContent.trim()}
                  >
                    {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              {topLevelComments.length === 0 ? (
                <div className="glass-card p-8 rounded-xl text-center">
                  <MessageSquare className="w-8 h-8 text-cosmic-muted/30 mx-auto mb-3" />
                  <p className="text-cosmic-muted text-sm">No comments yet. Be the first to share your thoughts.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {topLevelComments.map((comment) => {
                    const typeCfg = COMMENT_TYPE_CONFIG[comment.type] || COMMENT_TYPE_CONFIG.comment;
                    const TypeIcon = typeCfg.icon;
                    const replies = getReplies(comment.id);

                    return (
                      <div key={comment.id} className="glass-card p-4 rounded-xl">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-cosmic-accent/20 flex items-center justify-center text-xs font-bold text-cosmic-accent shrink-0">
                            {(comment.user.name || 'U')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-medium text-white">{comment.user.name || 'Anonymous'}</span>
                              <Badge className={`${typeCfg.color} text-[9px] border py-0 px-1.5`}>
                                <TypeIcon className="w-2.5 h-2.5 mr-0.5" />
                                {typeCfg.label}
                              </Badge>
                              {comment.sectionRef && (
                                <Badge className="text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20 text-[9px] border py-0 px-1.5 font-mono">
                                  {comment.sectionRef}
                                </Badge>
                              )}
                              <span className="text-[10px] text-cosmic-muted ml-auto">{formatRelativeTime(comment.createdAt)}</span>
                            </div>
                            <p className="text-sm text-cosmic-muted leading-relaxed">{comment.content}</p>

                            {/* Replies */}
                            {replies.length > 0 && (
                              <div className="mt-3 ml-4 space-y-2 border-l border-white/5 pl-3">
                                {replies.map((reply) => (
                                  <div key={reply.id} className="flex items-start gap-2">
                                    <div className="w-5 h-5 rounded-full bg-cosmic-violet/20 flex items-center justify-center text-[8px] font-bold text-cosmic-violet shrink-0">
                                      {(reply.user.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div>
                                      <span className="text-xs font-medium text-white mr-2">{reply.user.name || 'Anonymous'}</span>
                                      <span className="text-xs text-cosmic-muted">{reply.content}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Amendments Tab */}
            <TabsContent value="amendments" className="space-y-4">
              {legislation.amendments.length === 0 ? (
                <div className="glass-card p-8 rounded-xl text-center">
                  <GitPullRequest className="w-8 h-8 text-cosmic-muted/30 mx-auto mb-3" />
                  <p className="text-cosmic-muted text-sm mb-3">No amendments proposed yet.</p>
                  <Button
                    className="bg-cosmic-violet/10 text-cosmic-violet border border-cosmic-violet/20 hover:bg-cosmic-violet/20"
                    variant="ghost"
                    onClick={() => setAmendDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Propose Amendment
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {legislation.amendments.map((amendment) => {
                    const amendStatusCfg = AMENDMENT_STATUS_CONFIG[amendment.status] || AMENDMENT_STATUS_CONFIG.proposed;

                    return (
                      <Card key={amendment.id} className="glass-card rounded-xl">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between mb-1 flex-wrap gap-1.5">
                            <h4 className="text-sm font-semibold text-white flex-1 min-w-0">
                              {amendment.title}
                            </h4>
                            <Badge className={`${amendStatusCfg.color} text-[10px] border`}>
                              {amendStatusCfg.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-cosmic-muted line-clamp-2">{amendment.description}</p>
                          {amendment.sectionRef && (
                            <Badge className="text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20 text-[9px] border font-mono mt-1">
                              {amendment.sectionRef}
                            </Badge>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Original vs Proposed Text Diff */}
                          {(amendment.originalText || amendment.proposedText) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {amendment.originalText && (
                                <div className="bg-cosmic-rose/5 border border-cosmic-rose/10 rounded-lg p-3">
                                  <span className="text-[10px] text-cosmic-rose font-semibold uppercase tracking-wider">Original</span>
                                  <p className="text-xs text-cosmic-muted mt-1 line-clamp-3">{amendment.originalText}</p>
                                </div>
                              )}
                              {amendment.proposedText && (
                                <div className="bg-cosmic-teal/5 border border-cosmic-teal/10 rounded-lg p-3">
                                  <span className="text-[10px] text-cosmic-teal font-semibold uppercase tracking-wider">Proposed</span>
                                  <p className="text-xs text-cosmic-muted mt-1 line-clamp-3">{amendment.proposedText}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {amendment.rationale && (
                            <p className="text-xs text-cosmic-muted italic">
                              <strong className="text-white not-italic">Rationale:</strong> {amendment.rationale}
                            </p>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <div className="flex items-center gap-1.5 text-xs text-cosmic-muted">
                              <div className="w-5 h-5 rounded-full bg-cosmic-violet/20 flex items-center justify-center text-[9px] font-bold text-cosmic-violet">
                                {(amendment.proposer.name || 'U')[0].toUpperCase()}
                              </div>
                              {amendment.proposer.name || 'Anonymous'}
                              <span className="text-[10px] ml-1">{formatRelativeTime(amendment.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-xs text-cosmic-teal">
                                <ThumbsUp className="w-3 h-3" /> {amendment.secondCount} second{amendment.secondCount !== 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-cosmic-muted">
                                {amendment.supportCount}/{amendment.opposeCount}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Sidebar Info */}
        <div className="space-y-4">
          {/* Bill Info Card */}
          <Card className="glass-card rounded-xl">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-cosmic-muted uppercase tracking-wider">Bill Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-cosmic-muted">Version</span>
                  <span className="text-white font-mono">v{legislation.currentVersion}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cosmic-muted">Introduced</span>
                  <span className="text-white">{formatDate(legislation.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cosmic-muted">Last Updated</span>
                  <span className="text-white">{formatDate(legislation.updatedAt)}</span>
                </div>
                {legislation.votingOpensAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-cosmic-muted">Voting Opens</span>
                    <span className="text-white">{formatDate(legislation.votingOpensAt)}</span>
                  </div>
                )}
                {legislation.votingClosesAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-cosmic-muted">Voting Closes</span>
                    <span className="text-cosmic-amber">{formatDate(legislation.votingClosesAt)}</span>
                  </div>
                )}
                {legislation.enactedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-cosmic-muted">Enacted</span>
                    <span className="text-cosmic-success">{formatDate(legislation.enactedAt)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-cosmic-muted">Quorum</span>
                  <span className="text-white">{legislation.quorumRequired} votes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Stats */}
          <Card className="glass-card rounded-xl">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-cosmic-muted uppercase tracking-wider">Activity</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cosmic-teal" />
                  <span className="text-sm text-cosmic-muted">{legislation.comments.length} Comments</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4 text-cosmic-violet" />
                  <span className="text-sm text-cosmic-muted">{legislation.amendments.length} Amendments</span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-cosmic-teal" />
                  <span className="text-sm text-cosmic-muted">{voteCounts.support} Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-cosmic-rose" />
                  <span className="text-sm text-cosmic-muted">{voteCounts.oppose} Oppose</span>
                </div>
                <div className="flex items-center gap-2">
                  <Minus className="w-4 h-4 text-cosmic-muted" />
                  <span className="text-sm text-cosmic-muted">{voteCounts.abstain} Abstain</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-card rounded-xl">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-cosmic-muted uppercase tracking-wider mb-3">Quick Actions</h3>
              <Button
                className="w-full bg-cosmic-violet/10 text-cosmic-violet border border-cosmic-violet/20 hover:bg-cosmic-violet/20 justify-start"
                variant="ghost"
                onClick={() => { setActiveTab('amendments'); setAmendDialogOpen(true); }}
              >
                <GitPullRequest className="w-4 h-4 mr-2" /> Propose Amendment
              </Button>
              <Button
                className="w-full bg-cosmic-teal/10 text-cosmic-teal border border-cosmic-teal/20 hover:bg-cosmic-teal/20 justify-start"
                variant="ghost"
                onClick={() => { setActiveTab('comments'); }}
              >
                <MessageSquare className="w-4 h-4 mr-2" /> Add Comment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Propose Amendment Dialog */}
      <Dialog open={amendDialogOpen} onOpenChange={setAmendDialogOpen}>
        <DialogContent className="bg-[#0B1022] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-cosmic-violet" />
              Propose Amendment
            </DialogTitle>
            <DialogDescription className="text-cosmic-muted">
              Suggest changes to this legislation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Amendment Title *</label>
              <Input
                placeholder="What section or provision are you amending?"
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                value={amendForm.title}
                onChange={(e) => setAmendForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Description *</label>
              <Textarea
                placeholder="Describe the proposed change..."
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 min-h-[80px]"
                value={amendForm.description}
                onChange={(e) => setAmendForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Section Reference</label>
              <Input
                placeholder="e.g., Section 3.2"
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 font-mono"
                value={amendForm.sectionRef}
                onChange={(e) => setAmendForm((f) => ({ ...f, sectionRef: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm text-cosmic-rose mb-1 block">Original Text</label>
                <Textarea
                  placeholder="The current text you want to change..."
                  className="bg-cosmic-rose/5 border-cosmic-rose/10 text-white placeholder:text-cosmic-muted/50 min-h-[60px] text-xs font-mono"
                  value={amendForm.originalText}
                  onChange={(e) => setAmendForm((f) => ({ ...f, originalText: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-cosmic-teal mb-1 block">Proposed Text</label>
                <Textarea
                  placeholder="Your proposed replacement text..."
                  className="bg-cosmic-teal/5 border-cosmic-teal/10 text-white placeholder:text-cosmic-muted/50 min-h-[60px] text-xs font-mono"
                  value={amendForm.proposedText}
                  onChange={(e) => setAmendForm((f) => ({ ...f, proposedText: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-cosmic-muted mb-1 block">Rationale</label>
              <Textarea
                placeholder="Why is this amendment needed?"
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 min-h-[60px]"
                value={amendForm.rationale}
                onChange={(e) => setAmendForm((f) => ({ ...f, rationale: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" className="text-cosmic-muted hover:text-white" onClick={() => setAmendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-cosmic-violet text-white hover:bg-cosmic-violet/90"
              onClick={handleAmendment}
              disabled={submittingAmend || !amendForm.title || !amendForm.description}
            >
              {submittingAmend ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Propose Amendment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
