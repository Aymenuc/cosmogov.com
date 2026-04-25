'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Target, TrendingUp, Brain, Search, Shield, Clock, BarChart3 } from 'lucide-react';

const metrics = [
  { name: 'Brier Score', value: '0.23', trend: '+5%', desc: 'Prediction calibration accuracy', icon: Target, color: 'text-cosmic-teal', bg: 'bg-cosmic-teal/10' },
  { name: 'Coordination Index', value: '87%', trend: '+12%', desc: 'How well the group aligns', icon: Brain, color: 'text-cosmic-violet', bg: 'bg-cosmic-violet/10' },
  { name: 'Bias Detection Rate', value: '73%', trend: '+8%', desc: 'Correctly identified biases', icon: Search, color: 'text-cosmic-amber', bg: 'bg-cosmic-amber/10' },
  { name: 'Doctrine Accuracy', value: '81%', trend: '+3%', desc: 'Strategic decision accuracy', icon: Shield, color: 'text-cosmic-teal', bg: 'bg-cosmic-teal/10' },
  { name: 'Anomaly Spot Rate', value: '68%', trend: '+15%', desc: 'Anomalies correctly identified', icon: Search, color: 'text-cosmic-amber', bg: 'bg-cosmic-amber/10' },
  { name: 'Pre-Mortem Accuracy', value: '76%', trend: '+9%', desc: 'Failure cause identification', icon: Clock, color: 'text-cosmic-violet', bg: 'bg-cosmic-violet/10' },
];

export default function DecisionsPage() {
  const weeklyTrend = [65, 68, 71, 74, 72, 78, 81];
  const maxVal = Math.max(...weeklyTrend);

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold font-heading">Decision Quality</h1><p className="text-cosmic-muted text-sm">How well your organization makes decisions</p></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {metrics.map(m => (
          <Card key={m.name} className="bg-[#0B1022] border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center`}><m.icon className={`w-4 h-4 ${m.color}`} /></div>
                <span className="text-xs text-cosmic-teal">{m.trend}</span>
              </div>
              <p className="text-2xl font-bold font-heading">{m.value}</p>
              <p className="text-sm font-medium mt-0.5">{m.name}</p>
              <p className="text-xs text-cosmic-muted">{m.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-[#0B1022] border-white/5">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-cosmic-accent" /> Weekly Quality Trend</h3>
          <div className="flex items-end gap-2 h-32">
            {weeklyTrend.map((v, i) => (
              <div key={i} className="flex-grow flex flex-col items-center gap-1">
                <div className="w-full rounded-t-lg bg-gradient-to-t from-cosmic-accent to-cosmic-teal" style={{ height: `${(v / maxVal) * 100}%` }} />
                <span className="text-xs text-cosmic-muted">W{i + 1}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
