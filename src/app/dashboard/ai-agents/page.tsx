'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bot, Sparkles, ArrowRight, Users, MessageSquare,
  CheckCircle2, Radio, Shield, Star, Zap, Eye,
  Globe, Accessibility, Brain, Handshake, Loader2,
  ChevronRight, Activity, Circle, ArrowUpRight,
  Waves
} from 'lucide-react';

/* ── Types ── */

interface AvatarConfig {
  primaryColor: string;
  secondaryColor: string;
  shape: string;
  glowColor: string;
  particleEffect: string;
}

interface Agent {
  id: string;
  type: string;
  name: string;
  description: string;
  personality: string;
  capabilities: string;
  avatarConfig: string;
  systemPrompt: string;
  isActive: boolean;
}

interface DebateSession {
  id: string;
  title: string;
  topic: string;
  status: string;
  phase: string;
  consensusLevel: number;
  energyLevel: number;
  participantCount: number;
  participants: { id: string; displayName: string; role: string; agentType: string | null }[];
  _count: { messages: number };
  createdAt: string;
}

/* ── Agent type icon map ── */

const typeIcons: Record<string, typeof Bot> = {
  moderator: Shield,
  facilitator: Star,
  summarizer: Brain,
  consensus: Handshake,
  translator: Globe,
  accessibility: Accessibility,
};

const typeLabels: Record<string, string> = {
  moderator: 'Moderator',
  facilitator: 'Facilitator',
  summarizer: 'Summarizer',
  consensus: 'Consensus Builder',
  translator: 'Translator',
  accessibility: 'Accessibility',
};

/* ── CSS Avatar Components ── */

