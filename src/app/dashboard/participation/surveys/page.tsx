'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  ClipboardList,
  Plus,
  Search,
  Loader2,
  Users,
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  Trash2,
  GripVertical,
  ListChecks,
  MessageSquare,
  Star,
  SlidersHorizontal,
  ToggleLeft,
} from 'lucide-react';
import { GOVERNANCE_CATEGORIES, getCategory, resolveCategory } from '@/lib/categories';

interface Survey {
  id: string;
  title: string;
  description: string;
  status: string;
  anonymous: boolean;
  allowMultiple: boolean;
  questionCount: number;
  responseCount: number;
  category: string | null;
  closesAt: string | null;
  createdAt: string;
  createdBy: string;
  creator: { id: string; name: string | null; avatarUrl: string | null };
  questions: { id: string; type: string; text: string; required: boolean }[];
  _count: { responses: number };
}

interface Stats {
  activeSurveys: number;
  totalResponses: number;
  avgCompletionRate: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'text-cosmic-muted bg-white/5 border-white/10' },
  active: { label: 'Active', color: 'text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20' },
  paused: { label: 'Paused', color: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20' },
  closed: { label: 'Closed', color: 'text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20' },
  analyzed: { label: 'Analyzed', color: 'text-cosmic-violet bg-cosmic-violet/10 border-cosmic-violet/20' },
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'draft', label: 'Draft' },
];

const QUESTION_TYPE_OPTIONS = [
  { value: 'single_choice', label: 'Single Choice', icon: ToggleLeft },
  { value: 'multiple_choice', label: 'Multiple Choice', icon: ListChecks },
  { value: 'text', label: 'Text', icon: MessageSquare },
  { value: 'rating', label: 'Rating', icon: Star },
  { value: 'yes_no', label: 'Yes / No', icon: CheckCircle2 },
  { value: 'scale', label: 'Scale', icon: SlidersHorizontal },
];

interface QuestionForm {
  text: string;
  type: string;
  options: { id: string; label: string }[];
  required: boolean;
  allowOther: boolean;
  minRating: number;
  maxRating: number;
}

