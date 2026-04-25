'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Eye, Zap, Loader2 } from 'lucide-react';

const PROPOSALS = [
  { title: 'Implement Quadratic Voting', odds: 72, outcome: 'pass' as const },
  { title: 'Adopt 4-Day Work Week', odds: 45, outcome: 'fail' as const },
  { title: 'Open Source Core Framework', odds: 88, outcome: 'pass' as const },
];

export default function OracleProtocolPage() {
  const [idx, setIdx] = useState(0);
  const [prediction, setPrediction] = useState<'pass' | 'fail' | null>(null);
  const [confidence, setConfidence] = useState(3);
  const [revealed, setRevealed] = useState(false);
  const [totalXp, setTotalXp] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = PROPOSALS[idx];
  if (finished || idx >= PROPOSALS.length) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 rounded-2xl bg-cosmic-violet/10 flex items-center justify-center mx-auto mb-6"><Eye className="w-10 h-10 text-cosmic-violet" /></div>
        <h1 className="text-3xl font-bold font-heading mb-2">Oracle Results</h1>
        <div className="text-5xl font-bold font-heading text-gradient mb-2">+{totalXp} XP</div>
        <p className="text-cosmic-muted mb-6">Your predictions earned {totalXp} experience points</p>
        <Link href="/dashboard/games"><Button className="bg-cosmic-accent text-white">Back to Games</Button></Link>
      </div>
    );
  }

  const handleReveal = () => {
    if (!prediction) return;
    setRevealed(true);
    const correct = prediction === current.outcome;
    const xp = correct ? Math.floor(confidence * 25) : Math.floor(confidence * 5);
    setTotalXp(prev => prev + xp);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard/games"><Button variant="ghost" className="text-cosmic-muted hover:text-white mb-4"><ArrowLeft className="w-4 h-4 mr-1" /> Games</Button></Link>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cosmic-violet/10 flex items-center justify-center"><Eye className="w-5 h-5 text-cosmic-violet" /></div>
          <div><h1 className="text-xl font-bold font-heading">Oracle Protocol</h1><p className="text-xs text-cosmic-violet">Predict the future of proposals</p></div>
        </div>
        <div className="flex items-center gap-1 text-cosmic-amber text-sm font-medium"><Zap className="w-4 h-4" />{totalXp} XP</div>
      </div>
      <Card className="glass-card-violet mb-6">
        <CardContent className="p-6">
          <p className="text-xs text-cosmic-muted mb-2">Prediction {idx + 1} of {PROPOSALS.length}</p>
          <h2 className="text-lg font-semibold font-heading mb-4">{current.title}</h2>
          <div className="mb-4 p-3 bg-white/5 rounded-lg">
            <p className="text-xs text-cosmic-muted mb-1">Community Prediction Odds</p>
            <div className="flex items-center gap-3">
              <div className="flex-grow h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cosmic-teal to-cosmic-accent rounded-full" style={{ width: `${current.odds}%` }} />
              </div>
              <span className="text-sm font-medium">{current.odds}% pass</span>
            </div>
          </div>
          <p className="text-sm text-cosmic-muted mb-3">Will this proposal pass or fail?</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={() => !revealed && setPrediction('pass')} className={`p-3 rounded-xl text-sm font-medium border transition-all ${prediction === 'pass' ? 'border-cosmic-teal/30 bg-cosmic-teal/5 text-cosmic-teal' : 'border-white/5 bg-white/5 text-cosmic-muted hover:border-white/10'}`}>Will Pass</button>
            <button onClick={() => !revealed && setPrediction('fail')} className={`p-3 rounded-xl text-sm font-medium border transition-all ${prediction === 'fail' ? 'border-cosmic-rose/30 bg-cosmic-rose/5 text-cosmic-rose' : 'border-white/5 bg-white/5 text-cosmic-muted hover:border-white/10'}`}>Will Fail</button>
          </div>
          <div className="mb-4">
            <label className="text-xs text-cosmic-muted mb-2 block">Confidence: {confidence}/5</label>
            <input type="range" min={1} max={5} value={confidence} onChange={e => setConfidence(Number(e.target.value))} className="w-full accent-[#9B5CFF]" />
          </div>
          {revealed && (
            <div className={`p-4 rounded-xl ${prediction === current.outcome ? 'bg-cosmic-teal/10 border border-cosmic-teal/20' : 'bg-cosmic-rose/10 border border-cosmic-rose/20'}`}>
              <p className="text-sm font-medium mb-1">{prediction === current.outcome ? 'Correct!' : 'Incorrect'}</p>
              <p className="text-xs text-cosmic-muted">The proposal {current.outcome === 'pass' ? 'passed' : 'failed'}. You earned {prediction === current.outcome ? Math.floor(confidence * 25) : Math.floor(confidence * 5)} XP.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-center">
        {!revealed ? (
          <Button onClick={handleReveal} disabled={!prediction} className="bg-cosmic-violet text-white rounded-xl px-8">Reveal Outcome</Button>
        ) : (
          <Button onClick={() => { setIdx(prev => prev + 1); setPrediction(null); setRevealed(false); if (idx >= PROPOSALS.length - 1) setFinished(true); }} className="bg-cosmic-accent text-white rounded-xl px-8">
            {idx >= PROPOSALS.length - 1 ? 'See Results' : 'Next Prediction'}
          </Button>
        )}
      </div>
    </div>
  );
}
