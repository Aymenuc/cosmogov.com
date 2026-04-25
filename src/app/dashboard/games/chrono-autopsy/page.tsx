'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Clock, Zap, Check, Rewind } from 'lucide-react';

const AUTOPSIES = [
  { proposal: 'Community Budget Proposal — PASSED', failure: 'Funds were misallocated because no audit mechanism was built in', timeline: ['Week 1: Proposal submitted', 'Week 2: Community debate', 'Week 3: Vote passes 67-33', 'Week 4: Implementation begins', 'Week 8: Budget overruns detected', 'Week 12: Project abandoned'], correct: 'No audit mechanism', options: ['Rushed voting process', 'No audit mechanism', 'Poor communication', 'Insufficient quorum'] },
  { proposal: 'Remote Work Policy — PASSED', failure: 'Productivity dropped because the policy lacked clear accountability metrics', timeline: ['Day 1: Proposal created', 'Day 3: Overwhelming support', 'Day 5: Passed unanimously', 'Day 10: Implementation', 'Day 30: Productivity decline', 'Day 60: Policy reversed'], correct: 'Missing accountability metrics', options: ['Too broad scope', 'Missing accountability metrics', 'No transition period', 'Wrong timing'] },
];

export default function ChronoAutopsyPage() {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [totalXp, setTotalXp] = useState(0);
  const [finished, setFinished] = useState(false);

  if (finished || idx >= AUTOPSIES.length) {
    return <div className="max-w-2xl mx-auto text-center">
      <div className="w-20 h-20 rounded-2xl bg-cosmic-violet/10 flex items-center justify-center mx-auto mb-6"><Rewind className="w-10 h-10 text-cosmic-violet" /></div>
      <h1 className="text-3xl font-bold font-heading mb-2">Autopsy Complete</h1>
      <div className="text-5xl font-bold font-heading text-gradient mb-2">+{totalXp} XP</div>
      <Link href="/dashboard/games"><Button className="bg-cosmic-accent text-white mt-6">Back to Games</Button></Link>
    </div>;
  }

  const current = AUTOPSIES[idx];
  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard/games"><Button variant="ghost" className="text-cosmic-muted hover:text-white mb-4"><ArrowLeft className="w-4 h-4 mr-1" /> Games</Button></Link>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-cosmic-violet/10 flex items-center justify-center"><Clock className="w-5 h-5 text-cosmic-violet" /></div><div><h1 className="text-xl font-bold font-heading">Chrono Autopsy</h1><p className="text-xs text-cosmic-violet">Reverse-engineer failure</p></div></div>
        <div className="flex items-center gap-1 text-cosmic-amber text-sm font-medium"><Zap className="w-4 h-4" />{totalXp} XP</div>
      </div>
      <Card className="glass-card-violet mb-6">
        <CardContent className="p-6">
          <p className="text-xs text-cosmic-muted mb-2">Autopsy {idx + 1} of {AUTOPSIES.length}</p>
          <h2 className="text-lg font-semibold font-heading mb-1">{current.proposal}</h2>
          <p className="text-xs text-cosmic-rose mb-4">Result: FAILED — {current.failure}</p>
          {/* Timeline - reversed */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3 text-cosmic-violet"><Rewind className="w-4 h-4" /><span className="text-xs font-medium">Timeline (rewinding...)</span></div>
            <div className="space-y-1.5">
              {[...current.timeline].reverse().map((event, i) => (
                <div key={i} className="flex items-center gap-3 text-xs" style={{ animation: `slideUp 0.3s ease-out ${i * 0.1}s both` }}>
                  <div className="w-2 h-2 rounded-full bg-cosmic-violet/40 flex-shrink-0" />
                  <span className="text-cosmic-muted">{event}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-cosmic-muted mb-3">What was the root cause of failure?</p>
          <div className="space-y-2">
            {current.options.map(opt => (
              <button key={opt} onClick={() => !revealed && setSelected(opt)} disabled={revealed}
                className={`w-full p-3 rounded-xl text-sm font-medium border transition-all text-left ${selected === opt ? 'border-cosmic-violet/30 bg-cosmic-violet/5 text-cosmic-violet' : 'border-white/5 bg-white/5 text-cosmic-muted hover:border-white/10'}`}>
                {selected === opt && <Check className="w-3 h-3 inline mr-2" />}{opt}
              </button>
            ))}
          </div>
          {revealed && (
            <div className={`mt-4 p-3 rounded-xl ${selected === current.correct ? 'bg-cosmic-teal/10 border border-cosmic-teal/20' : 'bg-cosmic-rose/10 border border-cosmic-rose/20'}`}>
              <p className="text-sm font-medium">{selected === current.correct ? 'Root cause identified!' : 'Incorrect diagnosis'}</p>
              <p className="text-xs text-cosmic-muted">Root cause: {current.correct}</p>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-center">
        {!revealed ? (
          <Button onClick={() => { if (selected) { setRevealed(true); const xp = selected === current.correct ? Math.floor(60 + Math.random() * 80) : 5; setTotalXp(prev => prev + xp); } }} disabled={!selected} className="bg-cosmic-violet text-white rounded-xl px-8">Submit Diagnosis</Button>
        ) : (
          <Button onClick={() => { setIdx(prev => prev + 1); setSelected(null); setRevealed(false); if (idx >= AUTOPSIES.length - 1) setFinished(true); }} className="bg-cosmic-accent text-white rounded-xl px-8">{idx >= AUTOPSIES.length - 1 ? 'See Results' : 'Next Autopsy'}</Button>
        )}
      </div>
    </div>
  );
}