function NexusAvatar({ config }: { config: AvatarConfig }) {
  return (
    <div className="relative w-16 h-16 sm:w-[120px] sm:h-[120px] mx-auto" style={{ animation: 'floatDrift 4s ease-in-out infinite' }}>
      {/* Glow */}
      <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${config.glowColor}, transparent 70%)`, animation: 'pulseGlow 3s ease-in-out infinite' }} />
      {/* Hexagonal Shield */}
      <div className="absolute inset-[15%] flex items-center justify-center">
        <svg viewBox="0 0 120 120" className="w-full h-full" style={{ filter: `drop-shadow(0 0 12px ${config.primaryColor})` }}>
          <polygon
            points="60,8 105,30 105,90 60,112 15,90 15,30"
            fill={`${config.primaryColor}20`}
            stroke={config.primaryColor}
            strokeWidth="2"
          />
          <polygon
            points="60,20 93,36 93,84 60,100 27,84 27,36"
            fill={`${config.primaryColor}10`}
            stroke={config.secondaryColor}
            strokeWidth="1"
            strokeDasharray="4 4"
            style={{ animation: 'orbitSpin 20s linear infinite', transformOrigin: '60px 60px' }}
          />
        </svg>
      </div>
      {/* Orbital Rings */}
      <div className="absolute inset-0" style={{ animation: 'orbitSpin 8s linear infinite' }}>
        <div className="absolute inset-[8%] rounded-full border" style={{ borderColor: `${config.primaryColor}40` }} />
      </div>
      <div className="absolute inset-0" style={{ animation: 'orbitSpin 12s linear infinite reverse' }}>
        <div className="absolute inset-[2%] rounded-full border" style={{ borderColor: `${config.secondaryColor}25` }} />
      </div>
      {/* Orbital dots */}
      <div className="absolute inset-0" style={{ animation: 'orbitSpin 6s linear infinite' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{ background: config.primaryColor, boxShadow: `0 0 8px ${config.primaryColor}` }} />
      </div>
      <div className="absolute inset-0" style={{ animation: 'orbitSpin 6s linear infinite', animationDelay: '-2s' }}>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ background: config.secondaryColor, boxShadow: `0 0 6px ${config.secondaryColor}` }} />
      </div>
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Shield className="w-6 h-6" style={{ color: config.primaryColor }} />
      </div>
    </div>
  );
}

function LumenAvatar({ config }: { config: AvatarConfig }) {
  return (
    <div className="relative w-16 h-16 sm:w-[120px] sm:h-[120px] mx-auto" style={{ animation: 'floatDrift 5s ease-in-out infinite' }}>
      {/* Glow */}
      <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${config.glowColor}, transparent 70%)`, animation: 'pulseGlow 2.5s ease-in-out infinite' }} />
      {/* Star burst rays */}
      <div className="absolute inset-0" style={{ animation: 'orbitSpin 15s linear infinite' }}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{
              width: '2px',
              height: i % 2 === 0 ? '50px' : '35px',
              background: `linear-gradient(to top, transparent, ${i % 2 === 0 ? config.primaryColor : config.secondaryColor})`,
              transform: `translate(-50%, -100%) rotate(${angle}deg)`,
              transformOrigin: '50% 100%',
              borderRadius: '1px',
              animation: `starPulse ${1.5 + i * 0.2}s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      {/* Center star */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${config.primaryColor}30`, boxShadow: `0 0 20px ${config.glowColor}` }}>
          <Star className="w-5 h-5" style={{ color: config.primaryColor, animation: 'starPulse 2s ease-in-out infinite' }} />
        </div>
      </div>
      {/* Sparkle particles */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: config.secondaryColor,
            boxShadow: `0 0 4px ${config.secondaryColor}`,
            top: `${20 + Math.sin(i * 1.3) * 30}%`,
            left: `${50 + Math.cos(i * 1.7) * 35}%`,
            animation: `starPulse ${1.2 + i * 0.3}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}

function SynthesisAvatar({ config }: { config: AvatarConfig }) {
  return (
    <div className="relative w-16 h-16 sm:w-[120px] sm:h-[120px] mx-auto" style={{ animation: 'floatDrift 6s ease-in-out infinite' }}>
      {/* Glow */}
      <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${config.glowColor}, transparent 70%)`, animation: 'pulseGlow 3.5s ease-in-out infinite' }} />
      {/* Swirling nebula layers */}
      <div className="absolute inset-[10%] rounded-full" style={{ background: `radial-gradient(ellipse at 30% 40%, ${config.primaryColor}40, transparent 60%), radial-gradient(ellipse at 70% 60%, ${config.secondaryColor}30, transparent 60%)`, animation: 'nebulaDrift 8s ease-in-out infinite alternate', filter: 'blur(4px)' }} />
      <div className="absolute inset-[15%] rounded-full" style={{ background: `radial-gradient(ellipse at 60% 30%, ${config.primaryColor}25, transparent 50%), radial-gradient(ellipse at 40% 70%, ${config.secondaryColor}20, transparent 55%)`, animation: 'nebulaDrift 6s ease-in-out infinite alternate-reverse', filter: 'blur(3px)' }} />
      {/* Cosmic dust particles */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            background: i % 2 === 0 ? config.primaryColor : config.secondaryColor,
            boxShadow: `0 0 ${3 + i}px ${i % 2 === 0 ? config.primaryColor : config.secondaryColor}80`,
            top: `${25 + Math.sin(i * 0.9) * 25}%`,
            left: `${50 + Math.cos(i * 1.1) * 30}%`,
            animation: `floatDrift ${3 + i * 0.5}s ease-in-out infinite, starPulse ${2 + i * 0.3}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
      {/* Center brain icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${config.primaryColor}25`, boxShadow: `0 0 15px ${config.glowColor}` }}>
          <Brain className="w-4 h-4" style={{ color: config.primaryColor }} />
        </div>
      </div>
    </div>
  );
}

