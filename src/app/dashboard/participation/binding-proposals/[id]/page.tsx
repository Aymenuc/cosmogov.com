'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  Gavel,
  Loader2,
  Users,
  CheckCircle2,
  FileSignature,
  Clock,
  ArrowLeft,
  Scale,
  TrendingUp,
  Share2,
  Building2,
  BookOpen,
  BarChart3,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

interface Signature {
  id: string;
  comment: string | null;
  verified: boolean;
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
  responseDate: string | null;
  responseDeadline: string | null;
  voteDate: string | null;
  enactmentDate: string | null;
  legalReference: string | null;
  impactAssessment: string | null;
  closesAt: string | null;
  createdAt: string;
  creator: { id: string; name: string | null; avatarUrl: string | null; role: string };
  signatures: Signature[];
  _count: { signatures: number };
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  binding_proposal: { label: 'Binding Proposal', color: 'text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20', icon: Gavel },
  binding_referendum: { label: 'Binding Referendum', color: 'text-cosmic-violet bg-cosmic-violet/10 border-cosmic-violet/20', icon: Scale },
  citizen_bill: { label: 'Citizen Bill', color: 'text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20', icon: FileSignature },
};

const STATUS_STEPS = [
  { key: 'collecting', label: 'Collecting' },
  { key: 'threshold_reached', label: 'Threshold Reached' },
  { key: 'government_review', label: 'Gov. Review' },
  { key: 'government_response', label: 'Gov. Response' },
  { key: 'scheduled_vote', label: 'Vote' },
  { key: 'enacted', label: 'Enacted' },
];