function formatTimeRemaining(closesAt: string | null): string {
  if (!closesAt) return 'No deadline';
  const end = new Date(closesAt);
  const now = new Date();
  if (end < now) return 'Closed';
  const diff = end.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 30) return `${Math.floor(days / 30)}mo left`;
  if (days > 0) return `${days}d left`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `${hours}h left`;
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ activeSurveys: 0, totalResponses: 0, avgCompletionRate: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: 'community',
    anonymous: true,
    allowMultiple: false,
    targetAudience: 'all',
    closesAt: '',
  });
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { text: '', type: 'single_choice', options: [{ id: 'opt1', label: 'Option 1' }, { id: 'opt2', label: 'Option 2' }], required: true, allowOther: false, minRating: 1, maxRating: 5 },
  ]);
  const [creating, setCreating] = useState(false);

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/surveys?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSurveys(data.surveys);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, search]);

  useEffect(() => { fetchSurveys(); }, [fetchSurveys]);

  // Client-side search filter for instant feedback
  const filteredSurveys = useMemo(() => {
    if (!search) return surveys;
    const q = search.toLowerCase();
    return surveys.filter(
      (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  }, [surveys, search]);

  // Create survey handlers
  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: '', type: 'single_choice', options: [{ id: `opt${Date.now()}1`, label: 'Option 1' }, { id: `opt${Date.now()}2`, label: 'Option 2' }], required: true, allowOther: false, minRating: 1, maxRating: 5 },
    ]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: keyof QuestionForm, value: unknown) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    // Reset options when changing type
    if (field === 'type') {
      if (['single_choice', 'multiple_choice'].includes(value as string)) {
        updated[idx].options = [{ id: `opt${Date.now()}1`, label: 'Option 1' }, { id: `opt${Date.now()}2`, label: 'Option 2' }];
      } else if (value === 'yes_no') {
        updated[idx].options = [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }];
      } else {
        updated[idx].options = [];
      }
    }
    setQuestions(updated);
  };

  const updateOption = (qIdx: number, oIdx: number, label: string) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = { ...updated[qIdx].options[oIdx], label };
    setQuestions(updated);
  };

  const addOption = (qIdx: number) => {
    const updated = [...questions];
    updated[qIdx].options.push({ id: `opt${Date.now()}`, label: `Option ${updated[qIdx].options.length + 1}` });
    setQuestions(updated);
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    const updated = [...questions];
    if (updated[qIdx].options.length <= 2) return;
    updated[qIdx].options = updated[qIdx].options.filter((_, i) => i !== oIdx);
    setQuestions(updated);
  };

  const handleCreate = async () => {
    if (!createForm.title || !createForm.description) return;
    const hasEmptyQ = questions.some((q) => !q.text.trim());
    if (hasEmptyQ) return;

    setCreating(true);
    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          questions: questions.map((q) => ({
            text: q.text,
            type: q.type,
            options: ['single_choice', 'multiple_choice', 'yes_no'].includes(q.type) ? q.options : [],
            required: q.required,
            allowOther: q.allowOther,
            minRating: q.type === 'rating' ? q.minRating : undefined,
            maxRating: q.type === 'rating' ? q.maxRating : undefined,
          })),
        }),
      });
      if (res.ok) {
        setCreateDialogOpen(false);
        setCreateForm({ title: '', description: '', category: 'community', anonymous: true, allowMultiple: false, targetAudience: 'all', closesAt: '' });
        setQuestions([{ text: '', type: 'single_choice', options: [{ id: 'opt1', label: 'Option 1' }, { id: 'opt2', label: 'Option 2' }], required: true, allowOther: false, minRating: 1, maxRating: 5 }]);
        fetchSurveys();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create survey');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl glass-card p-4 sm:p-6 lg:p-8">
        <div className="absolute inset-0 starfield opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-5 h-5 text-cosmic-accent" />
            <span className="text-cosmic-accent text-sm font-semibold tracking-wider uppercase">Community Voice</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
            Surveys &{' '}
            <span className="text-gradient">Polls</span>
          </h1>
          <p className="text-cosmic-muted text-sm sm:text-base max-w-2xl mb-4 sm:mb-8">
            Share your opinion on community matters. Every response shapes decisions — from budget priorities to neighborhood improvements.
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[
              { label: 'Active Surveys', value: stats.activeSurveys, icon: ClipboardList, color: 'text-cosmic-teal' },
              { label: 'Total Responses', value: stats.totalResponses, icon: Users, color: 'text-cosmic-accent' },
              { label: 'Avg. Completion', value: `${stats.avgCompletionRate}%`, icon: BarChart3, color: 'text-cosmic-violet' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-3 sm:p-4 rounded-xl">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stat.color}`} />
                  <span className="text-[10px] sm:text-xs text-cosmic-muted">{stat.label}</span>
                </div>
                <p className={`text-lg sm:text-xl font-bold font-heading ${stat.color}`}>
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((sf) => (
          <button
            key={sf.value}
            onClick={() => setStatusFilter(sf.value)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 border ${
              statusFilter === sf.value
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-white/5 text-cosmic-muted border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            {sf.label}
            {sf.value !== 'all' && (
              <span className="ml-1 text-[10px] opacity-60">
                {surveys.filter((s) => s.status === sf.value).length || ''}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Category Filter Chips + Search + Create */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-cosmic-muted" />
          <span className="text-sm text-cosmic-muted font-medium">Category</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 border ${
              categoryFilter === 'all'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-white/5 text-cosmic-muted border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All
          </button>
          {GOVERNANCE_CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(isSelected ? 'all' : cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 border ${
                  isSelected
                    ? `${cat.bgColor} ${cat.color} ${cat.borderColor} ring-1 ring-current/20`
                    : 'bg-white/5 text-cosmic-muted border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <CatIcon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-grow w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cosmic-muted" />
            <Input
              placeholder="Search surveys..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            className="bg-cosmic-accent text-white hover:bg-cosmic-accent/90 shrink-0"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Create Survey
          </Button>
        </div>
      </div>

      {/* Survey Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-cosmic-accent animate-spin" />
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <ClipboardList className="w-12 h-12 text-cosmic-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Surveys Found</h3>
          <p className="text-cosmic-muted text-sm mb-4">
            {categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'Be the first to create a survey and gather community insights.'}
          </p>
          <Button className="bg-cosmic-accent text-white hover:bg-cosmic-accent/90" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Survey
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredSurveys.map((survey) => {
            const statusConfig = STATUS_CONFIG[survey.status] || STATUS_CONFIG.draft;
            const catConfig = getCategory(resolveCategory(survey.category));
            const CatIcon = catConfig.icon;
            const isActive = survey.status === 'active';
            const isClosed = survey.status === 'closed' || survey.status === 'analyzed';

            return (
              <Link key={survey.id} href={`/dashboard/participation/surveys/${survey.id}`}>
                <Card className="glass-card rounded-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer group h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between mb-2 flex-wrap gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-grow">
                        <Badge className={`${catConfig.bgColor} ${catConfig.color} ${catConfig.borderColor} border text-[10px]`}>
                          <CatIcon className="w-3 h-3 mr-1" />
                          {catConfig.label}
                        </Badge>
                        {survey.anonymous && (
                          <Badge className="bg-white/5 text-cosmic-muted border-white/10 border text-[10px]">
                            Anonymous
                          </Badge>
                        )}
                      </div>
                      <Badge className={`${statusConfig.color} border text-[10px]`}>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cosmic-teal mr-1 animate-pulse" />}
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <h3 className="text-base font-semibold text-white group-hover:text-cosmic-teal transition-colors line-clamp-2">
                      {survey.title}
                    </h3>
                    <p className="text-xs text-cosmic-muted line-clamp-2 mt-1">
                      {survey.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs text-cosmic-muted">
                          <ListChecks className="w-3.5 h-3.5" />
                          {survey.questionCount} Q
                        </div>
                        <div className="flex items-center gap-1 text-xs text-cosmic-muted">
                          <Users className="w-3.5 h-3.5" />
                          {survey._count.responses}
                        </div>
                      </div>
                      {survey.closesAt && (
                        <div className="flex items-center gap-1 text-xs text-cosmic-muted">
                          <Clock className="w-3 h-3" />
                          {formatTimeRemaining(survey.closesAt)}
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <Button
                      className={`w-full ${
                        isClosed
                          ? 'bg-white/5 text-cosmic-muted border border-white/10 hover:bg-white/10'
                          : isActive
                          ? 'bg-cosmic-teal/10 text-cosmic-teal border border-cosmic-teal/20 hover:bg-cosmic-teal/20'
                          : 'bg-white/5 text-cosmic-muted border border-white/10 hover:bg-white/10'
                      }`}
                      variant="ghost"
                      asChild
                    >
                      <span>
                        {isClosed ? (
                          <>
                            <BarChart3 className="w-4 h-4 mr-2" /> View Results
                            <ChevronRight className="w-4 h-4 ml-auto" />
                          </>
                        ) : isActive ? (
                          <>
                            <ClipboardList className="w-4 h-4 mr-2" /> Take Survey
                            <ChevronRight className="w-4 h-4 ml-auto" />
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" /> Preview
                            <ChevronRight className="w-4 h-4 ml-auto" />
                          </>
                        )}
                      </span>
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Survey Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#0B1022] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cosmic-amber" />
              Create New Survey
            </DialogTitle>
            <DialogDescription className="text-cosmic-muted">
              Design a survey to gather community insights and feedback
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-cosmic-muted mb-1 block">Title *</Label>
                <Input
                  placeholder="What do you want to learn?"
                  className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                  value={createForm.title}
                  onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div>
                <Label className="text-sm text-cosmic-muted mb-1 block">Description *</Label>
                <Textarea
                  placeholder="Explain the purpose and what the survey covers..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 min-h-[80px]"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-cosmic-muted mb-1 block">Category</Label>
                  <Select value={createForm.category} onValueChange={(v) => setCreateForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOVERNANCE_CATEGORIES.map((cat) => {
                        const CatIcon = cat.icon;
                        return (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="flex items-center gap-2">
                              <CatIcon className={`w-4 h-4 ${cat.color}`} />
                              {cat.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm text-cosmic-muted mb-1 block">Closing Date</Label>
                  <Input
                    type="datetime-local"
                    className="bg-white/5 border-white/10 text-white"
                    value={createForm.closesAt}
                    onChange={(e) => setCreateForm((f) => ({ ...f, closesAt: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={createForm.anonymous}
                    onCheckedChange={(v) => setCreateForm((f) => ({ ...f, anonymous: v }))}
                  />
                  <Label className="text-xs text-cosmic-muted">Anonymous</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={createForm.allowMultiple}
                    onCheckedChange={(v) => setCreateForm((f) => ({ ...f, allowMultiple: v }))}
                  />
                  <Label className="text-xs text-cosmic-muted">Allow Multiple</Label>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-cosmic-teal" />
                  Questions ({questions.length})
                </h3>
                <Button size="sm" variant="ghost" className="text-cosmic-teal hover:text-cosmic-teal/80" onClick={addQuestion}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Question
                </Button>
              </div>

              {questions.map((question, qIdx) => (
                <div key={qIdx} className="glass-card p-4 rounded-xl space-y-3 relative">
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-cosmic-muted/40 mt-2 shrink-0 cursor-grab" />
                    <div className="flex-grow space-y-3">
                      <div className="flex gap-3">
                        <Input
                          placeholder={`Question ${qIdx + 1}`}
                          className="flex-grow bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                          value={question.text}
                          onChange={(e) => updateQuestion(qIdx, 'text', e.target.value)}
                        />
                        <Select value={question.type} onValueChange={(v) => updateQuestion(qIdx, 'type', v)}>
                          <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {QUESTION_TYPE_OPTIONS.map((qt) => {
                              const QtIcon = qt.icon;
                              return (
                                <SelectItem key={qt.value} value={qt.value}>
                                  <span className="flex items-center gap-2">
                                    <QtIcon className="w-3.5 h-3.5" />
                                    {qt.label}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Options for choice questions */}
                      {['single_choice', 'multiple_choice'].includes(question.type) && (
                        <div className="space-y-2 pl-2">
                          {question.options.map((opt, oIdx) => (
                            <div key={opt.id} className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded border border-white/20 flex items-center justify-center shrink-0">
                                <div className="w-2 h-2 rounded-sm bg-cosmic-accent/50" />
                              </div>
                              <Input
                                value={opt.label}
                                onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                className="bg-white/5 border-white/10 text-white text-sm py-1 h-8"
                                placeholder={`Option ${oIdx + 1}`}
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-cosmic-muted/40 hover:text-cosmic-rose shrink-0"
                                onClick={() => removeOption(qIdx, oIdx)}
                                disabled={question.options.length <= 2}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ))}
                          <Button size="sm" variant="ghost" className="text-cosmic-muted hover:text-white text-xs" onClick={() => addOption(qIdx)}>
                            <Plus className="w-3 h-3 mr-1" /> Add Option
                          </Button>
                          <div className="flex items-center gap-2 pt-1">
                            <Switch
                              checked={question.allowOther}
                              onCheckedChange={(v) => updateQuestion(qIdx, 'allowOther', v)}
                            />
                            <Label className="text-[11px] text-cosmic-muted">Allow &quot;Other&quot; answer</Label>
                          </div>
                        </div>
                      )}

                      {/* Rating config */}
                      {question.type === 'rating' && (
                        <div className="flex items-center gap-3 pl-2">
                          <Label className="text-xs text-cosmic-muted">Min</Label>
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            value={question.minRating}
                            onChange={(e) => updateQuestion(qIdx, 'minRating', parseInt(e.target.value) || 1)}
                            className="w-16 bg-white/5 border-white/10 text-white text-sm py-1 h-8"
                          />
                          <Label className="text-xs text-cosmic-muted">Max</Label>
                          <Input
                            type="number"
                            min={question.minRating + 1}
                            max={10}
                            value={question.maxRating}
                            onChange={(e) => updateQuestion(qIdx, 'maxRating', parseInt(e.target.value) || 5)}
                            className="w-16 bg-white/5 border-white/10 text-white text-sm py-1 h-8"
                          />
                          <div className="flex gap-1 ml-2">
                            {Array.from({ length: question.maxRating - question.minRating + 1 }, (_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < Math.ceil((question.maxRating - question.minRating + 1) / 2) ? 'text-cosmic-amber' : 'text-white/10'}`} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Scale config */}
                      {question.type === 'scale' && (
                        <div className="flex items-center gap-3 pl-2">
                          <Label className="text-xs text-cosmic-muted">Min</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={question.minRating}
                            onChange={(e) => updateQuestion(qIdx, 'minRating', parseInt(e.target.value) || 0)}
                            className="w-16 bg-white/5 border-white/10 text-white text-sm py-1 h-8"
                          />
                          <Label className="text-xs text-cosmic-muted">Max</Label>
                          <Input
                            type="number"
                            min={question.minRating + 1}
                            max={100}
                            value={question.maxRating}
                            onChange={(e) => updateQuestion(qIdx, 'maxRating', parseInt(e.target.value) || 10)}
                            className="w-16 bg-white/5 border-white/10 text-white text-sm py-1 h-8"
                          />
                        </div>
                      )}

                      {/* Yes/No preview */}
                      {question.type === 'yes_no' && (
                        <div className="flex gap-3 pl-2">
                          <div className="px-4 py-2 rounded-lg bg-cosmic-teal/10 text-cosmic-teal border border-cosmic-teal/20 text-sm font-medium">Yes</div>
                          <div className="px-4 py-2 rounded-lg bg-cosmic-rose/10 text-cosmic-rose border border-cosmic-rose/20 text-sm font-medium">No</div>
                        </div>
                      )}

                      {/* Text preview */}
                      {question.type === 'text' && (
                        <div className="pl-2">
                          <div className="w-full h-16 rounded-lg bg-white/5 border border-white/10 border-dashed flex items-center justify-center text-xs text-cosmic-muted/40">
                            Free text response area
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={question.required}
                          onCheckedChange={(v) => updateQuestion(qIdx, 'required', v)}
                        />
                        <Label className="text-[11px] text-cosmic-muted">Required</Label>
                      </div>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-cosmic-muted/40 hover:text-cosmic-rose shrink-0"
                      onClick={() => removeQuestion(qIdx)}
                      disabled={questions.length <= 1}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
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
              className="bg-cosmic-accent text-white hover:bg-cosmic-accent/90"
              onClick={handleCreate}
              disabled={creating || !createForm.title || !createForm.description || questions.some((q) => !q.text.trim())}
            >
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Create Survey
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
