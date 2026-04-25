'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Shield, Zap, Check } from 'lucide-react';

const SCENARIOS = [
  { scenario: 'Your organization faces a critical infrastructure failure. 3 teams propose different solutions. Team A\'s plan is fastest but riskiest. Team B\'s is moderate. Team C\'s is slowest but most proven.', correct: 'Risk-weighted consensus', options: ['Execute Team A immediately', 'Risk-weighted consensus', 'Always choose safest option', 'Delay and gather more data'] },
  { scenario: 'A controversial policy change has split the community 51/49. The 51% wants to proceed immediately. The 49% threatens to leave if it passes.', correct: 'Seek supermajority compromise', options: ['Follow the majority', 'Seek supermajority compromise', 'Abandon the proposal', 'Let AI decide'] },
];

export default function StrategicCommandPage() {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(3);
  const [revealed, setRevealed] = useState(false);
  const [totalXp, setTotalXp] = useState(0);
  const [finished, setFinished] = useState(false);

  if (finished || idx >= SCENARIOS.length) {
    return <div className="max-w-2xl mx-auto text-center">
      <div className="w-20 h-20 rounded-2xl bg-cosmic-teal/10 flex items-center justify-center mx-auto mb-6"><Shield className="w-10 h-10 text-cosmic-teal" /></div>
      <h1 className="text-3xl font-bold font-heading mb-2">Mission Complete</h1>
      <div className="text-5xl font-bold font-heading text-gradient mb-2">+{totalXp} XP</div>
      <Link href="/dashboard/games"><Button className="bg-cosmic-accent text-white mt-6">Back to Games</Button></Link>
    </div>;
  }

  const current = SCENARIOS[idx];
  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard/games"><Button variant="ghost" className="text-cosmic-muted hover:text-white mb-4"><ArrowLeft className="w-4 h-4 mr-1" /> Games</Button></Link>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-cosmic-teal/10 flex items-center justify-center"><Shield className="w-5 h-5 text-cosmic-teal" /></div><div><h1 className="text-xl font-bold font-heading">Strategic Command</h1><p className="text-xs text-cosmic-teal">Command high-stakes decisions</p></div></div>
        <div className="flex items-center gap-1 text-cosmic-amber text-sm font-medium"><Zap className="w-4 h-4" />{totalXp} XP</div>
      </div>
      <Card className="glass-card-teal mb-6">
        <CardContent className="p-6">
          <p className="text-xs text-cosmic-muted mb-3">Scenario {idx + 1} of {SCENARIOS.length}</p>
          <div className="bg-[#04050b] rounded-lg p-4 mb-5 border border-white/5"><p className="text-sm leading-relaxed">{current.scenario}</p></div>
          <p className="text-xs text-cosmic-muted mb-3">Select your strategic response:</p>
          <div className="space-y-2 mb-4">
            {current.options.map(opt => (
              <button key={opt} onClick={() => !revealed && setSelected(opt)} disabled={revealed}
                className={`w-full p-3 rounded-xl text-sm font-medium border transition-all text-left ${selected === opt ? 'border-cosmic-teal/30 bg-cosmic-teal/5 text-cosmic-teal' : 'border-white/5 bg-white/5 text-cosmic-muted hover:border-white/10'}`}>
                {selected === opt && <Check className="w-3 h-3 inline mr-2" />}{opt}
              </button>
            ))}
          </div>
          <div className="mb-4"><label className="text-xs text-cosmic-muted mb-2 block">Confidence: {confidence}/5</label><input type="range" min={1} max={5} value={confidence} onChange={e => setConfidence(Number(e.target.value))} className="w-full accent-[#2EE6C7]" /></div>
          {revealed && (
            <div className={`p-3 rounded-xl ${selected === current.correct ? 'bg-cosmic-teal/10 border border-cosmic-teal/20' : 'bg-cosmic-rose/10 border border-cosmic-rose/20'}`}>
              <p className="text-sm font-medium">{selected === current.correct ? 'Excellent strategy!' : 'Suboptimal approach'}</p>
              <p className="text-xs text-cosmic-muted">Best: {current.correct}</p>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-center">
        {!revealed ? (
          <Button onClick={() => { if (selected) { setRevealed(true); const xp = selected === current.correct ? Math.floor(confidence * 30) : Math.floor(confidence * 5); setTotalXp(prev => prev + xp); } }} disabled={!selected} className="bg-cosmic-teal text-[#04050b] rounded-xl px-8">Commit Strategy</Button>
        ) : (
          <Button onClick={() => { setIdx(prev => prev + 1); setSelected(null); setRevealed(false); if (idx >= SCENARIOS.length - 1) setFinished(true); }} className="bg-cosmic-accent text-white rounded-xl px-8">{idx >= SCENARIOS.length - 1 ? 'See Results' : 'Next Scenario'}</Button>
        )}
      </div>
    </div>
  );
}
