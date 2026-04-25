'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle, Zap, Check, Swords } from 'lucide-react';

const BIASES = [
  { quote: 'We\'ve already invested 6 months in this approach — we can\'t abandon it now.', correct: 'Sunk Cost Fallacy', options: ['Sunk Cost Fallacy', 'Anchoring Bias', 'Status Quo Bias', 'Confirmation Bias'] },
  { quote: 'The first proposal we reviewed became the standard everything else was compared to.', correct: 'Anchoring Bias', options: ['Availability Heuristic', 'Anchoring Bias', 'Bandwagon Effect', 'Sunk Cost Fallacy'] },
  { quote: 'I only read articles that support my position on this governance reform.', correct: 'Confirmation Bias', options: ['Dunning-Kruger Effect', 'Confirmation Bias', 'Survivorship Bias', 'Halo Effect'] },
];

export default function CognitiveWarfarePage() {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [totalXp, setTotalXp] = useState(0);
  const [finished, setFinished] = useState(false);

  if (finished || idx >= BIASES.length) {
    return <div className="max-w-2xl mx-auto text-center">
      <div className="w-20 h-20 rounded-2xl bg-cosmic-rose/10 flex items-center justify-center mx-auto mb-6"><Swords className="w-10 h-10 text-cosmic-rose" /></div>
      <h1 className="text-3xl font-bold font-heading mb-2">Battle Complete</h1>
      <div className="text-5xl font-bold font-heading text-gradient mb-2">+{totalXp} XP</div>
      <p className="text-cosmic-muted mb-6">Biases defeated, evidence victorious</p>
      <Link href="/dashboard/games"><Button className="bg-cosmic-accent text-white">Back to Games</Button></Link>
    </div>;
  }

  const current = BIASES[idx];

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard/games"><Button variant="ghost" className="text-cosmic-muted hover:text-white mb-4"><ArrowLeft className="w-4 h-4 mr-1" /> Games</Button></Link>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cosmic-rose/10 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-cosmic-rose" /></div>
          <div><h1 className="text-xl font-bold font-heading">Cognitive Warfare</h1><p className="text-xs text-cosmic-rose">Defeat bias with evidence</p></div>
        </div>
        <div className="flex items-center gap-1 text-cosmic-amber text-sm font-medium"><Zap className="w-4 h-4" />{totalXp} XP</div>
      </div>
      <Card className="glass-card-rose mb-6">
        <CardContent className="p-6">
          <p className="text-xs text-cosmic-muted mb-3">Encounter {idx + 1} of {BIASES.length}</p>
          <div className="bg-[#04050b] rounded-lg p-4 mb-5 border-l-2 border-cosmic-rose">
            <p className="text-sm italic text-cosmic-muted leading-relaxed">&ldquo;{current.quote}&rdquo;</p>
          </div>
          <p className="text-xs text-cosmic-muted mb-3">Identify the cognitive bias:</p>
          <div className="space-y-2">
            {current.options.map(opt => (
              <button key={opt} onClick={() => !revealed && setSelected(opt)} disabled={revealed}
                className={`w-full p-3 rounded-xl text-sm font-medium border transition-all text-left ${selected === opt ? 'border-cosmic-rose/30 bg-cosmic-rose/5 text-cosmic-rose' : 'border-white/5 bg-white/5 text-cosmic-muted hover:border-white/10'}`}>
                {selected === opt && <Check className="w-3 h-3 inline mr-2" />}{opt}
              </button>
            ))}
          </div>
          {revealed && (
            <div className={`mt-4 p-3 rounded-xl ${selected === current.correct ? 'bg-cosmic-teal/10 border border-cosmic-teal/20' : 'bg-cosmic-rose/10 border border-cosmic-rose/20'}`}>
              <p className="text-sm font-medium">{selected === current.correct ? 'Bias Defeated!' : 'The bias survived'}</p>
              <p className="text-xs text-cosmic-muted">Correct answer: {current.correct}</p>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-center">
        {!revealed ? (
          <Button onClick={() => { if (selected) { setRevealed(true); const xp = selected === current.correct ? Math.floor(50 + Math.random() * 70) : 5; setTotalXp(prev => prev + xp); } }} disabled={!selected} className="bg-cosmic-rose text-white rounded-xl px-8">Attack</Button>
        ) : (
          <Button onClick={() => { setIdx(prev => prev + 1); setSelected(null); setRevealed(false); if (idx >= BIASES.length - 1) setFinished(true); }} className="bg-cosmic-accent text-white rounded-xl px-8">
            {idx >= BIASES.length - 1 ? 'See Results' : 'Next Battle'}
          </Button>
        )}
      </div>
    </div>
  );
}
