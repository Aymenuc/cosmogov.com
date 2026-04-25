'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield, Vote, Users, Flame, Eye, AlertTriangle, Crown,
  Star, Trophy, ArrowLeft, Copy, CheckCircle, Loader2,
  BarChart3, Target, Zap, Brain
} from 'lucide-react';

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
}

interface ReputationData {
  score: number;
  tier: string;
  tierColor: string;
  participationScore: number;
  qualityScore: number;
  consistencyScore: number;
  influenceScore: number;
  expertiseScore: number;
  badges: BadgeData[];
  percentile: number;
  totalUsers: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  level: number;
  streak: number;
  score: number;
  tier: string;
}

/* ─── Animated Score Ring ─── */
function ScoreRing({ score, tierColor, tier }: { score: number; tierColor: string; tier: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const progressRef = useRef(0);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return 280;
      const size = Math.min(container.clientWidth, 280);
      const dpr = window.devicePixelRatio || 1;
      c.width = size * dpr;
      c.height = size * dpr;
      c.style.width = `${size}px`;
      c.style.height = `${size}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return size;
    };

    let size = updateSize();

    const handleResize = () => { size = updateSize(); };
    window.addEventListener('resize', handleResize);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.41;
    const lineWidth = Math.max(6, size * 0.029);
    const targetProgress = score / 1000;

    // Sparkle particles
    const sparkles: { angle: number; dist: number; size: number; alpha: number; speed: number; decay: number }[] = [];
    for (let i = 0; i < 30; i++) {
      sparkles.push({
        angle: Math.random() * Math.PI * 2,
        dist: radius + (Math.random() - 0.5) * 30,
        size: Math.random() * 2.5 + 0.5,
        alpha: Math.random(),
        speed: (Math.random() - 0.5) * 0.02,
        decay: Math.random() * 0.02 + 0.005,
      });
    }

    const draw = () => {
      size = updateSize() || size;
      const cx = size / 2;
      const cy = size / 2;
      const radius = size * 0.41;
      const lineWidth = Math.max(6, size * 0.029);
      ctx.clearRect(0, 0, size, size);

      // Background ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Animated progress ring
      if (progressRef.current < targetProgress) {
        progressRef.current = Math.min(progressRef.current + 0.008, targetProgress);
      }

      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (progressRef.current * Math.PI * 2);

      // Gradient for progress arc
      const gradient = ctx.createConicGradient(startAngle, cx, cy);
      gradient.addColorStop(0, tierColor);
      gradient.addColorStop(0.5, `${tierColor}88`);
      gradient.addColorStop(1, tierColor);

      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Glow effect on progress ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.strokeStyle = tierColor;
      ctx.lineWidth = lineWidth + 6;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.15;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Sparkle particles
      for (const s of sparkles) {
        s.angle += s.speed;
        s.alpha -= s.decay;
        if (s.alpha <= 0) {
          s.alpha = Math.random() * 0.8 + 0.2;
          s.angle = endAngle + (Math.random() - 0.5) * 0.5;
          s.dist = radius + (Math.random() - 0.5) * 25;
        }

        const px = cx + Math.cos(s.angle) * s.dist;
        const py = cy + Math.sin(s.angle) * s.dist;

        ctx.beginPath();
        ctx.arc(px, py, s.size, 0, Math.PI * 2);
        ctx.fillStyle = tierColor;
        ctx.globalAlpha = s.alpha * 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [score, tierColor]);

  return (
    <div ref={containerRef} className="w-full max-w-[280px] mx-auto">
      <div className="relative inline-flex items-center justify-center w-full">
        <canvas ref={canvasRef} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl sm:text-5xl font-bold font-heading text-white" style={{ textShadow: `0 0 40px ${tierColor}40` }}>
            {score}
          </span>
          <span className="text-xs text-cosmic-muted mt-1">/ 1000</span>
          <div
            className="mt-3 px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold tracking-widest"
            style={{
              background: `${tierColor}15`,
              color: tierColor,
              border: `1px solid ${tierColor}30`,
              boxShadow: `0 0 20px ${tierColor}20`,
            }}
          >
            {tier.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Score Bar ─── */
function ScoreBar({ label, score, icon: Icon, color }: { label: string; score: number; icon: React.ElementType; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color }} />
          <span className="text-sm text-white font-medium">{label}</span>
        </div>
        <span className="text-sm font-bold font-heading" style={{ color }}>{Math.round(score)}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%`, background: `linear-gradient(90deg, ${color}60, ${color})`, boxShadow: `0 0 10px ${color}30` }}
        />
      </div>
    </div>
  );
}

/* ─── Badge Icon Mapper ─── */
function getBadgeIcon(iconId: string) {
  const map: Record<string, React.ElementType> = {
    vote: Vote,
    flame: Flame,
    eye: Eye,
    users: Users,
    shield: Shield,
    'alert-triangle': AlertTriangle,
    crown: Crown,
    star: Star,
  };
  return map[iconId] || Star;
}

