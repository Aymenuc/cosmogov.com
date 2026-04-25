'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Brain, Zap, Check, Loader2, Sparkles } from 'lucide-react';

const ROUNDS = [
  { question: 'What should be the primary goal of governance?', options: ['Efficiency', 'Fairness', 'Transparency', 'Innovation'] },
  { question: 'Which decision-making style do you trust most?', options: ['Data-driven', 'Consensus-based', 'Expert-led', 'Community-voted'] },
  { question: 'When facing uncertainty, the best approach is:', options: ['Gather more data', 'Trust intuition', 'Delegate to experts', 'Vote as a group'] },
];

// Simulated "other players" consensus data
const CONSENSUS_MAP: Record<string, Record<string, number>> = {
  'What should be the primary goal of governance?': { 'Efficiency': 22, 'Fairness': 38, 'Transparency': 28, 'Innovation': 12 },
  'Which decision-making style do you trust most?': { 'Data-driven': 42, 'Consensus-based': 28, 'Expert-led': 18, 'Community-voted': 12 },
  'When facing uncertainty, the best approach is:': { 'Gather more data': 35, 'Trust intuition': 8, 'Delegate to experts': 22, 'Vote as a group': 35 },
};

export default function NeuralConsensusPage() {
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [totalXp, setTotalXp] = useState(0);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nodePulses, setNodePulses] = useState<number[]>([]);

  const currentRound = ROUNDS[round];
  const consensus = currentRound ? CONSENSUS_MAP[currentRound.question] : {};

  const handleSelect = useCallback((option: string) => {
    if (revealed) return;
    setSelected(option);
  }, [revealed]);

  const handleReveal = useCallback(() => {
    if (!selected) return;
    setRevealed(true);
    const pct = consensus[selected] || 0;
    const xp = Math.floor(pct * 2);
    setTotalXp(prev => prev + xp);

    // Animate node pulses
    const pulses = Object.values(consensus);
    setNodePulses(pulses);
    setTimeout(() => setNodePulses([]), 1500);
  }, [selected, consensus]);

  const handleNext = useCallback(() => {
    if (round < ROUNDS.length - 1) {
      setRound(prev => prev + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setFinished(true);
      // Submit game result
      setSubmitting(true);
      fetch('/api/games/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType: 'neural_consensus', score: totalXp, accuracy: 0.8 }),
      }).finally(() => setSubmitting(false));
    }
  }, [round, totalXp]);

  if (finished) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8" style={{ animation: 'scaleIn 0.5s ease-out' }}>
          <div className="w-20 h-20 rounded-2xl bg-cosmic-teal/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-cosmic-teal" />
          </div>
          <h1 className="text-3xl font-bold font-heading mb-2">Round Complete!</h1>
          <p className="text-cosmic-muted">Your neural pathways aligned with the collective.</p>
        </div>
        <Card className="glass-card-teal mb-6">
          <CardContent className="p-8">
            <div className="text-5xl font-bold font-heading text-gradient mb-2">+{totalXp} XP</div>
            <p className="text-cosmic-muted">earned across {ROUNDS.length} rounds</p>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center gap-4">
          <Link href="/dashboard/games"><Button variant="ghost" className="text-cosmic-muted">Back to Games</Button></Link>
          <Button className="bg-cosmic-accent text-white" onClick={() => { setRound(0); setSelected(null); setRevealed(false); setTotalXp(0); setFinished(false); }}>Play Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard/games"><Button variant="ghost" className="text-cosmic-muted hover:text-white mb-4"><ArrowLeft className="w-4 h-4 mr-1" /> Games</Button></Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cosmic-teal/10 flex items-center justify-center"><Brain className="w-5 h-5 text-cosmic-teal" /></div>
          <div><h1 className="text-xl font-bold font-heading">Neural Consensus</h1><p className="text-xs text-cosmic-teal">Converge with the collective mind</p></div>
        </div>
        <div className="flex items-center gap-1 text-cosmic-amber text-sm font-medium"><Zap className="w-4 h-4" />{totalXp} XP</div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {ROUNDS.map((_, i) => (
          <div key={i} className={`h-1.5 flex-grow rounded-full ${i < round ? 'bg-cosmic-teal' : i === round ? 'bg-cosmic-teal/40' : 'bg-white/5'}`} />
        ))}
      </div>

      {/* Neural Network Visualization */}
      <div className="relative mb-6">
        <div className="flex items-center justify-center gap-4 py-6">
          {currentRound.options.map((opt, i) => {
            const pct = revealed ? (consensus[opt] || 0) : 0;
            const isSelected = selected === opt;
            const isTopChoice = revealed && Object.entries(consensus).sort((a, b) => b[1] - a[1])[0]?.[0] === opt;
            return (
              <div key={opt} className="relative" style={{ animation: `scaleIn 0.4s ease-out ${i * 0.1}s both` }}>
                {/* Pulse ring */}
                {revealed && (
                  <div className="absolute inset-0 rounded-full" style={{
                    animation: 'pulseGlow 1s ease-out',
                    border: `2px solid ${isTopChoice ? '#2EE6C7' : 'rgba(255,255,255,0.1)'}`,
                    transform: `scale(${1 + pct / 100})`,
                  }} />
                )}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${isSelected ? 'bg-cosmic-teal/20 text-cosmic-teal ring-2 ring-cosmic-teal/40' : 'bg-white/5 text-cosmic-muted'}`}
                  style={{ transform: revealed ? `scale(${0.8 + pct / 100})` : 'scale(1)' }}>
                  {revealed ? `${pct}%` : (i + 1)}
                </div>
              </div>
            );
          })}
        </div>
        {/* Connection lines (simplified) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.1 }}>
          <line x1="25%" y1="50%" x2="75%" y2="50%" stroke="#2EE6C7" strokeWidth="1" />
          <line x1="50%" y1="20%" x2="50%" y2="80%" stroke="#2EE6C7" strokeWidth="1" />
        </svg>
      </div>

      {/* Question */}
      <Card className="glass-card mb-6">
        <CardContent className="p-6">
          <p className="text-xs text-cosmic-muted mb-1">Round {round + 1} of {ROUNDS.length}</p>
          <h2 className="text-lg font-semibold font-heading mb-5">{currentRound.question}</h2>
          <div className="grid grid-cols-2 gap-3">
            {currentRound.options.map(opt => {
              const pct = revealed ? (consensus[opt] || 0) : 0;
              const isMatch = selected === opt;
              return (
                <button key={opt} onClick={() => handleSelect(opt)} disabled={revealed}
                  className={`p-4 rounded-xl text-sm font-medium transition-all border text-left relative overflow-hidden ${isMatch ? 'border-cosmic-teal/30 bg-cosmic-teal/5' : 'border-white/5 bg-white/5 hover:border-white/10'} ${revealed ? 'cursor-default' : 'cursor-pointer'}`}>
                  {revealed && (
                    <div className="absolute inset-0 bg-cosmic-teal/10" style={{ width: `${pct}%`, transition: 'width 1s ease-out' }} />
                  )}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className={isMatch ? 'text-cosmic-teal' : 'text-white'}>{opt}</span>
                      {revealed && <span className="text-xs text-cosmic-muted">{pct}% chose this</span>}
                    </div>
                    {revealed && (
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-cosmic-teal/50 rounded-full" style={{ width: `${pct}%`, transition: 'width 1s ease-out' }} />
                      </div>
                    )}
                    {isMatch && !revealed && <Check className="absolute top-0 right-0 w-4 h-4 text-cosmic-teal" />}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action */}
      <div className="flex justify-center">
        {!revealed ? (
          <Button onClick={handleReveal} disabled={!selected} className="bg-cosmic-teal text-[#04050b] hover:bg-cosmic-teal/90 rounded-xl px-8">
            Reveal Consensus
          </Button>
        ) : (
          <Button onClick={handleNext} className="bg-cosmic-accent text-white rounded-xl px-8" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : round < ROUNDS.length - 1 ? 'Next Round' : 'See Results'}
          </Button>
        )}
      </div>
    </div>
  );
}