function ConcordAvatar({ config }: { config: AvatarConfig }) {
  return (
    <div className="relative w-16 h-16 sm:w-[120px] sm:h-[120px] mx-auto" style={{ animation: 'floatDrift 4.5s ease-in-out infinite' }}>
      {/* Glow */}
      <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${config.glowColor}, transparent 70%)`, animation: 'pulseGlow 3s ease-in-out infinite' }} />
      {/* Constellation nodes */}
      {[
        { x: 50, y: 20 }, { x: 25, y: 45 }, { x: 75, y: 45 },
        { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 50, y: 50 },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute w-2.5 h-2.5 rounded-full"
          style={{
            background: i === 5 ? config.primaryColor : config.secondaryColor,
            boxShadow: `0 0 ${i === 5 ? 10 : 6}px ${i === 5 ? config.primaryColor : config.secondaryColor}`,
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: 'translate(-50%, -50%)',
            animation: 'starPulse 2s ease-in-out infinite',
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
      {/* Connecting lines (SVG) */}
      <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
        {[
          [50, 20, 25, 45], [50, 20, 75, 45], [25, 45, 35, 75],
          [75, 45, 65, 75], [35, 75, 65, 75], [50, 50, 50, 20],
          [50, 50, 25, 45], [50, 50, 75, 45], [50, 50, 35, 75], [50, 50, 65, 75],
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={config.primaryColor}
            strokeWidth="0.8"
            opacity="0.3"
            style={{ animation: 'pulseGlow 3s ease-in-out infinite', animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </svg>
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translateY(-2px)' }}>
        <Handshake className="w-4 h-4" style={{ color: config.primaryColor, filter: `drop-shadow(0 0 4px ${config.primaryColor})` }} />
      </div>
    </div>
  );
}

function BabelAvatar({ config }: { config: AvatarConfig }) {
  const rainbowColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
  return (
    <div className="relative w-16 h-16 sm:w-[120px] sm:h-[120px] mx-auto" style={{ animation: 'floatDrift 5s ease-in-out infinite' }}>
      {/* Glow */}
      <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${config.glowColor}, transparent 70%)`, animation: 'pulseGlow 2.8s ease-in-out infinite' }} />
      {/* Prism shape */}
      <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full" style={{ filter: `drop-shadow(0 0 10px ${config.primaryColor}60)` }}>
        <polygon
          points="60,15 100,95 20,95"
          fill={`${config.primaryColor}15`}
          stroke={config.primaryColor}
          strokeWidth="1.5"
        />
        {/* Rainbow refraction lines coming out of prism */}
        {rainbowColors.map((color, i) => (
          <line
            key={i}
            x1="85"
            y1={55 + i * 5}
            x2="115"
            y2={30 + i * 12}
            stroke={color}
            strokeWidth="1.5"
            opacity="0.6"
            style={{ animation: `starPulse ${2 + i * 0.2}s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </svg>
      {/* Light refraction glow dots */}
      {rainbowColors.map((color, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: color,
            boxShadow: `0 0 6px ${color}`,
            right: `${5 + i * 2}%`,
            top: `${25 + i * 9}%`,
            animation: 'starPulse 2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translateY(8px)' }}>
        <Globe className="w-5 h-5" style={{ color: config.primaryColor, animation: 'orbitSpin 10s linear infinite' }} />
      </div>
    </div>
  );
}

function AegisAvatar({ config }: { config: AvatarConfig }) {
  return (
    <div className="relative w-16 h-16 sm:w-[120px] sm:h-[120px] mx-auto" style={{ animation: 'floatDrift 5.5s ease-in-out infinite' }}>
      {/* Warm aura outer */}
      <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${config.glowColor}, transparent 65%)`, animation: 'pulseGlow 3s ease-in-out infinite' }} />
      {/* Warm aura layers */}
      <div className="absolute inset-[10%] rounded-full" style={{ border: `1.5px solid ${config.primaryColor}30`, animation: 'pulseGlow 2.5s ease-in-out infinite' }} />
      <div className="absolute inset-[20%] rounded-full" style={{ border: `1px solid ${config.secondaryColor}20`, animation: 'pulseGlow 3s ease-in-out infinite', animationDelay: '0.5s' }} />
      {/* Shield shape */}
      <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full" style={{ filter: `drop-shadow(0 0 15px ${config.glowColor})` }}>
        <path
          d="M60 15 L95 35 L95 70 Q95 95 60 108 Q25 95 25 70 L25 35 Z"
          fill={`${config.primaryColor}20`}
          stroke={config.primaryColor}
          strokeWidth="1.5"
        />
        <path
          d="M60 25 L85 40 L85 68 Q85 88 60 98 Q35 88 35 68 L35 40 Z"
          fill={`${config.secondaryColor}10`}
          stroke={config.secondaryColor}
          strokeWidth="0.8"
          strokeDasharray="3 3"
          style={{ animation: 'orbitSpin 25s linear infinite', transformOrigin: '60px 60px' }}
        />
      </svg>
      {/* Warm floating particles */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: config.secondaryColor,
            boxShadow: `0 0 6px ${config.secondaryColor}`,
            top: `${30 + Math.sin(i * 1.5) * 20}%`,
            left: `${50 + Math.cos(i * 1.8) * 25}%`,
            animation: `floatDrift ${3 + i * 0.5}s ease-in-out infinite, starPulse ${2 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Accessibility className="w-5 h-5" style={{ color: config.primaryColor, filter: `drop-shadow(0 0 6px ${config.primaryColor})` }} />
      </div>
    </div>
  );
}

/* ── Avatar renderer ── */

function AgentAvatar({ agent }: { agent: Agent }) {
  let config: AvatarConfig;
  try {
    config = JSON.parse(agent.avatarConfig);
  } catch {
    config = { primaryColor: '#6366f1', secondaryColor: '#818cf8', shape: 'default', glowColor: 'rgba(99,102,241,0.4)', particleEffect: 'default' };
  }

  switch (agent.type) {
    case 'moderator':
      return <NexusAvatar config={config} />;
    case 'facilitator':
      return <LumenAvatar config={config} />;
    case 'summarizer':
      return <SynthesisAvatar config={config} />;
    case 'consensus':
      return <ConcordAvatar config={config} />;
    case 'translator':
      return <BabelAvatar config={config} />;
    case 'accessibility':
      return <AegisAvatar config={config} />;
    default:
      return (
        <div className="w-16 h-16 sm:w-[120px] sm:h-[120px] mx-auto rounded-full flex items-center justify-center" style={{ background: `${config.primaryColor}20` }}>
          <Bot className="w-8 h-8" style={{ color: config.primaryColor }} />
        </div>
      );
  }
}

/* ── Main Page ── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function AIAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [debates, setDebates] = useState<DebateSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentsRes, debatesRes] = await Promise.all([
          fetch('/api/ai/agents'),
          fetch('/api/ai/debate?status=active'),
        ]);
        const agentsData = await agentsRes.json();
        const debatesData = await debatesRes.json();
        setAgents(Array.isArray(agentsData) ? agentsData : []);
        setDebates(Array.isArray(debatesData) ? debatesData : []);
      } catch {
        setAgents([]);
        setDebates([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ── Computed stats ── */
  const activeAgents = agents.filter(a => a.isActive).length;
  const activeDebates = debates.filter(d => d.status === 'active').length;
  const totalMessages = debates.reduce((sum, d) => sum + (d._count?.messages || 0), 0);
  const avgConsensus = debates.length > 0
    ? Math.round(debates.reduce((sum, d) => sum + (d.consensusLevel || 0), 0) / debates.length * 100)
    : 0;

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-cosmic-accent/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cosmic-accent" style={{ animation: 'orbitSpin 1s linear infinite' }} />
            <div className="absolute inset-2 rounded-full border border-transparent border-t-cosmic-teal" style={{ animation: 'orbitSpin 1.5s linear infinite reverse' }} />
            <Bot className="absolute inset-0 m-auto w-6 h-6 text-cosmic-accent" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cosmic-accent animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-cosmic-teal animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-cosmic-violet animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-cosmic-muted text-sm">Initializing AI Agents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl glass-card p-4 sm:p-6 md:p-8 lg:p-10">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(46,230,199,0.08), transparent 70%)' }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="cosmic-badge rounded-full px-3 py-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cosmic-accent" />
              <span className="text-xs font-medium text-cosmic-accent">AI-Powered Governance</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-heading mb-3">
            <span className="text-gradient">AI Agents</span>
          </h1>
          <p className="text-cosmic-muted text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed">
            Six specialized AI agents power your democratic assemblies — moderating debates, facilitating dialogue,
            synthesizing positions, building consensus, breaking language barriers, and ensuring accessibility for all.
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-6">
            <Link href="/dashboard/participation/assemblies">
              <Button className="bg-cosmic-accent text-white rounded-xl">
                <Users className="w-4 h-4 mr-2" /> Enter Assembly Hall
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" className="border-white/10 text-cosmic-muted hover:text-white hover:border-white/20 rounded-xl">
                How It Works <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Agents', value: agents.length || 6, icon: Bot, color: 'text-cosmic-accent', bg: 'bg-cosmic-accent/10', sub: `${activeAgents} active` },
          { label: 'Active Debates', value: activeDebates, icon: MessageSquare, color: 'text-cosmic-teal', bg: 'bg-cosmic-teal/10', sub: 'live now' },
          { label: 'Messages Facilitated', value: totalMessages, icon: Zap, color: 'text-cosmic-amber', bg: 'bg-cosmic-amber/10', sub: 'by AI agents' },
          { label: 'Consensus Reached', value: avgConsensus, icon: CheckCircle2, color: 'text-cosmic-success', bg: 'bg-cosmic-success/10', sub: 'avg. level %' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-[#0B1022] border-white/5 hover:border-white/10 transition-all group">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold font-heading">{stat.value}</p>
                <p className="text-xs text-cosmic-muted mt-0.5">{stat.label}</p>
                <p className="text-[10px] text-cosmic-teal mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Agent Cards Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold font-heading">Meet the Agents</h2>
            <p className="text-sm text-cosmic-muted mt-1">Each agent has a unique cosmic form and specialized capabilities</p>
          </div>
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {agents.map((agent) => {
            let capabilities: string[] = [];
            try { capabilities = JSON.parse(agent.capabilities); } catch { capabilities = []; }

            const Icon = typeIcons[agent.type] || Bot;
            const label = typeLabels[agent.type] || agent.type;

            return (
              <motion.div key={agent.id} variants={cardVariants}>
                <Card className="bg-[#0B1022] border-white/5 hover:border-white/10 transition-all group h-full overflow-hidden">
                  <CardContent className="p-6">
                    {/* Avatar */}
                    <div className="mb-5">
                      <AgentAvatar agent={agent} />
                    </div>

                    {/* Name + Badge */}
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <h3 className="text-lg font-bold font-heading">{agent.name}</h3>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0 rounded-full border-white/10"
                          style={{
                            color: JSON.parse(agent.avatarConfig || '{}').primaryColor || '#6366f1',
                            borderColor: `${JSON.parse(agent.avatarConfig || '{}').primaryColor || '#6366f1'}40`,
                            background: `${JSON.parse(agent.avatarConfig || '{}').primaryColor || '#6366f1'}10`,
                          }}
                        >
                          <Icon className="w-2.5 h-2.5 mr-1" />
                          {label}
                        </Badge>
                      </div>
                      {/* Status indicator */}
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-cosmic-success' : 'bg-cosmic-muted/50'}`} style={agent.isActive ? { boxShadow: '0 0 6px rgba(52, 211, 153, 0.6)', animation: 'pulseGlow 2s ease-in-out infinite' } : {}} />
                        <span className="text-[10px] text-cosmic-muted">{agent.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-cosmic-muted leading-relaxed mb-4">{agent.description}</p>

                    {/* Capabilities */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-cosmic-muted"
                        >
                          {cap.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ))}
                    </div>

                    {/* View in Assembly button */}
                    <Link href="/dashboard/participation/assemblies" className="block">
                      <Button
                        variant="outline"
                        className="w-full border-white/10 text-cosmic-muted hover:text-white hover:border-white/20 rounded-xl group/btn"
                      >
                        <Radio className="w-3.5 h-3.5 mr-2" style={{ color: JSON.parse(agent.avatarConfig || '{}').primaryColor }} />
                        View in Assembly
                        <ArrowUpRight className="w-3 h-3 ml-1.5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── How It Works Section ── */}
      <div id="how-it-works" className="scroll-mt-24">
        <div className="mb-6">
          <h2 className="text-xl font-bold font-heading">How It Works</h2>
          <p className="text-sm text-cosmic-muted mt-1">AI agents seamlessly integrate into your democratic process</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 sm:gap-6">
          {[
            {
              step: '01',
              title: 'Join Assembly',
              description: 'Enter an assembly hall and join a live debate session. AI agents are automatically activated to support the discussion.',
              icon: Users,
              color: '#2D6BFF',
            },
            {
              step: '02',
              title: 'AI Agents Monitor & Facilitate',
              description: 'Nexus keeps order, Lumen helps newcomers, Synthesis summarizes, Concord finds common ground, Babel translates, and Aegis ensures accessibility.',
              icon: Bot,
              color: '#2EE6C7',
            },
            {
              step: '03',
              title: 'Reach Consensus Together',
              description: 'With AI-guided deliberation, your assembly moves toward genuine agreement — measured in real-time by Concord\'s consensus visualization.',
              icon: CheckCircle2,
              color: '#10b981',
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
            >
              <Card className="bg-[#0B1022] border-white/5 hover:border-white/10 transition-all h-full group relative overflow-hidden">
                {/* Step accent line */}
                <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${item.color}, transparent)`, opacity: 0.5 }} />

                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${item.color}12` }}>
                      <item.icon className="w-6 h-6" style={{ color: item.color }} />
                    </div>
                    <span className="text-3xl font-bold font-heading text-white/10">{item.step}</span>
                  </div>
                  <h3 className="text-base font-semibold font-heading mb-2">{item.title}</h3>
                  <p className="text-sm text-cosmic-muted leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Connecting arrow decoration */}
        <div className="hidden md:flex items-center justify-center gap-4 -mt-3">
          <div className="flex items-center gap-1 text-cosmic-muted/30">
            <ChevronRight className="w-4 h-4" />
            <ChevronRight className="w-4 h-4" />
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── Live Debates Section ── */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold font-heading flex items-center gap-2">
              <Activity className="w-5 h-5 text-cosmic-teal" />
              Live Debates
            </h2>
            <p className="text-sm text-cosmic-muted mt-1">Active assembly sessions powered by AI agents</p>
          </div>
          <Link href="/dashboard/participation/assemblies">
            <Button variant="ghost" size="sm" className="text-cosmic-muted hover:text-white">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {debates.length === 0 ? (
          <Card className="bg-[#0B1022] border-white/5">
            <CardContent className="p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-cosmic-teal/10 flex items-center justify-center mx-auto mb-4">
                <Waves className="w-7 h-7 text-cosmic-teal/50" />
              </div>
              <h3 className="text-base font-semibold font-heading mb-1">No Active Debates</h3>
              <p className="text-sm text-cosmic-muted mb-4">Start a new debate session in the Assembly Hall to see AI agents in action.</p>
              <Link href="/dashboard/participation/assemblies">
                <Button className="bg-cosmic-accent text-white rounded-xl">
                  <Users className="w-4 h-4 mr-2" /> Go to Assembly Hall
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {debates.slice(0, 4).map((debate, i) => (
              <motion.div
                key={debate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Card className="bg-[#0B1022] border-white/5 hover:border-white/10 transition-all group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-grow">
                        <h4 className="text-sm font-semibold truncate group-hover:text-cosmic-accent transition-colors">{debate.title}</h4>
                        <p className="text-xs text-cosmic-muted mt-0.5 truncate">{debate.topic}</p>
                      </div>
                      {/* Live indicator */}
                      <div className="flex items-center gap-1.5 ml-3 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-cosmic-rose animate-pulse" style={{ boxShadow: '0 0 6px rgba(255, 94, 138, 0.6)' }} />
                        <span className="text-[10px] text-cosmic-rose font-medium uppercase tracking-wider">Live</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-cosmic-muted mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {debate.participants?.length || debate.participantCount || 0} participants
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {debate._count?.messages || 0} messages
                      </span>
                    </div>

                    {/* Consensus level bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-cosmic-muted">Consensus Level</span>
                        <span className="text-cosmic-success font-medium">{Math.round((debate.consensusLevel || 0) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.round((debate.consensusLevel || 0) * 100)}%`,
                            background: `linear-gradient(90deg, #10b981, #34d399)`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Phase badge + Join button */}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] rounded-full border-white/10 text-cosmic-muted">
                        <Circle className="w-1.5 h-1.5 mr-1 fill-cosmic-amber text-cosmic-amber" />
                        {debate.phase || 'opening'}
                      </Badge>
                      <Link href="/dashboard/participation/assemblies">
                        <Button size="sm" className="bg-cosmic-accent text-white rounded-lg h-7 text-xs px-3">
                          Join <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
