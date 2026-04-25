'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, TrendingUp, Vote, Clock, Target } from 'lucide-react';

export default function AnalyticsPage() {
  const [proposals, setProposals] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/proposals').then(r => r.json()).then(data => setProposals(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const active = proposals.filter(p => p.status === 'active').length;
  const closed = proposals.filter(p => p.status === 'closed').length;
  const totalVotes = proposals.reduce((sum, p) => sum + (p._count?.votes || 0), 0);
  const avgVotes = proposals.length > 0 ? (totalVotes / proposals.length).toFixed(1) : '0';

  // Weekly data (simulated)
  const weeklyData = [
    { day: 'Mon', votes: 12 }, { day: 'Tue', votes: 18 }, { day: 'Wed', votes: 25 },
    { day: 'Thu', votes: 22 }, { day: 'Fri', votes: 31 }, { day: 'Sat', votes: 15 }, { day: 'Sun', votes: 9 },
  ];
  const maxVotes = Math.max(...weeklyData.map(d => d.votes));

  return (
    <div>
      <div className="mb-4 sm:mb-6"><h1 className="text-xl sm:text-2xl font-bold font-heading">Analytics</h1><p className="text-cosmic-muted text-sm">Governance participation insights</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { label: 'Active Proposals', value: active, icon: Vote, color: 'text-cosmic-teal', bg: 'bg-cosmic-teal/10' },
          { label: 'Closed Proposals', value: closed, icon: BarChart3, color: 'text-cosmic-accent', bg: 'bg-cosmic-accent/10' },
          { label: 'Total Votes', value: totalVotes, icon: TrendingUp, color: 'text-cosmic-violet', bg: 'bg-cosmic-violet/10' },
          { label: 'Avg Votes/Proposal', value: avgVotes, icon: Target, color: 'text-cosmic-amber', bg: 'bg-cosmic-amber/10' },
        ].map(s => (
          <Card key={s.label} className="bg-[#0B1022] border-white/5"><CardContent className="p-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}><s.icon className={`w-4 h-4 ${s.color}`} /></div>
            <p className="text-2xl font-bold font-heading">{s.value}</p><p className="text-xs text-cosmic-muted mt-0.5">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="bg-[#0B1022] border-white/5 mb-6">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cosmic-accent" /> Weekly Participation</h3>
          <div className="flex items-end gap-1 sm:gap-3 h-36 sm:h-48">
            {weeklyData.map(d => (
              <div key={d.day} className="flex-grow flex flex-col items-center gap-1">
                <div className="w-full rounded-t-lg bg-gradient-to-t from-cosmic-accent to-cosmic-teal transition-all" style={{ height: `${(d.votes / maxVotes) * 100}%`, minHeight: '4px' }} />
                <span className="text-xs text-cosmic-muted">{d.day}</span>
                <span className="text-xs text-cosmic-muted">{d.votes}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-[#0B1022] border-white/5"><CardContent className="p-4">
          <h4 className="text-xs text-cosmic-muted mb-2">Median Time to Decision</h4>
          <p className="text-2xl font-bold font-heading">3.2 <span className="text-sm text-cosmic-muted font-normal">days</span></p>
        </CardContent></Card>
        <Card className="bg-[#0B1022] border-white/5"><CardContent className="p-4">
          <h4 className="text-xs text-cosmic-muted mb-2">Quorum Hit Rate</h4>
          <p className="text-2xl font-bold font-heading text-cosmic-teal">87%</p>
        </CardContent></Card>
        <Card className="bg-[#0B1022] border-white/5"><CardContent className="p-4">
          <h4 className="text-xs text-cosmic-muted mb-2">Participation Rate</h4>
          <p className="text-2xl font-bold font-heading text-cosmic-amber">72%</p>
        </CardContent></Card>
      </div>
    </div>
  );
}
