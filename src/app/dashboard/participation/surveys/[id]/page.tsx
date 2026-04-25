'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Loader2,
  ClipboardList,
  Users,
  CheckCircle2,
  Star,
  BarChart3,
  Sparkles,
  Clock,
  Send,
  MessageSquare,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { getCategory, resolveCategory } from '@/lib/categories';

interface SurveyQuestion {
  id: string;
  text: string;
  type: string;
  options: string;
  required: boolean;
  sortOrder: number;
  allowOther: boolean;
  minRating: number | null;
  maxRating: number | null;
  aiInsight: string | null;
  createdAt: string;
}

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
  aiSummary: string | null;
  createdAt: string;
  createdBy: string;
  creator: { id: string; name: string | null; avatarUrl: string | null };
  questions: SurveyQuestion[];
  responses: { id: string; userId: string | null; answers: string; completedAt: string; createdAt: string }[];
  _count: { responses: number };
}

interface ChoiceResult {
  id: string;
  label: string;
  count: number;
  percentage: number;
}

interface QuestionStat {
  questionId: string;
  questionText: string;
  type: string;
  totalResponses: number;
  results?: ChoiceResult[];
  averageRating?: number;
  distribution?: Record<number, number>;
  averageValue?: number;
  sampleAnswers?: string[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'text-cosmic-muted bg-white/5 border-white/10' },
  active: { label: 'Active', color: 'text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20' },
  paused: { label: 'Paused', color: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20' },
  closed: { label: 'Closed', color: 'text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20' },
  analyzed: { label: 'Analyzed', color: 'text-cosmic-violet bg-cosmic-violet/10 border-cosmic-violet/20' },
};

export default function SurveyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questionStats, setQuestionStats] = useState<QuestionStat[]>([]);
  const [hasResponded, setHasResponded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Form answers
  const [answers, setAnswers] = useState<Record<string, { value: string | string[]; otherText?: string }>>({});

  const fetchSurvey = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/surveys/${surveyId}`);
      if (res.ok) {
        const data = await res.json();
        setSurvey(data.survey);
        setHasResponded(data.hasResponded);
        setQuestionStats(data.questionStats || []);
      } else {
        setError('Survey not found');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load survey');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => { fetchSurvey(); }, [fetchSurvey]);

  const isActive = survey?.status === 'active';
  const isClosed = survey?.status === 'closed' || survey?.status === 'analyzed';
  const showForm = survey && isActive && !hasResponded && !submitted;
  const showResults = survey && (hasResponded || isClosed || submitted);

  // Progress calculation
  const totalQuestions = survey?.questions.length || 0;
  const answeredCount = survey?.questions.filter((q) => {
    const a = answers[q.id];
    if (!a) return false;
    if (Array.isArray(a.value)) return a.value.length > 0;
    return a.value !== '' && a.value !== undefined;
  }).length || 0;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const setAnswer = (questionId: string, value: string | string[], otherText?: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { value, otherText } }));
  };

  const handleSubmit = async () => {
    if (!survey) return;
    setSubmitting(true);
    setError('');

    try {
      const answerList = survey.questions.map((q) => {
        const a = answers[q.id] || { value: '' };
        return { questionId: q.id, value: a.value, otherText: a.otherText };
      });

      const res = await fetch(`/api/surveys/${surveyId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answerList }),
      });

      if (res.ok) {
        setSubmitted(true);
        fetchSurvey(); // Refresh to get updated stats
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit response');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cosmic-accent animate-spin" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="glass-card p-12 rounded-2xl text-center">
        <AlertCircle className="w-12 h-12 text-cosmic-rose/50 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Survey Not Found</h3>
        <p className="text-cosmic-muted text-sm mb-4">{error || 'This survey does not exist or has been removed.'}</p>
        <Button className="bg-white/10 text-white hover:bg-white/20" onClick={() => router.push('/dashboard/participation/surveys')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Surveys
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[survey.status] || STATUS_CONFIG.draft;
  const catConfig = getCategory(resolveCategory(survey.category));
  const CatIcon = catConfig.icon;

  return (
    <div className="space-y-4 sm:space-y-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-cosmic-muted hover:text-white hover:bg-white/5 mt-0.5"
          onClick={() => router.push('/dashboard/participation/surveys')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge className={`${catConfig.bgColor} ${catConfig.color} ${catConfig.borderColor} border text-[10px]`}>
              <CatIcon className="w-3 h-3 mr-1" />
              {catConfig.label}
            </Badge>
            <Badge className={`${statusConfig.color} border text-[10px]`}>
              {statusConfig.label}
            </Badge>
            {survey.anonymous && (
              <Badge className="bg-white/5 text-cosmic-muted border-white/10 border text-[10px]">
                Anonymous
              </Badge>
            )}
          </div>
          <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">
            {survey.title}
          </h1>
          <p className="text-cosmic-muted text-sm sm:text-base">
            {survey.description}
          </p>
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-cosmic-muted">
              <Users className="w-3.5 h-3.5" />
              {survey._count.responses} responses
            </div>
            <div className="flex items-center gap-1.5 text-xs text-cosmic-muted">
              <ClipboardList className="w-3.5 h-3.5" />
              {survey.questionCount} questions
            </div>
            {survey.closesAt && (
              <div className="flex items-center gap-1.5 text-xs text-cosmic-muted">
                <Clock className="w-3.5 h-3.5" />
                {new Date(survey.closesAt) > new Date()
                  ? `Closes ${new Date(survey.closesAt).toLocaleDateString()}`
                  : 'Closed'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submitted Success */}
      {submitted && (
        <div className="glass-card-teal p-6 rounded-2xl text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-cosmic-teal/20 glow-teal">
            <CheckCircle2 className="w-8 h-8 text-cosmic-teal" />
          </div>
          <h3 className="text-lg font-semibold text-white">Thank You!</h3>
          <p className="text-cosmic-muted text-sm">Your response has been recorded. Check out the results below.</p>
        </div>
      )}

      {/* Has Responded Notice */}
      {hasResponded && !submitted && (
        <div className="glass-card-teal p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-cosmic-teal shrink-0" />
          <div>
            <p className="text-sm text-white font-medium">You&apos;ve already responded</p>
            <p className="text-xs text-cosmic-muted">View the current results below.</p>
          </div>
        </div>
      )}

      {/* Survey Form */}
      {showForm && (
        <div className="space-y-4">
          {/* Progress Indicator */}
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-cosmic-muted">
                {answeredCount} of {totalQuestions} questions answered
              </span>
              <span className="text-xs text-cosmic-teal font-medium">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-white/5" />
          </div>

          {/* Questions */}
          {survey.questions.map((question, idx) => {
            const parsedOptions: { id: string; label: string }[] = JSON.parse(question.options || '[]');
            const currentAnswer = answers[question.id];

            return (
              <Card key={question.id} className="glass-card rounded-2xl">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cosmic-accent/10 text-cosmic-accent text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-grow">
                      <h3 className="text-sm sm:text-base font-semibold text-white">
                        {question.text}
                        {question.required && <span className="text-cosmic-rose ml-1">*</span>}
                      </h3>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Single Choice */}
                  {question.type === 'single_choice' && (
                    <RadioGroup
                      value={(currentAnswer?.value as string) || ''}
                      onValueChange={(v) => setAnswer(question.id, v)}
                      className="space-y-2"
                    >
                      {parsedOptions.map((opt) => (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            currentAnswer?.value === opt.id
                              ? 'bg-cosmic-accent/10 border-cosmic-accent/30 text-white'
                              : 'bg-white/[0.02] border-white/5 text-cosmic-muted hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <RadioGroupItem value={opt.id} id={`${question.id}-${opt.id}`} className="border-white/30 text-cosmic-accent" />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                      {question.allowOther && (
                        <div className="space-y-2">
                          <label
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              currentAnswer?.value === '__other__'
                                ? 'bg-cosmic-accent/10 border-cosmic-accent/30 text-white'
                                : 'bg-white/[0.02] border-white/5 text-cosmic-muted hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <RadioGroupItem value="__other__" id={`${question.id}-other`} className="border-white/30 text-cosmic-accent" />
                            <span className="text-sm">Other</span>
                          </label>
                          {currentAnswer?.value === '__other__' && (
                            <Textarea
                              placeholder="Please specify..."
                              className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 ml-9 min-h-[60px]"
                              value={currentAnswer.otherText || ''}
                              onChange={(e) => setAnswer(question.id, '__other__', e.target.value)}
                            />
                          )}
                        </div>
                      )}
                    </RadioGroup>
                  )}

                  {/* Multiple Choice */}
                  {question.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {parsedOptions.map((opt) => {
                        const selected = (currentAnswer?.value as string[]) || [];
                        const isChecked = selected.includes(opt.id);
                        return (
                          <label
                            key={opt.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-cosmic-violet/10 border-cosmic-violet/30 text-white'
                                : 'bg-white/[0.02] border-white/5 text-cosmic-muted hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const current = (answers[question.id]?.value as string[]) || [];
                                const newValues = checked
                                  ? [...current, opt.id]
                                  : current.filter((v: string) => v !== opt.id);
                                setAnswer(question.id, newValues);
                              }}
                              className="border-white/30 data-[state=checked]:bg-cosmic-violet data-[state=checked]:border-cosmic-violet"
                            />
                            <span className="text-sm">{opt.label}</span>
                          </label>
                        );
                      })}
                      {question.allowOther && (
                        <div className="space-y-2">
                          <label
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              ((currentAnswer?.value as string[]) || []).includes('__other__')
                                ? 'bg-cosmic-violet/10 border-cosmic-violet/30 text-white'
                                : 'bg-white/[0.02] border-white/5 text-cosmic-muted hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <Checkbox
                              checked={((currentAnswer?.value as string[]) || []).includes('__other__')}
                              onCheckedChange={(checked) => {
                                const current = (answers[question.id]?.value as string[]) || [];
                                const newValues = checked
                                  ? [...current, '__other__']
                                  : current.filter((v: string) => v !== '__other__');
                                setAnswer(question.id, newValues);
                              }}
                              className="border-white/30 data-[state=checked]:bg-cosmic-violet data-[state=checked]:border-cosmic-violet"
                            />
                            <span className="text-sm">Other</span>
                          </label>
                          {((currentAnswer?.value as string[]) || []).includes('__other__') && (
                            <Textarea
                              placeholder="Please specify..."
                              className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 ml-9 min-h-[60px]"
                              value={currentAnswer?.otherText || ''}
                              onChange={(e) => setAnswer(question.id, (currentAnswer?.value as string[]) || [], e.target.value)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Text */}
                  {question.type === 'text' && (
                    <Textarea
                      placeholder="Type your response..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 min-h-[100px]"
                      value={(currentAnswer?.value as string) || ''}
                      onChange={(e) => setAnswer(question.id, e.target.value)}
                    />
                  )}

                  {/* Rating */}
                  {question.type === 'rating' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {Array.from(
                          { length: (question.maxRating || 5) - (question.minRating || 1) + 1 },
                          (_, i) => {
                            const rating = (question.minRating || 1) + i;
                            const isFilled = parseInt((currentAnswer?.value as string) || '0') >= rating;
                            return (
                              <button
                                key={rating}
                                onClick={() => setAnswer(question.id, String(rating))}
                                className="transition-all duration-200 hover:scale-110"
                              >
                                <Star
                                  className={`w-8 h-8 sm:w-10 sm:h-10 ${
                                    isFilled
                                      ? 'text-cosmic-amber fill-cosmic-amber'
                                      : 'text-white/10 hover:text-cosmic-amber/50'
                                  }`}
                                />
                              </button>
                            );
                          }
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-cosmic-muted">
                        <span>{question.minRating || 1}</span>
                        {currentAnswer?.value && (
                          <span className="text-cosmic-amber font-medium">
                            {currentAnswer.value} / {question.maxRating || 5}
                          </span>
                        )}
                        <span>{question.maxRating || 5}</span>
                      </div>
                    </div>
                  )}

                  {/* Yes/No */}
                  {question.type === 'yes_no' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setAnswer(question.id, 'yes')}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all text-sm font-medium ${
                          currentAnswer?.value === 'yes'
                            ? 'bg-cosmic-teal/15 border-cosmic-teal/40 text-cosmic-teal'
                            : 'bg-white/[0.02] border-white/5 text-cosmic-muted hover:bg-cosmic-teal/5 hover:border-cosmic-teal/20 hover:text-cosmic-teal'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" /> Yes
                      </button>
                      <button
                        onClick={() => setAnswer(question.id, 'no')}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all text-sm font-medium ${
                          currentAnswer?.value === 'no'
                            ? 'bg-cosmic-rose/15 border-cosmic-rose/40 text-cosmic-rose'
                            : 'bg-white/[0.02] border-white/5 text-cosmic-muted hover:bg-cosmic-rose/5 hover:border-cosmic-rose/20 hover:text-cosmic-rose'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-current" />
                        </span> No
                      </button>
                    </div>
                  )}

                  {/* Scale */}
                  {question.type === 'scale' && (
                    <div className="space-y-3 px-2">
                      <Slider
                        min={question.minRating || 0}
                        max={question.maxRating || 10}
                        step={1}
                        value={[parseInt((currentAnswer?.value as string) || String(question.minRating || 0))]}
                        onValueChange={([v]) => setAnswer(question.id, String(v))}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between text-xs text-cosmic-muted">
                        <span>{question.minRating || 0}</span>
                        <span className="text-cosmic-accent font-semibold text-sm">
                          {currentAnswer?.value || question.minRating || 0}
                        </span>
                        <span>{question.maxRating || 10}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Submit */}
          {error && (
            <div className="glass-card-rose p-4 rounded-xl flex items-center gap-2 text-sm text-cosmic-rose">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <Button
            className="w-full bg-cosmic-teal text-[#0B1022] hover:bg-cosmic-teal/90 text-sm font-semibold py-5"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Submit Response
            <ChevronRight className="w-4 h-4 ml-auto" />
          </Button>
        </div>
      )}

      {/* Results View */}
      {showResults && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: 'Responses', value: survey._count.responses, icon: Users, color: 'text-cosmic-teal' },
              { label: 'Questions', value: survey.questionCount, icon: ClipboardList, color: 'text-cosmic-accent' },
              { label: 'Completion', value: `${survey._count.responses > 0 ? Math.round((survey._count.responses / Math.max(survey.questionCount, 1)) * 100) : 0}%`, icon: BarChart3, color: 'text-cosmic-violet' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-3 sm:p-4 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                  <span className="text-[10px] sm:text-xs text-cosmic-muted">{stat.label}</span>
                </div>
                <p className={`text-lg sm:text-xl font-bold font-heading ${stat.color}`}>
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* AI Summary */}
          {survey.aiSummary && (
            <div className="glass-card-violet p-4 sm:p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-cosmic-violet" />
                <h3 className="font-heading text-sm font-semibold text-white">AI Summary</h3>
              </div>
              <p className="text-sm text-cosmic-muted leading-relaxed">{survey.aiSummary}</p>
            </div>
          )}

          {/* Per-Question Results */}
          {survey.questions.map((question, idx) => {
            const stat = questionStats.find((s) => s.questionId === question.id);
            if (!stat) return null;

            const parsedOptions: { id: string; label: string }[] = JSON.parse(question.options || '[]');

            return (
              <Card key={question.id} className="glass-card rounded-2xl">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cosmic-accent/10 text-cosmic-accent text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-grow">
                      <h3 className="text-sm sm:text-base font-semibold text-white">{question.text}</h3>
                      <p className="text-[11px] text-cosmic-muted mt-0.5">{stat.totalResponses} responses</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Choice Results */}
                  {(question.type === 'single_choice' || question.type === 'multiple_choice' || question.type === 'yes_no') && stat.results && (
                    <div className="space-y-2">
                      {stat.results.map((result) => {
                        const maxCount = Math.max(...stat.results!.map((r) => r.count), 1);
                        const barWidth = Math.max(Math.round((result.count / maxCount) * 100), 0);
                        const isTop = result.count === Math.max(...stat.results!.map((r) => r.count)) && result.count > 0;
                        return (
                          <div key={result.id} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs ${isTop ? 'text-white font-medium' : 'text-cosmic-muted'}`}>
                                {result.label}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-cosmic-muted">{result.count}</span>
                                <span className={`text-[11px] font-medium ${isTop ? 'text-cosmic-teal' : 'text-cosmic-muted'}`}>
                                  {result.percentage}%
                                </span>
                              </div>
                            </div>
                            <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                  isTop
                                    ? 'bg-gradient-to-r from-cosmic-teal to-cosmic-success'
                                    : 'bg-gradient-to-r from-cosmic-accent/40 to-cosmic-violet/40'
                                }`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Rating Results */}
                  {question.type === 'rating' && stat.averageRating !== undefined && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= Math.round(stat.averageRating!)
                                  ? 'text-cosmic-amber fill-cosmic-amber'
                                  : 'text-white/10'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-lg font-bold text-cosmic-amber font-heading">
                          {stat.averageRating}
                        </span>
                      </div>
                      {stat.distribution && (
                        <div className="space-y-1.5">
                          {Object.entries(stat.distribution)
                            .sort(([a], [b]) => Number(b) - Number(a))
                            .map(([rating, count]) => {
                              const maxDist = Math.max(...Object.values(stat.distribution!), 1);
                              const barWidth = Math.round((count / maxDist) * 100);
                              return (
                                <div key={rating} className="flex items-center gap-2">
                                  <span className="text-[11px] text-cosmic-muted w-6 text-right">{rating}</span>
                                  <div className="flex-grow relative h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-cosmic-amber/60 tally-bar"
                                      style={{ width: `${barWidth}%` }}
                                    />
                                  </div>
                                  <span className="text-[11px] text-cosmic-muted w-8">{count}</span>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Scale Results */}
                  {question.type === 'scale' && stat.averageValue !== undefined && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-cosmic-muted">Average Value</span>
                        <span className="text-lg font-bold text-cosmic-accent font-heading">{stat.averageValue}</span>
                      </div>
                      <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cosmic-accent to-cosmic-violet tally-bar"
                          style={{
                            width: `${Math.round(
                              ((stat.averageValue - (question.minRating || 0)) /
                                ((question.maxRating || 10) - (question.minRating || 0))) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-cosmic-muted">
                        <span>Min: {question.minRating || 0}</span>
                        <span>Max: {question.maxRating || 10}</span>
                      </div>
                    </div>
                  )}

                  {/* Text Results */}
                  {question.type === 'text' && stat.sampleAnswers && (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {stat.sampleAnswers.length > 0 ? (
                        stat.sampleAnswers.map((answer, aIdx) => (
                          <div key={aIdx} className="glass-card p-3 rounded-lg">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-3.5 h-3.5 text-cosmic-muted/40 mt-0.5 shrink-0" />
                              <p className="text-xs text-cosmic-muted leading-relaxed">{answer}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-cosmic-muted/50 italic">No text responses yet</p>
                      )}
                    </div>
                  )}

                  {/* AI Insight */}
                  {question.aiInsight && (
                    <div className="mt-3 p-3 rounded-lg bg-cosmic-violet/5 border border-cosmic-violet/10">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3 h-3 text-cosmic-violet" />
                        <span className="text-[11px] text-cosmic-violet font-medium">AI Insight</span>
                      </div>
                      <p className="text-xs text-cosmic-muted">{question.aiInsight}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* No Responses Yet */}
          {survey._count.responses === 0 && (
            <div className="glass-card p-8 rounded-2xl text-center">
              <BarChart3 className="w-10 h-10 text-cosmic-muted/20 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white mb-1">No Responses Yet</h3>
              <p className="text-xs text-cosmic-muted">Results will appear here once people start responding.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
