'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity, ArrowLeft, Vote, FileText, Users, Zap,
  Clock, TrendingUp, TrendingDown, Minus, Loader2,
  CheckCircle, XCircle, Flame, AlertCircle, MessageSquare
} from 'lucide-react';

interface PulseData {
  sentiment: { score: number; mood: string; moodColor: string };
  metrics: {
    activeProposals: number;
    totalVotes: number;
    votesPerHour: number;
    participationRate: number;
    totalUsers: number;
  };
  proposals: { id: string; title: string; voteCount: number; status: string }[];
  activityFeed: {
    id: string;
    type: 'vote' | 'proposal' | 'pass' | 'streak';
    description: string;
    detail: string;
    timestamp: string;
  }[];
}

/* ─── Nebula Canvas ─── */
function PulseNebula({ sentiment }: { sentiment: { score: number; mood: string; moodColor: string } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const sentimentRef = useRef(sentiment.score);

  useEffect(() => {
    sentimentRef.current = sentiment.score;
  }, [sentiment.score]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let width = c.parentElement?.clientWidth || 800;
    let height = Math.min(400, window.innerHeight * 0.4);
    c.width = width * dpr;
    c.height = height * dpr;
    c.style.width = `${width}px`;
    c.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const resize = () => {
      width = c.parentElement?.clientWidth || 800;
      height = Math.min(400, window.innerHeight * 0.4);
      c.width = width * dpr;
      c.height = height * dpr;
      c.style.width = `${width}px`;
      c.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', resize);

    // Particle system
    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      size: number; baseSize: number;
      color: string;
      alpha: number;
      life: number;
      maxLife: number;
      type: 'positive' | 'negative' | 'neutral';
      trail: { x: number; y: number; alpha: number }[];
    }

    const particles: Particle[] = [];
    const maxParticles = 120;

    const getColor = (type: Particle['type']): string => {
      if (type === 'positive') return '#2EE6C7';
      if (type === 'negative') return '#FF5E8A';
      return '#9B5CFF';
    };

    const spawnParticle = (): Particle => {
      const sent = sentimentRef.current;
      let type: Particle['type'] = 'neutral';
      const rand = Math.random() * 100;
      if (rand < sent) type = 'positive';
      else if (rand < sent + (100 - sent) / 2) type = 'negative';
      else type = 'neutral';

      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 80 + 30;
      const cx = width / 2;
      const cy = height / 2;

      return {
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 3 + 1.5,
        baseSize: Math.random() * 3 + 1.5,
        color: getColor(type),
        alpha: 0,
        life: 0,
        maxLife: Math.random() * 300 + 150,
        type,
        trail: [],
      };
    };

    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
      const p = spawnParticle();
      p.life = Math.random() * p.maxLife;
      p.alpha = Math.random() * 0.7;
      particles.push(p);
    }

    let rotation = 0;

    const draw = () => {
      ctx.fillStyle = 'rgba(4, 5, 11, 0.15)';
      ctx.fillRect(0, 0, width, height);

      rotation += 0.001;

      const cx = width / 2;
      const cy = height / 2;

      // Draw center nebula glow
      const sent = sentimentRef.current;
      const glowColor = sent > 60 ? 'rgba(46,230,199,' : sent > 40 ? 'rgba(155,92,255,' : 'rgba(255,94,138,';
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 150);
      gradient.addColorStop(0, `${glowColor}0.08)`);
      gradient.addColorStop(0.5, `${glowColor}0.03)`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Orbital motion
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Gentle orbital force
        const orbitalSpeed = 0.002 + (100 - dist) * 0.00001;
        p.vx += Math.cos(angle + Math.PI / 2) * orbitalSpeed;
        p.vy += Math.sin(angle + Math.PI / 2) * orbitalSpeed;

        // Damping
        p.vx *= 0.998;
        p.vy *= 0.998;

        p.x += p.vx;
        p.y += p.vy;

        // Life cycle
        p.life++;
        const lifeRatio = p.life / p.maxLife;

        // Pulse size
        p.size = p.baseSize * (1 + Math.sin(p.life * 0.05) * 0.3);

        if (lifeRatio < 0.1) p.alpha = lifeRatio * 7;
        else if (lifeRatio > 0.8) p.alpha = (1 - lifeRatio) * 5;
        else p.alpha = 0.7 + Math.sin(p.life * 0.03) * 0.2;

        // Trail
        if (p.life % 3 === 0) {
          p.trail.push({ x: p.x, y: p.y, alpha: p.alpha * 0.3 });
          if (p.trail.length > 8) p.trail.shift();
        }

        // Respawn
        if (p.life >= p.maxLife) {
          particles[i] = spawnParticle();
          continue;
        }

        // Draw trail
        for (const t of p.trail) {
          t.alpha *= 0.9;
          ctx.beginPath();
          ctx.arc(t.x, t.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = t.alpha * 0.3;
          ctx.fill();
        }

        // Draw particle
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Glow
        ctx.globalAlpha = p.alpha * 0.15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/5" style={{ background: '#04050b' }}>
      <canvas ref={canvasRef} className="w-full" style={{ height: '260px' }} />
      <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#2EE6C7]" />
          <span className="text-[10px] text-cosmic-muted">Positive</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#FF5E8A]" />
          <span className="text-[10px] text-cosmic-muted">Negative</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#9B5CFF]" />
          <span className="text-[10px] text-cosmic-muted">Neutral</span>
        </div>
      </div>
      <div className="absolute top-4 right-4">
        <div className="cosmic-badge rounded-full px-3 py-1 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-cosmic-teal animate-pulse" />
          <span className="text-[10px] font-medium text-cosmic-teal">LIVE</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Activity Event Icon ─── */
function getEventIcon(type: string) {
  switch (type) {
    case 'vote': return Vote;
    case 'proposal': return FileText;
    case 'pass': return CheckCircle;
    case 'streak': return Flame;
    default: return AlertCircle;
  }
}

function getEventColor(type: string): string {
  switch (type) {
    case 'vote': return '#2D6BFF';
    case 'proposal': return '#9B5CFF';
    case 'pass': return '#2EE6C7';
    case 'streak': return '#FFB547';
    default: return '#A7B3D6';
  }
}

/* ─── Main Page ─── */
export default function PulsePage() {
  const [data, setData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pulse')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-cosmic-violet/30 border-t-cosmic-violet animate-spin" />
          <span className="text-cosmic-muted text-sm">Scanning the governance cosmos...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Activity className="w-12 h-12 text-cosmic-muted mx-auto mb-4 opacity-30" />
          <p className="text-cosmic-muted">Unable to load pulse data</p>
          <Link href="/dashboard"><Button variant="ghost" className="mt-4 text-cosmic-accent">Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

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
          <div className="w-10 h-10 rounded-xl bg-cosmic-violet/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-cosmic-violet" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading">Governance Pulse</h1>
            <p className="text-cosmic-muted text-sm">Real-time community sentiment and activity visualization</p>
          </div>
        </div>
      </div>

      {/* Nebula Visualization */}
      <div className="mb-8">
        <PulseNebula sentiment={data.sentiment} />
      </div>

      {/* Sentiment Indicator Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card className="bg-[#0B1022] border-white/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${data.sentiment.moodColor}15` }}>
                {data.sentiment.score > 60 ? <TrendingUp className="w-4 h-4" style={{ color: data.sentiment.moodColor }} /> :
                 data.sentiment.score < 40 ? <TrendingDown className="w-4 h-4" style={{ color: data.sentiment.moodColor }} /> :
                 <Minus className="w-4 h-4" style={{ color: data.sentiment.moodColor }} />}
              </div>
            </div>
            <p className="text-lg font-bold font-heading" style={{ color: data.sentiment.moodColor }}>{data.sentiment.mood}</p>
            <p className="text-xs text-cosmic-muted">Community Mood</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0B1022] border-white/5">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-cosmic-violet/10 flex items-center justify-center mb-2">
              <FileText className="w-4 h-4 text-cosmic-violet" />
            </div>
            <p className="text-2xl font-bold font-heading">{data.metrics.activeProposals}</p>
            <p className="text-xs text-cosmic-muted">Active Proposals</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0B1022] border-white/5">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-cosmic-amber/10 flex items-center justify-center mb-2">
              <Zap className="w-4 h-4 text-cosmic-amber" />
            </div>
            <p className="text-2xl font-bold font-heading">{data.metrics.votesPerHour}</p>
            <p className="text-xs text-cosmic-muted">Votes / Hour</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0B1022] border-white/5">
          <CardContent className="p-4">
            <div className="w-8 h-8 rounded-lg bg-cosmic-teal/10 flex items-center justify-center mb-2">
              <Users className="w-4 h-4 text-cosmic-teal" />
            </div>
            <p className="text-2xl font-bold font-heading">{data.metrics.participationRate}%</p>
            <p className="text-xs text-cosmic-muted">Participation Rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-3 sm:gap-6">
        {/* Live Activity Feed */}
        <Card className="bg-[#0B1022] border-white/5 lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cosmic-teal" /> Live Activity Feed
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
              {data.activityFeed.map((event, i) => {
                const EventIcon = getEventIcon(event.type);
                const color = getEventColor(event.type);
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                    style={{ animation: `slideUp 0.3s ease-out ${i * 0.05}s both` }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                      <EventIcon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="min-w-0 flex-grow">
                      <p className="text-sm text-white">{event.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] border-white/10" style={{ color }}>
                          {event.detail}
                        </Badge>
                        <span className="text-[10px] text-cosmic-muted">
                          {formatTimeAgo(event.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {data.activityFeed.length === 0 && (
                <div className="py-12 text-center text-cosmic-muted">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Proposals Sidebar */}
        <Card className="bg-[#0B1022] border-white/5">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cosmic-amber" /> Active Proposals
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              {data.proposals.map(p => (
                <Link key={p.id} href={`/dashboard/proposals/${p.id}`}>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer mb-2">
                    <p className="text-sm font-medium text-white mb-1 line-clamp-2">{p.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] border-cosmic-teal/20 text-cosmic-teal">{p.status}</Badge>
                      <span className="text-[10px] text-cosmic-muted">{p.voteCount} votes</span>
                    </div>
                  </div>
                </Link>
              ))}
              {data.proposals.length === 0 && (
                <p className="text-xs text-cosmic-muted text-center py-6">No active proposals</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