export default function BindingProposalDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign dialog
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signComment, setSignComment] = useState('');
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [thresholdJustReached, setThresholdJustReached] = useState(false);

  const fetchProposal = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/binding-proposals/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProposal(data.proposal);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProposal(); }, [fetchProposal]);

  const handleSign = async () => {
    setSigning(true);
    try {
      const res = await fetch(`/api/binding-proposals/${id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: signComment }),
      });
      if (res.ok) {
        const data = await res.json();
        setSigned(true);
        if (data.thresholdReached) setThresholdJustReached(true);
        fetchProposal();
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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: proposal!.title, text: proposal!.description, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cosmic-rose animate-spin" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="glass-card p-12 rounded-2xl text-center">
        <Gavel className="w-12 h-12 text-cosmic-muted/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Proposal Not Found</h3>
        <Link href="/dashboard/participation/binding-proposals">
          <Button className="bg-cosmic-rose text-white hover:bg-cosmic-rose/90">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Proposals
          </Button>
        </Link>
      </div>
    );
  }

  const typeConfig = TYPE_CONFIG[proposal.type] || TYPE_CONFIG.binding_proposal;
  const TypeIcon = typeConfig.icon;
  const progress = Math.min(Math.round((proposal.signatureCount / proposal.signatureGoal) * 100), 100);
  const isThresholdReached = proposal.status !== 'collecting' && proposal.status !== 'rejected';
  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === proposal.status);

  return (
    <div className="space-y-4 sm:space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Back navigation */}
      <Link href="/dashboard/participation/binding-proposals" className="inline-flex items-center gap-1.5 text-sm text-cosmic-muted hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Binding Proposals
      </Link>

      {/* Header — Title, type badge, category badge */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl glass-card-rose p-4 sm:p-6 lg:p-8">
        <div className="absolute inset-0 starfield opacity-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge className={`${typeConfig.color} text-[10px] border`}>
              <TypeIcon className="w-3 h-3 mr-1" />
              {typeConfig.label}
            </Badge>
            {proposal.category && (
              <Badge className="text-cosmic-muted bg-white/5 border-white/10 text-[10px] border capitalize">
                {proposal.category}
              </Badge>
            )}
            {proposal.isBinding && (
              <Badge className="text-cosmic-rose bg-cosmic-rose/10 border-cosmic-rose/20 text-[10px] border">
                <Shield className="w-3 h-3 mr-1" />
                Binding
              </Badge>
            )}
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-2">
            {proposal.title}
          </h1>
          <p className="text-cosmic-muted text-sm sm:text-base max-w-3xl">
            {proposal.description}
          </p>
        </div>
      </div>

      {/* LARGE Signature Progress Bar */}
      <Card className="glass-card rounded-2xl border-cosmic-rose/20">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-cosmic-muted flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Signature Progress
              </span>
              <span className={`text-xl sm:text-2xl font-bold font-heading ${isThresholdReached ? 'text-cosmic-teal' : 'text-white'}`}>
                {proposal.signatureCount.toLocaleString()} / {proposal.signatureGoal.toLocaleString()}
                <span className="text-sm font-normal text-cosmic-muted ml-2">— {progress}%</span>
              </span>
            </div>
            <div className="relative h-5 bg-white/5 rounded-full overflow-hidden">
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
                <div className="absolute inset-0 rounded-full animate-pulse opacity-20 bg-cosmic-teal" />
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={`font-semibold ${isThresholdReached ? 'text-cosmic-teal' : 'text-cosmic-muted'}`}>
                {progress}% of goal
              </span>
              {isThresholdReached && (
                <span className="flex items-center gap-1 text-cosmic-teal font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Threshold Reached!
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card className="glass-card rounded-2xl">
        <CardHeader className="pb-2">
          <h2 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cosmic-rose" />
            Status Timeline
          </h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
            {STATUS_STEPS.map((step, idx) => {
              const isActive = idx === currentStepIdx;
              const isCompleted = idx < currentStepIdx;
              return (
                <div key={step.key} className="flex items-center shrink-0">
                  <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-medium border transition-all ${
                    isActive
                      ? 'bg-cosmic-rose/20 text-cosmic-rose border-cosmic-rose/30'
                      : isCompleted
                      ? 'bg-cosmic-success/10 text-cosmic-success border-cosmic-success/20'
                      : 'bg-white/5 text-cosmic-muted border-white/10'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : isActive ? <Gavel className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full bg-white/10" />}
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.label.split(' ')[0]}</span>
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div className={`w-2 sm:w-6 h-0.5 mx-0.5 ${isCompleted ? 'bg-cosmic-success/30' : 'bg-white/10'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Government Response Card */}
      {(proposal.status === 'government_response' || proposal.status === 'scheduled_vote' || proposal.status === 'passed' || proposal.status === 'enacted') && proposal.governmentResponse && (
        <Card className="glass-card rounded-2xl border-cosmic-teal/20">
          <CardHeader className="pb-2">
            <h2 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cosmic-teal" />
              Government Response
              {proposal.responseDate && (
                <span className="text-xs text-cosmic-muted font-normal ml-2">
                  {new Date(proposal.responseDate).toLocaleDateString()}
                </span>
              )}
            </h2>
          </CardHeader>
          <CardContent>
            <div className="glass-card p-4 rounded-xl bg-cosmic-teal/5 border border-cosmic-teal/10">
              <p className="text-sm text-white whitespace-pre-wrap">{proposal.governmentResponse}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legal Reference Card */}
      {proposal.legalReference && (
        <Card className="glass-card rounded-2xl">
          <CardHeader className="pb-2">
            <h2 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cosmic-amber" />
              Legal Reference
            </h2>
          </CardHeader>
          <CardContent>
            <div className="glass-card p-4 rounded-xl bg-cosmic-amber/5 border border-cosmic-amber/10">
              <p className="text-sm text-white">{proposal.legalReference}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Impact Assessment Card */}
      {proposal.impactAssessment && (
        <Card className="glass-card rounded-2xl">
          <CardHeader className="pb-2">
            <h2 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cosmic-violet" />
              Impact Assessment
            </h2>
          </CardHeader>
          <CardContent>
            <div className="glass-card p-4 rounded-xl bg-cosmic-violet/5 border border-cosmic-violet/10">
              <p className="text-sm text-white whitespace-pre-wrap">{proposal.impactAssessment}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sign + Share buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {proposal.status === 'collecting' && (
          <Button
            className="flex-1 bg-cosmic-rose text-white hover:bg-cosmic-rose/90 h-12 text-base"
            onClick={() => {
              setSignComment('');
              setSigned(false);
              setThresholdJustReached(false);
              setSignDialogOpen(true);
            }}
          >
            <FileSignature className="w-5 h-5 mr-2" />
            Sign This Proposal
          </Button>
        )}
        <Button
          className="flex-1 bg-cosmic-violet/10 text-cosmic-violet border border-cosmic-violet/20 hover:bg-cosmic-violet/20 h-12 text-base"
          variant="ghost"
          onClick={handleShare}
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share to Collect Signatures
        </Button>
      </div>

      {/* Recent Signers */}
      {proposal.signatures && proposal.signatures.length > 0 && (
        <Card className="glass-card rounded-2xl">
          <CardHeader className="pb-2">
            <h2 className="font-heading text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cosmic-violet" />
              Recent Signers ({proposal._count?.signatures || proposal.signatureCount})
            </h2>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {proposal.signatures.map((sig) => (
                <div key={sig.id} className="glass-card p-3 rounded-xl flex items-start gap-3">
                  <Avatar className="w-8 h-8 shrink-0">
                    {sig.user.avatarUrl ? (
                      <img src={sig.user.avatarUrl} alt={sig.user.name || 'Signer'} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-cosmic-rose/20 text-cosmic-rose text-xs font-bold">
                        {(sig.user.name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0 flex-grow">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{sig.user.name || 'Anonymous'}</span>
                      {sig.verified && (
                        <Badge className="text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20 text-[9px] border">
                          Verified
                        </Badge>
                      )}
                    </div>
                    {sig.comment && (
                      <p className="text-xs text-cosmic-muted mt-1">{sig.comment}</p>
                    )}
                    <span className="text-[10px] text-cosmic-muted/50 mt-1 block">
                      {new Date(sig.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response deadline warning */}
      {proposal.responseDeadline && isThresholdReached && proposal.status !== 'government_response' && proposal.status !== 'enacted' && (
        <div className="glass-card p-4 rounded-2xl border border-cosmic-amber/20 bg-gradient-to-r from-cosmic-amber/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cosmic-amber/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-cosmic-amber" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Government Response Deadline</h3>
              <p className="text-xs text-cosmic-muted mt-0.5">
                The government must respond by {new Date(proposal.responseDeadline).toLocaleDateString()}.
                {new Date(proposal.responseDeadline) > new Date()
                  ? ` ${Math.ceil((new Date(proposal.responseDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining.`
                  : ' The deadline has passed!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Vote date info */}
      {proposal.voteDate && (
        <Card className="glass-card rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cosmic-violet/20 flex items-center justify-center shrink-0">
                <Gavel className="w-5 h-5 text-cosmic-violet" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Scheduled Vote</h3>
                <p className="text-xs text-cosmic-muted mt-0.5">
                  This proposal will be put to vote on {new Date(proposal.voteDate).toLocaleDateString()}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enactment date */}
      {proposal.enactmentDate && (
        <Card className="glass-card rounded-2xl border border-cosmic-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cosmic-success/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-cosmic-success" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Enacted into Law/Policy</h3>
                <p className="text-xs text-cosmic-muted mt-0.5">
                  This proposal was enacted on {new Date(proposal.enactmentDate).toLocaleDateString()}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sign Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="bg-[#0B1022] border-white/10 text-white max-w-lg">
          {proposal && (
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
                    <h3 className="text-white font-semibold mb-1">{proposal.title}</h3>
                    <p className="text-sm text-cosmic-muted line-clamp-3">{proposal.description}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-grow">
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cosmic-rose to-cosmic-violet"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-cosmic-muted whitespace-nowrap">
                        {proposal.signatureCount.toLocaleString()}/{proposal.signatureGoal.toLocaleString()}
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
    </div>
  );
}
