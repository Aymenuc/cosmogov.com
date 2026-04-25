'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Medal, Zap, FileText, Vote, Gamepad2 } from 'lucide-react';

interface LeaderEntry { id: string; name: string | null; totalXp: number; level: number; proposals: number; votes: number; gameXp: number; }

export default function LeaderboardsPage() {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);

  useEffect(() => {
    // Simulated leaderboard data (in production, this would be a real API call)
    setLeaders([
      { id: '1', name: 'Alice Nova', totalXp: 4850, level: 12, proposals: 8, votes: 42, gameXp: 1850 },
      { id: '2', name: 'Bob Stellar', totalXp: 2200, level: 7, proposals: 5, votes: 31, gameXp: 800 },
      { id: '3', name: 'Carol Cosmos', totalXp: 890, level: 4, proposals: 2, votes: 18, gameXp: 340 },
    ]);
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold font-heading flex items-center gap-2"><Trophy className="w-6 h-6 text-cosmic-amber" /> Leaderboards</h1><p className="text-cosmic-muted text-sm">Top governance contributors</p></div>
      {/* Desktop Table */}
      <Card className="bg-[#0B1022] border-white/5 hidden sm:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5">
                <th className="text-left text-xs text-cosmic-muted font-medium p-4">Rank</th>
                <th className="text-left text-xs text-cosmic-muted font-medium p-4">User</th>
                <th className="text-right text-xs text-cosmic-muted font-medium p-4">Level</th>
                <th className="text-right text-xs text-cosmic-muted font-medium p-4">Total XP</th>
                <th className="text-right text-xs text-cosmic-muted font-medium p-4">Proposals</th>
                <th className="text-right text-xs text-cosmic-muted font-medium p-4">Votes</th>
                <th className="text-right text-xs text-cosmic-muted font-medium p-4">Game XP</th>
              </tr></thead>
              <tbody>
                {leaders.map((l, i) => (
                  <tr key={l.id} className={`border-b border-white/5 ${i === 0 ? 'bg-cosmic-amber/5' : ''}`}>
                    <td className="p-4 text-lg">{medals[i] || `#${i + 1}`}</td>
                    <td className="p-4"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-cosmic-accent/20 flex items-center justify-center text-xs font-bold text-cosmic-accent">{(l.name || 'U')[0]}</div><span className="text-sm font-medium">{l.name}</span></div></td>
                    <td className="p-4 text-right text-sm"><span className="text-cosmic-teal">Lv.{l.level}</span></td>
                    <td className="p-4 text-right text-sm font-medium text-cosmic-amber">{l.totalXp.toLocaleString()}</td>
                    <td className="p-4 text-right text-sm text-cosmic-muted">{l.proposals}</td>
                    <td className="p-4 text-right text-sm text-cosmic-muted">{l.votes}</td>
                    <td className="p-4 text-right text-sm text-cosmic-muted">{l.gameXp.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {leaders.map((l, i) => (
          <Card key={l.id} className={`bg-[#0B1022] border-white/5 ${i === 0 ? 'ring-1 ring-cosmic-amber/20' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">{medals[i] || `#${i + 1}`}</span>
                <div className="w-8 h-8 rounded-full bg-cosmic-accent/20 flex items-center justify-center text-xs font-bold text-cosmic-accent">
                  {(l.name || 'U')[0]}
                </div>
                <span className="font-medium text-sm">{l.name}</span>
                <span className="ml-auto text-cosmic-teal text-xs">Lv.{l.level}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div><span className="text-cosmic-amber font-bold">{l.totalXp.toLocaleString()}</span><br/><span className="text-cosmic-muted">XP</span></div>
                <div><span className="font-bold">{l.proposals}</span><br/><span className="text-cosmic-muted">Proposals</span></div>
                <div><span className="font-bold">{l.votes}</span><br/><span className="text-cosmic-muted">Votes</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
