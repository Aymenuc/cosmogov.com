'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Building2, FileText, Vote, Zap, Plus, Brain, Gamepad2,
  ArrowRight, Clock, Users, Flame, TrendingUp, Target,
  Sparkles, Shield, Eye, Search as SearchIcon, Crown,
  Rocket, Star, Activity, ChevronRight
} from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  plan: string;
  role: string;
  totalXp: number;
  level: number;
  streak: number;
}

interface Proposal {
  id: string;
  title: string;
  status: string;
  votingType: string;
  _count: { votes: number; comments: number };
  createdAt: string;
  organization?: { name: string; slug: string } | null;
}

export default function OverviewPage() {
  const [user, setUser] = useState<User | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [orgCount, setOrgCount] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(setUser).catch(() => {});
    fetch('/api/proposals').then(r => r.json()).then(data => { setProposals(Array.isArray(data) ? data.slice(0, 5) : []); }).catch(() => {});
    fetch('/api/organizations').then(r => r.json()).then(data => { setOrgCount(Array.isArray(data) ? data.length : 0); }).catch(() => {});
  }, []);

  const xpToNext = (user?.level || 1) * 500;
  const currentXp = (user?.totalXp || 0) % xpToNext;
  const xpProgress = (currentXp / xpToNext) * 100;

  const stats = [
    { label: 'Organizations', value: orgCount, icon: Building2, color: 'text-cosmic-teal', bg: 'bg-cosmic-teal/10', trend: '+2 this week' },
    { label: 'Active Proposals', value: proposals.filter(p => p.status === 'active').length, icon: FileText, color: 'text-cosmic-accent', bg: 'bg-cosmic-accent/10', trend: '3 pending vote' },
    { label: 'Total Votes Cast', value: proposals.reduce((sum, p) => sum + (p._count?.votes || 0), 0), icon: Vote, color: 'text-cosmic-violet', bg: 'bg-cosmic-violet/10', trend: '+5 today' },
    { label: 'XP Points', value: user?.totalXp || 0, icon: Zap, color: 'text-cosmic-amber', bg: 'bg-cosmic-amber/10', trend: `Level ${user?.level || 1}` },
  ];

  const featuredGame = {
    name: 'Neural Consensus',
    tagline: 'Converge with the collective mind',
    icon: Brain,
    accent: '#2EE6C7',
    href: '/dashboard/games/neural-consensus',
  };

  return (
    <div>
      {/* Welcome Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          {user?.streak && user.streak > 0 && (
            <div className="flex items-center gap-1 text-xs text-cosmic-amber cosmic-badge rounded-full px-2.5 py-1">
              <Flame className="w-3 h-3" />
              <span>{user.streak} day streak!</span>
            </div>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading mb-1">
          Welcome back, <span className="text-gradient">{user?.name || 'Explorer'}</span>
        </h1>
        <p className="text-cosmic-muted">Your governance cosmos is thriving. Level {user?.level || 1} — keep climbing.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map(s => (
          <Card key={s.label} className="bg-[#0B1022] border-white/5 hover:border-white/10 transition-all group">
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold font-heading">{s.value}</p>
              <p className="text-xs text-cosmic-muted mt-0.5">{s.label}</p>
              <p className="text-[10px] text-cosmic-teal mt-1">{s.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* XP Progress + Streak */}
      <div className="grid lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card className="bg-[#0B1022] border-white/5 lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-cosmic-amber" /> XP Progress
              </h3>
              <span className="text-xs text-cosmic-muted">Level {user?.level || 1}</span>
            </div>
            <div className="mb-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-cosmic-amber font-bold">{currentXp} XP</span>
                <span className="text-cosmic-muted">{xpToNext} XP to next level</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cosmic-teal via-cosmic-accent to-cosmic-violet rounded-full transition-all duration-700"
                  style={{ width: `${xpProgress}%` }} />
              </div>
            </div>
            <p className="text-xs text-cosmic-muted">
              {xpToNext - currentXp} XP needed to reach Level {(user?.level || 1) + 1}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0B1022] border-white/5">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-cosmic-amber" /> Daily Streak
            </h3>
            <div className="text-center">
              <div className="text-4xl font-bold font-heading text-gradient-warm mb-1">
                {user?.streak || 0}
              </div>
              <p className="text-xs text-cosmic-muted mb-3">{user?.streak ? 'consecutive days' : 'Start your streak!'}</p>
              <div className="flex items-center justify-center gap-1">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i < (user?.streak || 0) ? 'bg-cosmic-amber/20 text-cosmic-amber' : 'bg-white/5 text-cosmic-muted/50'
                  }`}>
                    {i < (user?.streak || 0) ? <Star className="w-3 h-3" /> : i + 1}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Link href="/dashboard/proposals/new">
          <Card className="bg-[#0B1022] border-white/5 hover:border-cosmic-accent/20 transition-all cursor-pointer group h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cosmic-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-cosmic-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold">Create Proposal</p>
                <p className="text-xs text-cosmic-muted">Draft a new decision</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/games">
          <Card className="bg-[#0B1022] border-white/5 hover:border-cosmic-amber/20 transition-all cursor-pointer group h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cosmic-amber/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-5 h-5 text-cosmic-amber" />
              </div>
              <div>
                <p className="text-sm font-semibold">Play Games</p>
                <p className="text-xs text-cosmic-muted">Earn XP with games</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/assistant">
          <Card className="bg-[#0B1022] border-white/5 hover:border-cosmic-teal/20 transition-all cursor-pointer group h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cosmic-teal/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="w-5 h-5 text-cosmic-teal" />
              </div>
              <div>
                <p className="text-sm font-semibold">Ask AI</p>
                <p className="text-xs text-cosmic-muted">Get governance insights</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/organizations">
          <Card className="bg-[#0B1022] border-white/5 hover:border-cosmic-violet/20 transition-all cursor-pointer group h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cosmic-violet/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5 text-cosmic-violet" />
              </div>
              <div>
                <p className="text-sm font-semibold">Join Org</p>
                <p className="text-xs text-cosmic-muted">Find communities</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Featured Game + Recent Proposals */}
      <div className="grid lg:grid-cols-3 gap-3 sm:gap-6">
        {/* Featured Game Spotlight */}
        <Card className="bg-[#0B1022] border-white/5 lg:col-span-1 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30" style={{
            background: `radial-gradient(circle at 50% 0%, ${featuredGame.accent}15, transparent 60%)`
          }} />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-cosmic-amber" />
              <span className="text-xs font-medium text-cosmic-amber">Featured Game</span>
            </div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto"
              style={{ background: `${featuredGame.accent}15` }}>
              <featuredGame.icon className="w-8 h-8" style={{ color: featuredGame.accent }} />
            </div>
            <h3 className="text-xl font-bold font-heading text-center mb-1">{featuredGame.name}</h3>
            <p className="text-xs text-center mb-4" style={{ color: featuredGame.accent }}>{featuredGame.tagline}</p>
            <Link href={featuredGame.href}>
              <Button className="w-full rounded-xl text-white" style={{ background: featuredGame.accent }}>
                <Gamepad2 className="w-4 h-4 mr-2" /> Play Now
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Proposals */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold font-heading">Recent Proposals</h2>
            <Link href="/dashboard/proposals">
              <Button variant="ghost" size="sm" className="text-cosmic-muted hover:text-white">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {proposals.length === 0 ? (
              <Card className="bg-[#0B1022] border-white/5">
                <CardContent className="p-8 text-center">
                  <FileText className="w-10 h-10 text-cosmic-muted mx-auto mb-3 opacity-50" />
                  <p className="text-cosmic-muted">No proposals yet</p>
                  <Link href="/dashboard/proposals/new">
                    <Button className="mt-3 bg-cosmic-accent text-white" size="sm">Create your first proposal</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : proposals.map(p => (
              <Link key={p.id} href={`/dashboard/proposals/${p.id}`}>
                <Card className="bg-[#0B1022] border-white/5 hover:border-white/10 transition-all mb-2 cursor-pointer group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="min-w-0 flex-grow">
                      <p className="text-sm font-medium truncate group-hover:text-cosmic-accent transition-colors">{p.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-cosmic-teal/10 text-cosmic-teal' : p.status === 'closed' ? 'bg-cosmic-muted/10 text-cosmic-muted' : 'bg-cosmic-amber/10 text-cosmic-amber'}`}>
                          {p.status}
                        </span>
                        {p.organization && <span className="text-xs text-cosmic-muted">{p.organization.name}</span>}
                        <span className="text-xs text-cosmic-muted">{p.votingType.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-cosmic-muted ml-2 sm:ml-4">
                      <span className="flex items-center gap-1"><Vote className="w-3 h-3" />{p._count?.votes || 0}</span>
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
