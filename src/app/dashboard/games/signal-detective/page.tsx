'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Search, Zap, AlertCircle, Check } from 'lucide-react';

const ANOMALIES = [
  { description: 'Vote timeline for "Budget Allocation Q3": All votes were evenly spread over 7 days, then 47 votes arrived in the final 2 hours.', correct: 'Late Vote Cluster', options: ['Bot Swarm', 'Late Vote Cluster', 'Whale Flip', 'No Anomaly'] },
  { description: 'Proposal "Hiring Policy": 12 votes for "Reject" in the first hour, then a single voter switches 30 votes to "Approve" at hour 23.', correct: 'Whale Flip', options: ['Late Vote Cluster', 'Whale Flip', 'Double Voting', 'No Anomaly'] },
  { description: 'Proposal "Remote Work": 200 identical votes submitted within 30 seconds, all from new accounts created today.', correct: 'Bot Swarm', options: ['Whale Flip', 'Bot Swarm', 'Brigading', 'No Anomaly'] },
];

export default function SignalDetectivePage() {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [totalXp, setTotalXp] = useState(0);
  const [finished, setFinished] = useState(false);

  if (finished || idx >= ANOMALIES.length) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 rounded-2xl bg-cosmic-amber/10 flex items-center justify-center mx-auto mb-6"><Search className="w-10 h-10 text-cosmic-amber" /></div>
        <h1 className="text-3xl font-bold font-heading mb-2">Investigation Complete</h1>
        <div className="text-5xl font-bold font-heading text-gradient mb-2">+{totalXp} XP</div>
        <p className="text-cosmic-muted mb-6">Your detective skills earned {totalXp} XP</p>
        <Link href="/dashboard/games"><Button className="bg-cosmic-accent text-white">Back to Games</Button></Link>
      </div>
    );
  }

  const current = ANOMALIES[idx];

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard/games"><Button variant="ghost" className="text-cosmic-muted hover:text-white mb-4"><ArrowLeft className="w-4 h-4 mr-1" /> Games</Button></Link>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cosmic-amber/10 flex items-center justify-center"><Search className="w-5 h-5 text-cosmic-amber" /></div>
          <div><h1 className="text-xl font-bold font-heading">Signal Detective</h1><p className="text-xs text-cosmic-amber">Spot anomalies in the data stream</p></div>
        </div>
        <div className="flex items-center gap-1 text-cosmic-amber text-sm font-medium"><Zap className="w-4 h-4" />{totalXp} XP</div>
      </div>
      <Card className="glass-card-amber mb-6">
        <CardContent className="p-6">
          <p className="text-xs text-cosmic-muted mb-2">Case {idx + 1} of {ANOMALIES.length}</p>
          {/* Data stream visualization */}
          <div className="bg-[#04050b] rounded-lg p-4 mb-5 font-mono text-xs text-cosmic-muted overflow-hidden">
            <div className="flex items-center gap-2 mb-3 text-cosmic-amber"><AlertCircle className="w-4 h-4" /><span>ANOMALY DETECTED — CLASSIFY</span></div>
            <div className="space-y-1 opacity-70">
              {[...Array(6)].map((_, i) => <div key={i} className="h-1 bg-white/5 rounded" style={{ width: `${30 + Math.random() * 70}%` }} />)}
            </div>
          </div>
          <p className="text-sm leading-relaxed mb-5">{current.description}</p>
          <p className="text-xs text-cosmic-muted mb-3">What type of anomaly is this?</p>
          <div className="space-y-2">
            {current.options.map(opt => (
              <button key={opt} onClick={() => !revealed && setSelected(opt)} disabled={revealed}
                className={`w-full p-3 rounded-xl text-sm font-medium border transition-all text-left ${selected === opt ? 'border-cosmic-amber/30 bg-cosmic-amber/5 text-cosmic-amber' : 'border-white/5 bg-white/5 text-cosmic-muted hover:border-white/10'}`}>
                {selected === opt && <Check className="w-3 h-3 inline mr-2" />}{opt}
              </button>
            ))}
          </div>
          {revealed && (
            <div className={`mt-4 p-3 rounded-xl ${selected === current.correct ? 'bg-cosmic-teal/10 border border-cosmic-teal/20' : 'bg-cosmic-rose/10 border border-cosmic-rose/20'}`}>
              <p className="text-sm font-medium">{selected === current.correct ? 'Correct!' : 'Incorrect'}</p>
              <p className="text-xs text-cosmic-muted">The anomaly was: {current.correct}. {selected === current.correct ? `+${Math.floor(40 + Math.random() * 60)} XP` : '+5 XP'}</p>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-center">
        {!revealed ? (
          <Button onClick={() => { if (selected) { setRevealed(true); setTotalXp(prev => prev + (selected === current.correct ? Math.floor(40 + Math.random() * 60) : 5)); } }} disabled={!selected} className="bg-cosmic-amber text-[#04050b] rounded-xl px-8">Submit Analysis</Button>
        ) : (
          <Button onClick={() => { setIdx(prev => prev + 1); setSelected(null); setRevealed(false); if (idx >= ANOMALIES.length - 1) setFinished(true); }} className="bg-cosmic-accent text-white rounded-xl px-8">
            {idx >= ANOMALIES.length - 1 ? 'See Results' : 'Next Case'}
          </Button>
        )}
      </div>
    </div>
  );
}