/* ─── Main Page ─── */
export default function ReputationPage() {
  const [data, setData] = useState<ReputationData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/reputation')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); setLoading(false); })
      .catch(() => setLoading(false));

    fetch('/api/reputation/leaderboard')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setLeaderboard(d.leaderboard || []); })
      .catch(() => {});
  }, []);

  const handleShare = () => {
    if (!data) return;
    const text = `🌌 My Cosmic Reputation on CosmoGov:\n\n✨ Score: ${data.score}/1000\n🏆 Tier: ${data.tier}\n📊 Top ${100 - data.percentile}% of governance participants\n\nEarn your own cosmic score at cosmogov.io`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-cosmic-accent/30 border-t-cosmic-accent animate-spin" />
          <span className="text-cosmic-muted text-sm">Calculating your cosmic footprint...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Star className="w-12 h-12 text-cosmic-muted mx-auto mb-4 opacity-30" />
          <p className="text-cosmic-muted">Unable to load reputation data</p>
          <Link href="/dashboard"><Button variant="ghost" className="mt-4 text-cosmic-accent">Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const scoreBreakdown = [
    { label: 'Participation', score: data.participationScore, icon: Vote, color: '#2EE6C7' },
    { label: 'Vote Quality', score: data.qualityScore, icon: Target, color: '#2D6BFF' },
    { label: 'Consistency', score: data.consistencyScore, icon: Flame, color: '#FFB547' },
    { label: 'Influence', score: data.influenceScore, icon: Zap, color: '#9B5CFF' },
    { label: 'Expertise', score: data.expertiseScore, icon: Brain, color: '#FF5E8A' },
  ];

  const topLeaderboard = leaderboard.slice(0, 5);
  const userRank = leaderboard.findIndex(e => e.userId === data.score.toString());

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-cosmic-muted hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cosmic-amber/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-cosmic-amber" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading">Cosmic Reputation</h1>
            <p className="text-cosmic-muted text-sm">Your portable governance credit score across the cosmos</p>
          </div>
        </div>
      </div>

      {/* Score Hero */}
      <Card className="bg-[#0B1022] border-white/5 mb-8 overflow-hidden">
        <CardContent className="p-4 sm:p-8 flex flex-col items-center">
          <div className="mb-6" style={{ animation: 'scaleIn 0.6s ease-out' }}>
            <ScoreRing score={data.score} tierColor={data.tierColor} tier={data.tier} />
          </div>
          <p className="text-cosmic-muted text-sm mb-6 text-center max-w-md">
            Your Cosmic Reputation is a weighted blend of participation, vote quality, consistency, influence, and game expertise.
          </p>
          <div className="flex items-center gap-3">
            <Button onClick={handleShare} className="bg-cosmic-accent hover:bg-cosmic-accent/90 text-white rounded-xl">
              {copied ? <><CheckCircle className="w-4 h-4 mr-2" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Share Your Cosmic Score</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Score Breakdown */}
        <Card className="bg-[#0B1022] border-white/5 lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold font-heading mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cosmic-teal" /> Score Breakdown
            </h3>
            <div className="space-y-5">
              {scoreBreakdown.map(s => (
                <ScoreBar key={s.label} label={s.label} score={s.score} icon={s.icon} color={s.color} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ranking */}
        <Card className="bg-[#0B1022] border-white/5">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-cosmic-amber" /> Your Ranking
            </h3>
            <div className="text-center mb-4">
              <p className="text-3xl font-bold font-heading" style={{ color: data.tierColor }}>
                Top {100 - data.percentile}%
              </p>
              <p className="text-cosmic-muted text-sm mt-1">of governance participants</p>
            </div>
            <div className="space-y-2">
              <div className="h-px bg-white/5 my-3" />
              <p className="text-xs text-cosmic-muted uppercase tracking-wider mb-2">Top 5 Leaders</p>
              {topLeaderboard.map((entry) => (
                <div key={entry.rank} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                  <span className={`text-sm font-bold w-6 text-center ${entry.rank === 1 ? 'text-cosmic-amber' : entry.rank === 2 ? 'text-cosmic-muted' : entry.rank === 3 ? 'text-cosmic-amber/60' : 'text-cosmic-muted/50'}`}>
                    {entry.rank}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-cosmic-accent/20 flex items-center justify-center text-xs font-bold text-cosmic-accent">
                    {entry.name[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-grow">
                    <p className="text-sm font-medium truncate">{entry.name}</p>
                    <p className="text-xs text-cosmic-muted">Lv.{entry.level}</p>
                  </div>
                  <span className="text-sm font-bold font-heading" style={{ color: getTierColorLocal(entry.tier) }}>{entry.score}</span>
                </div>
              ))}
              {topLeaderboard.length === 0 && (
                <p className="text-xs text-cosmic-muted text-center py-4">No leaderboard data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges Section */}
      <Card className="bg-[#0B1022] border-white/5">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold font-heading mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cosmic-violet" /> Achievement Badges
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {data.badges.map(badge => {
              const BadgeIcon = getBadgeIcon(badge.icon);
              return (
                <div
                  key={badge.id}
                  className={`relative p-4 rounded-xl text-center transition-all duration-300 ${
                    badge.earned
                      ? 'bg-gradient-to-b from-cosmic-accent/10 to-transparent border border-cosmic-accent/20 hover:scale-105'
                      : 'bg-white/[0.02] border border-white/5 opacity-40'
                  }`}
                >
                  {badge.earned && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cosmic-teal flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${badge.earned ? 'bg-cosmic-accent/20' : 'bg-white/5'}`}>
                    <BadgeIcon className={`w-5 h-5 ${badge.earned ? 'text-cosmic-accent' : 'text-cosmic-muted/30'}`} />
                  </div>
                  <p className={`text-xs font-semibold ${badge.earned ? 'text-white' : 'text-cosmic-muted/40'}`}>{badge.name}</p>
                  <p className={`text-[10px] mt-1 ${badge.earned ? 'text-cosmic-muted' : 'text-cosmic-muted/30'}`}>{badge.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getTierColorLocal(tier: string): string {
  switch (tier) {
    case 'Stardust': return '#A7B3D6';
    case 'Nova': return '#2EE6C7';
    case 'Pulsar': return '#9B5CFF';
    case 'Quasar': return '#FFB547';
    case 'Nebula': return '#FF5E8A';
    default: return '#A7B3D6';
  }
}
