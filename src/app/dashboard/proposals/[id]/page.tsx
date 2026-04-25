'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import Link from 'next/link';
import { ArrowLeft, Vote, MessageSquare, Clock, Users, Check, Loader2, Brain } from 'lucide-react';

interface ProposalDetail {
  id: string; title: string; description: string; status: string; votingType: string;
  options: string; createdAt: string; quorum: number; isAnonymous: boolean;
  creator: { name: string | null }; organization?: { name: string; slug: string } | null;
  votes: { id: string; option: string; voterId: string; voter: { name: string | null }; confidence?: number }[];
  comments: { id: string; content: string; createdAt: string; author: { name: string | null } }[];
}

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [confidence, setConfidence] = useState([3]);
  const [reasoning, setReasoning] = useState('');
  const [comment, setComment] = useState('');
  const [voting, setVoting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/proposals/${params.id}`)
      .then(r => r.json())
      .then(data => { setProposal(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleVote = async () => {
    if (!selectedOption) return;
    setVoting(true);
    try {
      await fetch(`/api/proposals/${params.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option: selectedOption, confidence: confidence[0], reasoning }),
      });
      // Refresh
      const res = await fetch(`/api/proposals/${params.id}`);
      const data = await res.json();
      setProposal(data);
    } catch {}
    setVoting(false);
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      await fetch(`/api/proposals/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment }),
      });
      setComment('');
      const res = await fetch(`/api/proposals/${params.id}`);
      const data = await res.json();
      setProposal(data);
    } catch {}
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-cosmic-accent animate-spin" /></div>;
  if (!proposal) return <div className="text-center py-20 text-cosmic-muted">Proposal not found</div>;

  const options: string[] = JSON.parse(proposal.options || '["For","Against"]');
  const voteCounts: Record<string, number> = {};
  options.forEach(o => { voteCounts[o] = proposal.votes.filter(v => v.option === o).length; });
  const totalVotes = proposal.votes.length;

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" className="text-cosmic-muted hover:text-white mb-4" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${proposal.status === 'active' ? 'bg-cosmic-teal/10 text-cosmic-teal' : 'bg-cosmic-muted/10 text-cosmic-muted'}`}>
            {proposal.status}
          </span>
          <span className="text-xs text-cosmic-muted">{proposal.votingType.replace('_', ' ')}</span>
        </div>
        <h1 className="text-2xl font-bold font-heading mb-2">{proposal.title}</h1>
        <p className="text-cosmic-muted text-sm leading-relaxed">{proposal.description}</p>
        <div className="flex items-center gap-4 mt-3 text-xs text-cosmic-muted">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{proposal.creator.name}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(proposal.createdAt).toLocaleDateString()}</span>
          {proposal.organization && <span>{proposal.organization.name}</span>}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Vote Results */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-[#0B1022] border-white/5">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Vote className="w-4 h-4 text-cosmic-accent" /> Vote Results</h3>
              <div className="space-y-3">
                {options.map(option => {
                  const count = voteCounts[option] || 0;
                  const pct = totalVotes > 0 ? (count / totalVotes * 100) : 0;
                  return (
                    <div key={option}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{option}</span>
                        <span className="text-cosmic-muted">{count} votes ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="tally-bar h-full rounded-full bg-gradient-to-r from-cosmic-teal to-cosmic-accent" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-cosmic-muted mt-4">{totalVotes} total votes | Quorum: {proposal.quorum}</p>
            </CardContent>
          </Card>

          {/* Voting Interface */}
          {proposal.status === 'active' && (
            <Card className="bg-[#0B1022] border-white/5">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-4">Cast Your Vote</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {options.map(option => (
                    <button key={option}
                      onClick={() => setSelectedOption(option)}
                      className={`p-3 rounded-xl text-sm font-medium transition-all border ${selectedOption === option ? 'bg-cosmic-accent/10 border-cosmic-accent/30 text-cosmic-accent' : 'bg-white/5 border-white/5 text-cosmic-muted hover:border-white/10'}`}>
                      {selectedOption === option && <Check className="w-3 h-3 inline mr-1" />}
                      {option}
                    </button>
                  ))}
                </div>
                <div className="mb-4">
                  <label className="text-xs text-cosmic-muted mb-2 block">Confidence Level: {confidence[0]}/5</label>
                  <Slider value={confidence} onValueChange={setConfidence} min={1} max={5} step={1} className="mt-2" />
                </div>
                <Textarea value={reasoning} onChange={e => setReasoning(e.target.value)} placeholder="Why this choice? (optional)"
                  className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 resize-none mb-3" rows={2} />
                <Button onClick={handleVote} disabled={!selectedOption || voting}
                  className="w-full bg-cosmic-accent text-white rounded-xl">
                  {voting ? 'Submitting...' : 'Cast Vote'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card className="bg-[#0B1022] border-white/5">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-cosmic-violet" /> Comments</h3>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {proposal.comments.length === 0 ? (
                  <p className="text-xs text-cosmic-muted text-center py-4">No comments yet</p>
                ) : proposal.comments.map(c => (
                  <div key={c.id} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">{c.author.name}</span>
                      <span className="text-xs text-cosmic-muted">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-cosmic-muted">{c.content}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 resize-none" rows={2} />
                <Button onClick={handleComment} disabled={!comment.trim()} className="bg-cosmic-accent text-white self-end">Post</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-[#0B1022] border-white/5">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link href={`/dashboard/assistant`}>
                  <Button variant="ghost" className="w-full justify-start text-cosmic-muted hover:text-white text-xs">
                    <Brain className="w-3 h-3 mr-2" /> Ask AI about this proposal
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0B1022] border-white/5">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Recent Voters</h3>
              <div className="space-y-2">
                {proposal.votes.slice(0, 8).map(v => (
                  <div key={v.id} className="flex items-center justify-between text-xs">
                    <span className="text-cosmic-muted">{v.voter.name}</span>
                    <span className="text-cosmic-accent">{v.option}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


