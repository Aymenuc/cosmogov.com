'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Zap, Brain, Target, Eye, Shield, Clock,
  ArrowRight, ChevronRight, Users, CheckCircle,
  Sparkles, Vote, Crown, Rocket, Lock, BarChart3,
  MessageSquare, Gamepad2, Cpu, Search, AlertTriangle,
  Flame, Trophy, Send, CheckCircle2, CircleAlert,
  LayoutDashboard, Fingerprint, ShieldCheck, CloudLightning,
  Globe, LockKeyhole, Server,
  Workflow, Coins, FileSignature, MessageCircle, ClipboardCheck, Landmark, DollarSign,
  BadgeCheck, UserCheck, Building2, Award, FileCheck, ScanFace,
  BadgeDollarSign, TrendingUp, HeadphonesIcon, Palette, Database,
  Wrench, Layers, Handshake, BookOpen, Compass, UserPlus,
  Settings, Play, ChevronDown, X, Minus
} from 'lucide-react';
import Footer from '@/components/Footer';

/* ─── Starfield Background ─── */
function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    let animId: number;
    const stars: { x: number; y: number; r: number; a: number; d: number }[] = [];
    const init = () => {
      c.width = window.innerWidth; c.height = window.innerHeight;
      stars.length = 0;
      for (let i = 0; i < 220; i++) {
        stars.push({ x: Math.random() * c.width, y: Math.random() * c.height, r: Math.random() * 1.5 + 0.3, a: Math.random(), d: (Math.random() - 0.5) * 0.01 });
      }
    };
    init();
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const s of stars) {
        s.a += s.d;
        if (s.a > 1 || s.a < 0.1) s.d *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${s.a * 0.8})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener('resize', init);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', init); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

/* ─── Navigation (with Dashboard link when logged in) ─── */
function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? setIsLoggedIn(true) : setIsLoggedIn(false))
      .catch(() => setIsLoggedIn(false));
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#04050b]/80 backdrop-blur-xl border-b border-white/5' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cosmic-teal to-cosmic-violet flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-lg tracking-tight">CosmoGov</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#governance" className="text-sm text-cosmic-muted hover:text-white transition-colors">Governance</a>
          <a href="#participation" className="text-sm text-cosmic-muted hover:text-white transition-colors">Participation</a>
          <a href="#verification" className="text-sm text-cosmic-muted hover:text-white transition-colors">Verification</a>
          <a href="#onboarding" className="text-sm text-cosmic-muted hover:text-white transition-colors">Onboarding</a>
          <a href="#games" className="text-sm text-cosmic-muted hover:text-white transition-colors">Games</a>
          <a href="#ai" className="text-sm text-cosmic-muted hover:text-white transition-colors">AI Studio</a>
          <a href="#pricing" className="text-sm text-cosmic-muted hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button variant="ghost" className="text-cosmic-teal hover:text-cosmic-teal">
                <LayoutDashboard className="w-4 h-4 mr-1" /> Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button variant="ghost" className="text-cosmic-muted hover:text-white">Log in</Button>
            </Link>
          )}
          <Link href="/auth/signup">
            <Button className="bg-cosmic-accent hover:bg-cosmic-accent/90 text-white rounded-lg px-5">
              Launch Free <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-[#04050b]/95 backdrop-blur-xl border-b border-white/5 px-4 py-4 space-y-3 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <a href="#governance" className="block text-cosmic-muted hover:text-white py-2" onClick={() => setMobileOpen(false)}>Governance</a>
          <a href="#participation" className="block text-cosmic-muted hover:text-white py-2" onClick={() => setMobileOpen(false)}>Participation</a>
          <a href="#verification" className="block text-cosmic-muted hover:text-white py-2" onClick={() => setMobileOpen(false)}>Verification</a>
          <a href="#onboarding" className="block text-cosmic-muted hover:text-white py-2" onClick={() => setMobileOpen(false)}>Onboarding</a>
          <a href="#games" className="block text-cosmic-muted hover:text-white py-2" onClick={() => setMobileOpen(false)}>Games</a>
          <a href="#ai" className="block text-cosmic-muted hover:text-white py-2" onClick={() => setMobileOpen(false)}>AI Studio</a>
          <a href="#pricing" className="block text-cosmic-muted hover:text-white py-2" onClick={() => setMobileOpen(false)}>Pricing</a>
          {isLoggedIn ? (
            <Link href="/dashboard" className="block text-cosmic-teal hover:text-cosmic-teal py-2">
              <LayoutDashboard className="w-4 h-4 inline mr-1" /> Dashboard
            </Link>
          ) : (
            <Link href="/auth/login" className="block text-cosmic-muted hover:text-white py-2">Log in</Link>
          )}
          <Link href="/auth/signup"><Button className="w-full bg-cosmic-accent text-white rounded-lg">Launch Free</Button></Link>
        </div>
      )}
    </nav>
  );
}

/* ─── Hero Section ─── */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Orbiting rings */}
      <div className="orbit-ring hidden sm:block w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbitSpin 18s linear infinite' }} />
      <div className="orbit-ring hidden sm:block w-[700px] h-[700px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'orbitSpin 24s linear infinite reverse' }} />
      {/* Planet */}
      <div className="planet-glow w-32 h-32 bg-gradient-to-br from-cosmic-teal/40 to-cosmic-violet/40 top-[15%] right-[20%]" />
      <div className="planet-glow w-20 h-20 bg-gradient-to-br from-cosmic-amber/30 to-cosmic-rose/30 bottom-[20%] left-[15%]" style={{ animationDelay: '3s' }} />
      {/* Shooting stars */}
      <div className="shooting-star top-[20%] left-[10%]" />
      <div className="shooting-star top-[40%] right-[5%]" style={{ animationDelay: '4s' }} />

      <div className="relative z-10 text-center max-w-5xl mx-auto px-4 sm:px-6 overflow-hidden">
        <div className="inline-flex items-center gap-2 cosmic-badge rounded-full px-4 py-1.5 mb-8" style={{ animation: 'slideUp 0.8s ease-out' }}>
          <Sparkles className="w-3.5 h-3.5 text-cosmic-teal" />
          <span className="text-xs font-medium text-cosmic-teal">Now in Public Beta</span>
        </div>
        <h1 className="text-4xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-6 break-words" style={{ animation: 'slideUp 0.8s ease-out 0.1s both' }}>
          <span className="text-gradient">Interstellar</span>
          <br />
          <span className="text-white">Civic OS</span>
        </h1>
        <p className="text-base sm:text-xl text-cosmic-muted max-w-2xl mx-auto mb-10 leading-relaxed break-words" style={{ animation: 'slideUp 0.8s ease-out 0.2s both' }}>
          Full participatory democracy infrastructure — from budgeting to accountability — powered by AI and gamified engagement. Every voice doesn&apos;t just matter, it has real power.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16" style={{ animation: 'slideUp 0.8s ease-out 0.3s both' }}>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-cosmic-accent hover:bg-cosmic-accent/90 text-white rounded-xl px-8 h-12 text-base font-semibold glow-accent">
              Launch Your Cosmos <Rocket className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <a href="#governance">
            <Button size="lg" variant="ghost" className="text-cosmic-muted hover:text-white rounded-xl px-8 h-12 text-base border border-white/10">
              Explore Features
            </Button>
          </a>
        </div>

        {/* Key value props instead of fabricated stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-8 max-w-2xl mx-auto" style={{ animation: 'slideUp 0.8s ease-out 0.4s both' }}>
          {[
            { label: 'Participatory Budgeting', icon: Coins },
            { label: 'Verified Governance', icon: BadgeCheck },
            { label: 'AI-Powered Decisions', icon: Brain },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="w-5 h-5 text-cosmic-teal mx-auto mb-2" />
              <div className="text-xs sm:text-sm font-medium text-cosmic-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Governance Modes ─── */
function GovernanceSection() {
  const modes = [
    {
      title: 'Direct Democracy',
      desc: 'Simple yes or no. Every voice carries equal weight in binary decisions that shape your organization\'s future.',
      icon: Vote,
      accent: 'teal',
      cardClass: 'glass-card-teal',
    },
    {
      title: 'Council Vote',
      desc: 'Multiple options, one choice. Select from curated alternatives to find the path that best serves the collective.',
      icon: Crown,
      accent: 'violet',
      cardClass: 'glass-card-violet',
    },
    {
      title: 'Ranked Choice',
      desc: 'Express your true preferences. Rank all options to ensure the outcome reflects the will of the majority.',
      icon: Target,
      accent: 'amber',
      cardClass: 'glass-card-amber',
    },
  ];
  return (
    <section id="governance" className="relative py-20 sm:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Governance, <span className="text-gradient">Evolved</span>
          </h2>
          <p className="text-cosmic-muted text-base sm:text-lg max-w-2xl mx-auto px-2">
            Three voting paradigms engineered for every decision, from daily operations to civilization-defining choices.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {modes.map((m) => {
            const bgClass = m.accent === 'teal' ? 'bg-cosmic-teal/10' : m.accent === 'violet' ? 'bg-cosmic-violet/10' : 'bg-cosmic-amber/10';
            const textClass = m.accent === 'teal' ? 'text-cosmic-teal' : m.accent === 'violet' ? 'text-cosmic-violet' : 'text-cosmic-amber';
            return (
            <div key={m.title} className={`${m.cardClass} p-6 sm:p-8 transition-all duration-500 group cursor-pointer overflow-hidden`}>
              <div className={`w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <m.icon className={`w-6 h-6 ${textClass}`} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 font-heading">{m.title}</h3>
              <p className="text-cosmic-muted text-sm leading-relaxed">{m.desc}</p>
              <div className="mt-5 flex items-center gap-1 text-sm text-cosmic-accent opacity-0 group-hover:opacity-100 transition-opacity">
                Try it <ChevronRight className="w-4 h-4" />
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── e-Participation Section ─── */
function EParticipationSection() {
  const pillars = [
    {
      title: 'Participatory Processes',
      desc: 'From idea to implementation, every voice shapes the journey. Multi-phase processes that guide communities through information, proposals, deliberation, voting, implementation, and evaluation.',
      icon: Workflow,
      accent: '#2EE6C7',
      bgGradient: 'linear-gradient(145deg, rgba(6,24,26,0.92), rgba(4,16,18,0.76))',
      borderColor: 'rgba(46,230,199,0.2)',
    },
    {
      title: 'Participatory Budgeting',
      desc: 'Citizens decide how to allocate real budgets. Your community, your priorities, your money. Allocate funds to projects that matter most to you.',
      icon: Coins,
      accent: '#FF6B35',
      bgGradient: 'linear-gradient(145deg, rgba(32,18,8,0.92), rgba(20,10,4,0.76))',
      borderColor: 'rgba(255,107,53,0.2)',
    },
    {
      title: 'Citizen Initiatives',
      desc: 'When enough people speak, power must answer. Create petitions, gather signatures, and force official response when thresholds are reached.',
      icon: FileSignature,
      accent: '#9B5CFF',
      bgGradient: 'linear-gradient(145deg, rgba(20,12,38,0.92), rgba(8,5,22,0.76))',
      borderColor: 'rgba(155,92,255,0.2)',
    },
    {
      title: 'Assemblies',
      desc: 'Ongoing deliberative spaces where communities discuss, debate, and decide together. Not one-off votes, but sustained democratic dialogue.',
      icon: MessageCircle,
      accent: '#FFB547',
      bgGradient: 'linear-gradient(145deg, rgba(32,22,8,0.92), rgba(20,12,4,0.76))',
      borderColor: 'rgba(255,181,71,0.2)',
    },
    {
      title: 'Accountability Tracker',
      desc: 'Promises made, promises tracked. Monitor implementation of approved proposals with milestones, evidence, and transparency scores. Because voting is just the beginning.',
      icon: ClipboardCheck,
      accent: '#FF5E8A',
      bgGradient: 'linear-gradient(145deg, rgba(32,10,20,0.92), rgba(20,6,14,0.76))',
      borderColor: 'rgba(255,94,138,0.2)',
    },
  ];

  return (
    <section id="participation" className="relative py-20 sm:py-32 px-4 sm:px-6 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-cosmic-teal/[0.03] via-transparent to-transparent" />
      <div className="planet-glow w-96 h-96 bg-cosmic-teal/10 -top-32 left-1/2 -translate-x-1/2" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 cosmic-badge rounded-full px-4 py-1.5 mb-6" style={{ background: 'rgba(46,230,199,0.08)', border: '1px solid rgba(46,230,199,0.15)' }}>
            <Landmark className="w-3.5 h-3.5 text-cosmic-teal" />
            <span className="text-xs font-medium text-cosmic-teal">e-Participation Framework</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Participatory Democracy,<br /><span className="text-gradient">Reimagined</span>
          </h2>
          <p className="text-cosmic-muted text-base sm:text-lg max-w-2xl mx-auto px-2">
            Five interconnected pillars that transform passive constituents into active co-creators of their community&apos;s future. Inspired by Decidim, built for the cosmos.
          </p>
        </div>

        {/* Pillar cards - first row of 3, second row of 2 centered */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {pillars.slice(0, 3).map((p) => (
            <div
              key={p.title}
              className="glass-card p-8 hover:scale-[1.03] transition-all duration-500 group cursor-pointer relative overflow-hidden"
              style={{
                background: p.bgGradient,
                border: `1px solid ${p.borderColor}`,
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, ${p.accent}10 0%, transparent 70%)`,
                }}
              />
              <div className="relative z-10">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                  style={{ background: `${p.accent}15` }}
                >
                  <p.icon className="w-7 h-7" style={{ color: p.accent }} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 font-heading">{p.title}</h3>
                <p className="text-cosmic-muted text-sm leading-relaxed">{p.desc}</p>
                <div className="mt-5 flex items-center gap-1 text-sm opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: p.accent }}>
                  Learn more <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-6 sm:max-w-[calc(66.666%-0.5rem)] sm:mx-auto lg:max-w-none lg:grid-cols-2 lg:px-[16.666%]">
          {pillars.slice(3).map((p) => (
            <div
              key={p.title}
              className="glass-card p-8 hover:scale-[1.03] transition-all duration-500 group cursor-pointer relative overflow-hidden"
              style={{
                background: p.bgGradient,
                border: `1px solid ${p.borderColor}`,
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, ${p.accent}10 0%, transparent 70%)`,
                }}
              />
              <div className="relative z-10">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                  style={{ background: `${p.accent}15` }}
                >
                  <p.icon className="w-7 h-7" style={{ color: p.accent }} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 font-heading">{p.title}</h3>
                <p className="text-cosmic-muted text-sm leading-relaxed">{p.desc}</p>
                <div className="mt-5 flex items-center gap-1 text-sm opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: p.accent }}>
                  Learn more <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Decidim comparison callout */}
        <div className="mt-16 relative">
          <div className="glass-card p-8 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(46,230,199,0.05) 0%, rgba(155,92,255,0.05) 50%, rgba(255,107,53,0.05) 100%)',
              }}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-cosmic-teal/40" />
                <Sparkles className="w-5 h-5 text-cosmic-teal" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-cosmic-teal/40" />
              </div>
              <p className="text-cosmic-muted text-base leading-relaxed max-w-3xl mx-auto">
                Inspired by <span className="text-cosmic-teal font-semibold">Barcelona&apos;s Decidim</span>, but designed for the cosmos. The first SaaS platform to combine full e-Participation infrastructure with <span className="text-cosmic-accent font-semibold">AI-powered analysis</span> and <span className="text-cosmic-amber font-semibold">gamified engagement</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Gov Badge & Verification Section ─── */
function VerificationSection() {
  const features = [
    {
      icon: BadgeCheck,
      title: 'Government Verification Badge',
      desc: 'Official verification for government entities, municipalities, and public institutions. Display a verified badge that signals authenticity and builds citizen trust. Verification requires proof of official government status.',
      accent: '#2EE6C7',
    },
    {
      icon: ScanFace,
      title: 'Identity Verification',
      desc: 'Multi-factor identity verification for voters and participants. Ensure one person, one vote with secure document verification, biometric options, and integration with national ID systems.',
      accent: '#9B5CFF',
    },
    {
      icon: FileCheck,
      title: 'Proposal Certification',
      desc: 'Digitally sign and certify official proposals and binding decisions. Tamper-proof audit trails with cryptographic verification ensure the integrity of every governance action.',
      accent: '#2D6BFF',
    },
    {
      icon: ShieldCheck,
      title: 'Compliance Certifications',
      desc: 'Built to meet GDPR, SOC 2 Type II, and eIDAS standards. Automatic compliance reporting and audit logs ensure your governance processes meet regulatory requirements.',
      accent: '#FFB547',
    },
    {
      icon: Building2,
      title: 'Organization Trust Tiers',
      desc: 'Progressive trust levels for organizations: Community, Verified, and Government tiers. Each tier unlocks additional capabilities and signals credibility to participants.',
      accent: '#FF5E8A',
    },
    {
      icon: UserCheck,
      title: 'Delegate Authentication',
      desc: 'Secure delegation framework allowing citizens to verify and authorize representatives. Transparent delegation chains with real-time tracking and revocable consent.',
      accent: '#34D399',
    },
  ];

  return (
    <section id="verification" className="relative py-20 sm:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cosmic-violet/[0.03] via-transparent to-transparent" />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 cosmic-badge rounded-full px-4 py-1.5 mb-6" style={{ background: 'rgba(155,92,255,0.08)', border: '1px solid rgba(155,92,255,0.15)' }}>
            <BadgeCheck className="w-3.5 h-3.5 text-cosmic-violet" />
            <span className="text-xs font-medium text-cosmic-violet">Trust & Verification</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Verified <span className="text-gradient-violet">Governance</span>
          </h2>
          <p className="text-cosmic-muted text-base sm:text-lg max-w-2xl mx-auto px-2">
            Trust is the foundation of legitimate governance. Multi-layered verification ensures every participant, proposal, and decision is authentic and tamper-proof.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass-card p-6 sm:p-8 hover:scale-[1.02] transition-all duration-300 group cursor-default relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, ${f.accent}10 0%, transparent 70%)`,
                }}
              />
              <div className="relative z-10">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                  style={{ background: `${f.accent}15` }}
                >
                  <f.icon className="w-6 h-6" style={{ color: f.accent }} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3 font-heading">{f.title}</h3>
                <p className="text-cosmic-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust callout */}
        <div className="mt-12 glass-card p-6 flex flex-col sm:flex-row items-center justify-center gap-6 text-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cosmic-teal" />
            <span className="text-sm text-cosmic-muted">eIDAS compliant signatures</span>
          </div>
          <div className="hidden sm:block w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-cosmic-violet" />
            <span className="text-sm text-cosmic-muted">Cryptographic audit trails</span>
          </div>
          <div className="hidden sm:block w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-cosmic-amber" />
            <span className="text-sm text-cosmic-muted">Biometric-ready authentication</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Onboarding Section ─── */
function OnboardingSection() {
  const steps = [
    {
      step: '01',
      title: 'Create Your Cosmos',
      desc: 'Sign up and set up your governance space. Choose your organization type, configure voting rules, and customize your community branding in minutes with our guided wizard.',
      icon: Rocket,
      accent: '#2EE6C7',
    },
    {
      step: '02',
      title: 'Invite Your Community',
      desc: 'Import members via CSV, send email invitations, or share a join link. Automatic role assignment and onboarding emails get everyone up to speed without manual effort.',
      icon: UserPlus,
      accent: '#9B5CFF',
    },
    {
      step: '03',
      title: 'Configure Governance',
      desc: 'Set up your first participatory process, budget allocation, or citizen initiative. Templates for common governance workflows let you launch in minutes, not months.',
      icon: Settings,
      accent: '#2D6BFF',
    },
    {
      step: '04',
      title: 'Launch & Engage',
      desc: 'Go live and watch your community participate. AI-powered insights, gamification, and automated notifications keep engagement high and decision quality strong.',
      icon: Play,
      accent: '#FFB547',
    },
  ];

  return (
    <section id="onboarding" className="relative py-20 sm:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cosmic-accent/[0.03] via-transparent to-transparent" />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 cosmic-badge rounded-full px-4 py-1.5 mb-6" style={{ background: 'rgba(45,107,255,0.08)', border: '1px solid rgba(45,107,255,0.15)' }}>
            <Compass className="w-3.5 h-3.5 text-cosmic-accent" />
            <span className="text-xs font-medium text-cosmic-accent">Guided Setup</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            From Zero to <span className="text-gradient">Governance</span>
          </h2>
          <p className="text-cosmic-muted text-base sm:text-lg max-w-2xl mx-auto px-2">
            A streamlined onboarding experience that gets your community making decisions together in minutes, not months. No consultants needed.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, idx) => (
            <div key={s.step} className="glass-card p-6 sm:p-8 relative group hover:scale-[1.02] transition-all duration-300 overflow-hidden">
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, ${s.accent}10 0%, transparent 70%)`,
                }}
              />
              <div className="relative z-10">
                <div className="text-4xl font-bold mb-4 font-heading" style={{ color: `${s.accent}30` }}>{s.step}</div>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                  style={{ background: `${s.accent}15` }}
                >
                  <s.icon className="w-6 h-6" style={{ color: s.accent }} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3 font-heading">{s.title}</h3>
                <p className="text-cosmic-muted text-sm leading-relaxed">{s.desc}</p>
              </div>
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-white/10" />
              )}
            </div>
          ))}
        </div>

        {/* Onboarding extras */}
        <div className="mt-12 grid sm:grid-cols-3 gap-6">
          {[
            { icon: BookOpen, title: 'Interactive Tutorials', desc: 'Step-by-step walkthroughs for every feature, accessible at any time from the help center.' },
            { icon: HeadphonesIcon, title: 'Dedicated Onboarding Support', desc: 'Gov and Enterprise plans include a dedicated success manager to guide your launch.' },
            { icon: Wrench, title: 'Migration Assistance', desc: 'Moving from Decidim, Consul, or another platform? We help migrate your data and workflows.' },
          ].map((item) => (
            <div key={item.title} className="glass-card p-6 text-center group hover:scale-[1.02] transition-all duration-300">
              <item.icon className="w-8 h-8 text-cosmic-accent mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-semibold text-white mb-2">{item.title}</h4>
              <p className="text-cosmic-muted text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── AI Studio Section ─── */
function AIStudioSection() {
  const [typingText, setTypingText] = useState('');
  const fullText = 'Proposal: Implement AI-Assisted Governance Review\n\nSummary: Establish an automated review process that uses AI to analyze proposal impact, identify potential biases, and generate risk assessments before community voting.\n\nKey Benefits:\n- Reduces decision blind spots\n- Accelerates proposal review from days to minutes\n- Provides evidence-based risk scoring';
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= fullText.length) { setTypingText(fullText.slice(0, i)); i++; }
      else clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="ai" className="relative py-20 sm:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 cosmic-badge rounded-full px-4 py-1.5 mb-6">
              <Cpu className="w-3.5 h-3.5 text-cosmic-teal" />
              <span className="text-xs font-medium text-cosmic-teal">Powered by Advanced AI</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-6">
              AI That <span className="text-gradient">Thinks</span> With You
            </h2>
            <p className="text-cosmic-muted text-base sm:text-lg mb-8 leading-relaxed">
              CosmoGov&apos;s AI assistant drafts proposals, analyzes vote patterns, predicts outcomes, and identifies cognitive biases — all in real time.
            </p>
            <div className="space-y-4">
              {[
                { icon: Sparkles, text: 'Draft proposals with AI in seconds' },
                { icon: BarChart3, text: 'Analyze vote patterns and predict outcomes' },
                { icon: Brain, text: 'Detect cognitive biases before they distort decisions' },
                { icon: MessageSquare, text: 'Chat with your governance data naturally' },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cosmic-accent/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-4 h-4 text-cosmic-accent" />
                  </div>
                  <span className="text-sm text-cosmic-muted">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-cosmic-rose/60" />
              <div className="w-3 h-3 rounded-full bg-cosmic-amber/60" />
              <div className="w-3 h-3 rounded-full bg-cosmic-teal/60" />
              <span className="ml-2 text-xs text-cosmic-muted font-mono">ai-studio</span>
            </div>
            <div className="bg-[#04050b]/60 rounded-xl p-4 font-mono text-sm">
              <div className="flex items-center gap-2 mb-3 text-cosmic-teal">
                <Cpu className="w-4 h-4" />
                <span className="text-xs">Generating proposal...</span>
              </div>
              <pre className="text-cosmic-muted whitespace-pre-wrap leading-relaxed text-xs">{typingText}<span className="animate-pulse text-cosmic-accent">|</span></pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Security Section ─── */
function SecuritySection() {
  const badges = [
    {
      icon: ShieldCheck,
      title: 'SOC 2 Type II',
      desc: 'Independently audited for security, availability, and confidentiality controls.',
      accent: '#2EE6C7',
    },
    {
      icon: Globe,
      title: 'GDPR Ready',
      desc: 'Full compliance with EU data protection regulations and privacy rights.',
      accent: '#9B5CFF',
    },
    {
      icon: LockKeyhole,
      title: 'End-to-End Encryption',
      desc: 'All data encrypted in transit and at rest with AES-256 and TLS 1.3.',
      accent: '#2D6BFF',
    },
    {
      icon: CloudLightning,
      title: '99.9% Uptime',
      desc: 'Battle-tested infrastructure with automatic failover and zero-downtime deploys.',
      accent: '#FFB547',
    },
  ];

  return (
    <section id="security" className="relative py-20 sm:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 cosmic-badge rounded-full px-4 py-1.5 mb-6">
            <Lock className="w-3.5 h-3.5 text-cosmic-teal" />
            <span className="text-xs font-medium text-cosmic-teal">Enterprise-Grade Security</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Fortified by <span className="text-gradient">Design</span>
          </h2>
          <p className="text-cosmic-muted text-base sm:text-lg max-w-2xl mx-auto px-2">
            Your governance data deserves the same protection as your most critical infrastructure. Built secure from day one.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((b) => (
            <div key={b.title} className="glass-card p-6 text-center group hover:scale-[1.02] transition-all duration-300 cursor-default">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform"
                style={{ background: `${b.accent}15` }}
              >
                <b.icon className="w-7 h-7" style={{ color: b.accent }} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 font-heading">{b.title}</h3>
              <p className="text-cosmic-muted text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
        {/* Additional security trust line */}
        <div className="mt-12 glass-card p-6 flex flex-col sm:flex-row items-center justify-center gap-6 text-center">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cosmic-teal" />
            <span className="text-sm text-cosmic-muted">Hosted on isolated infrastructure</span>
          </div>
          <div className="hidden sm:block w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-cosmic-violet" />
            <span className="text-sm text-cosmic-muted">SSO & SAML ready</span>
          </div>
          <div className="hidden sm:block w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cosmic-amber" />
            <span className="text-sm text-cosmic-muted">Regular third-party audits</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Games Preview Section ─── */
function GamesSection() {
  const games = [
    { name: 'Neural Consensus', tagline: 'Converge with the collective mind', icon: Brain, accent: 'teal', desc: 'Pick an option. The more minds that align, the greater the reward. A game of pure coordination where collective intelligence emerges from individual choices.' },
    { name: 'Oracle Protocol', tagline: 'Predict the future of proposals', icon: Eye, accent: 'violet', desc: 'Forecast whether proposals pass or fail. Calibrate your confidence. Your Brier score reveals if you truly see the future or just think you do.' },
    { name: 'Signal Detective', tagline: 'Spot anomalies in the data stream', icon: Search, accent: 'amber', desc: 'Scan vote timelines for manipulation patterns — late clusters, whale flips, bot swarms. Train your eye to catch what others miss.' },
    { name: 'Cognitive Warfare', tagline: 'Defeat bias with evidence', icon: AlertTriangle, accent: 'rose', desc: 'Arguments are enemies. Biases are their armor. Identify the cognitive distortion and strike with the right evidence to win.' },
    { name: 'Strategic Command', tagline: 'Command high-stakes decisions', icon: Shield, accent: 'teal', desc: 'Face critical scenarios with no easy answers. Choose the response pattern that evidence supports. History watches.' },
    { name: 'Chrono Autopsy', tagline: 'Reverse-engineer failure', icon: Clock, accent: 'violet', desc: 'A passed proposal failed. Watch events unfold backwards. Find the moment it all went wrong. The rarer your insight, the greater the reward.' },
  ];

  return (
    <section id="games" className="relative py-20 sm:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 cosmic-badge rounded-full px-4 py-1.5 mb-6">
            <Gamepad2 className="w-3.5 h-3.5 text-cosmic-amber" />
            <span className="text-xs font-medium text-cosmic-amber">6 Governance Games</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Play to <span className="text-gradient-warm">Govern</span>
          </h2>
          <p className="text-cosmic-muted text-base sm:text-lg max-w-2xl mx-auto px-2">
            Six immersive games that train your decision-making instincts, earn XP, and make governance feel like an adventure — not a chore.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((g) => (
            <div key={g.name} className="glass-card p-6 hover:scale-[1.02] transition-all duration-300 group cursor-pointer" style={{
              background: g.accent === 'teal' ? 'linear-gradient(145deg, rgba(6,24,26,0.88), rgba(4,16,18,0.72))' :
                g.accent === 'violet' ? 'linear-gradient(145deg, rgba(20,12,38,0.88), rgba(8,5,22,0.72))' :
                g.accent === 'amber' ? 'linear-gradient(145deg, rgba(32,22,8,0.88), rgba(20,12,4,0.72))' :
                'linear-gradient(145deg, rgba(32,10,20,0.88), rgba(20,6,14,0.72))',
              borderColor: g.accent === 'teal' ? 'rgba(46,230,199,0.15)' : g.accent === 'violet' ? 'rgba(155,92,255,0.15)' : g.accent === 'amber' ? 'rgba(255,181,71,0.15)' : 'rgba(255,94,138,0.15)',
              border: '1px solid',
            }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                style={{ background: g.accent === 'teal' ? 'rgba(46,230,199,0.1)' : g.accent === 'violet' ? 'rgba(155,92,255,0.1)' : g.accent === 'amber' ? 'rgba(255,181,71,0.1)' : 'rgba(255,94,138,0.1)' }}>
                <g.icon className="w-6 h-6" style={{ color: g.accent === 'teal' ? '#2EE6C7' : g.accent === 'violet' ? '#9B5CFF' : g.accent === 'amber' ? '#FFB547' : '#FF5E8A' }} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1 font-heading">{g.name}</h3>
              <p className="text-xs mb-3" style={{ color: g.accent === 'teal' ? '#2EE6C7' : g.accent === 'violet' ? '#9B5CFF' : g.accent === 'amber' ? '#FFB547' : '#FF5E8A' }}>{g.tagline}</p>
              <p className="text-cosmic-muted text-sm leading-relaxed">{g.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing Section (Rich) ─── */
function PricingSection() {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      period: '',
      desc: 'For local groups & community pilots exploring digital governance.',
      icon: Rocket,
      features: [
        { text: '3 proposals per month', included: true },
        { text: '1 organization', included: true },
        { text: 'Up to 25 members', included: true },
        { text: 'Basic voting (yes/no)', included: true },
        { text: '1 governance game', included: true },
        { text: 'Community forum support', included: true },
        { text: 'Participatory budgeting', included: false },
        { text: 'AI assistant', included: false },
        { text: 'Custom branding', included: false },
        { text: 'API access', included: false },
      ],
      cta: 'Start Free',
      highlight: false,
      accent: 'muted',
    },
    {
      name: 'Pro',
      price: annual ? '$39' : '$49',
      period: '/mo',
      desc: 'For teams & organizations ready to scale their governance.',
      icon: TrendingUp,
      features: [
        { text: 'Unlimited proposals', included: true },
        { text: '5 organizations', included: true },
        { text: 'Up to 500 members', included: true },
        { text: 'All voting modes', included: true },
        { text: 'All 6 governance games', included: true },
        { text: 'Full AI assistant & analysis', included: true },
        { text: 'Surveys & legislation', included: true },
        { text: 'Priority email support', included: true },
        { text: 'Participatory budgeting', included: false },
        { text: 'Sortition & binding proposals', included: false },
      ],
      cta: 'Start Pro Plan',
      highlight: true,
      accent: 'accent',
      badge: 'Most Popular',
    },
    {
      name: 'Gov',
      price: annual ? '$159' : '$199',
      period: '/mo',
      desc: 'For municipalities & large-scale citizen participation.',
      icon: Landmark,
      features: [
        { text: 'Everything in Pro', included: true },
        { text: 'Unlimited members', included: true },
        { text: 'Participatory budgeting', included: true },
        { text: 'Sortition & citizen assemblies', included: true },
        { text: 'Binding proposals engine', included: true },
        { text: 'Advanced analytics & API', included: true },
        { text: 'Custom branding & domain', included: true },
        { text: 'Dedicated success manager', included: true },
        { text: 'Government verification badge', included: true },
        { text: 'Onboarding & migration support', included: true },
      ],
      cta: 'Start Gov Plan',
      highlight: false,
      accent: 'teal',
      badge: 'For Governments',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      desc: 'For national governments, institutions & multi-tenant deployments.',
      icon: Building2,
      features: [
        { text: 'Everything in Gov', included: true },
        { text: 'SSO, SAML & LDAP', included: true },
        { text: '99.99% SLA guarantee', included: true },
        { text: 'On-premise deployment', included: true },
        { text: 'Custom AI model training', included: true },
        { text: 'Multi-tenant management', included: true },
        { text: 'Compliance & audit logs', included: true },
        { text: '24/7 phone & Slack support', included: true },
        { text: 'Identity verification integration', included: true },
        { text: 'Proposal certification & e-signatures', included: true },
      ],
      cta: 'Contact Sales',
      highlight: false,
      accent: 'amber',
    },
  ];

  return (
    <section id="pricing" className="relative py-20 sm:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Choose Your <span className="text-gradient">Orbit</span>
          </h2>
          <p className="text-cosmic-muted text-base sm:text-lg max-w-2xl mx-auto px-2">
            From local community groups to enterprise civilizations, there&apos;s a plan that fits your governance needs.
          </p>
        </div>

        {/* Annual/Monthly Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm ${!annual ? 'text-white font-semibold' : 'text-cosmic-muted'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className="relative w-14 h-7 rounded-full transition-colors"
            style={{ background: annual ? 'rgba(46,230,199,0.3)' : 'rgba(255,255,255,0.1)' }}
          >
            <div
              className="absolute top-1 w-5 h-5 rounded-full transition-all"
              style={{
                left: annual ? '30px' : '4px',
                background: annual ? '#2EE6C7' : '#A7B3D6',
              }}
            />
          </button>
          <span className={`text-sm ${annual ? 'text-white font-semibold' : 'text-cosmic-muted'}`}>
            Annual
            <span className="ml-1.5 text-xs text-cosmic-teal font-medium">Save 20%</span>
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => (
            <div key={p.name} className={`glass-card p-6 flex flex-col relative ${p.highlight ? 'ring-2 ring-cosmic-accent' : ''} ${p.accent === 'teal' ? 'ring-1 ring-cosmic-teal/30' : ''} ${p.accent === 'amber' ? 'ring-1 ring-cosmic-amber/30' : ''}`}>
              {/* Badge */}
              {p.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-semibold px-3 py-1 rounded-full ${p.highlight ? 'bg-cosmic-accent' : 'bg-cosmic-teal'}`}>
                  {p.badge}
                </div>
              )}
              {/* Plan header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.accent === 'muted' ? 'bg-white/5' : p.accent === 'accent' ? 'bg-cosmic-accent/10' : p.accent === 'teal' ? 'bg-cosmic-teal/10' : 'bg-cosmic-amber/10'}`}>
                  <p.icon className={`w-5 h-5 ${p.accent === 'muted' ? 'text-cosmic-muted' : p.accent === 'accent' ? 'text-cosmic-accent' : p.accent === 'teal' ? 'text-cosmic-teal' : 'text-cosmic-amber'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white font-heading">{p.name}</h3>
                </div>
              </div>
              <p className="text-cosmic-muted text-sm mb-4">{p.desc}</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-white font-heading">{p.price}</span>
                {p.period && <span className="text-cosmic-muted text-sm">{p.period}</span>}
                {annual && p.price !== 'Free' && p.price !== 'Custom' && (
                  <div className="text-xs text-cosmic-teal mt-1">Billed annually</div>
                )}
              </div>
              <div className="space-y-2.5 mb-6 flex-grow">
                {p.features.map((f) => (
                  <div key={f.text} className="flex items-start gap-2 text-sm">
                    {f.included ? (
                      <CheckCircle className="w-4 h-4 text-cosmic-teal flex-shrink-0 mt-0.5" />
                    ) : (
                      <Minus className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={f.included ? 'text-cosmic-muted' : 'text-white/30'}>{f.text}</span>
                  </div>
                ))}
              </div>
              <Link href={p.name === 'Enterprise' ? '/contact' : '/auth/signup'}>
                <Button className={`w-full rounded-xl ${p.highlight ? 'bg-cosmic-accent hover:bg-cosmic-accent/90 text-white' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}>
                  {p.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Feature comparison detail rows */}
        <div className="mt-16">
          <h3 className="text-xl font-semibold text-white font-heading text-center mb-8">Feature Comparison</h3>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-6 text-cosmic-muted font-medium">Feature</th>
                    <th className="text-center py-4 px-4 text-cosmic-muted font-medium">Starter</th>
                    <th className="text-center py-4 px-4 text-cosmic-accent font-medium">Pro</th>
                    <th className="text-center py-4 px-4 text-cosmic-teal font-medium">Gov</th>
                    <th className="text-center py-4 px-4 text-cosmic-amber font-medium">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Proposals', starter: '3/mo', pro: 'Unlimited', gov: 'Unlimited', enterprise: 'Unlimited' },
                    { feature: 'Members', starter: '25', pro: '500', gov: 'Unlimited', enterprise: 'Unlimited' },
                    { feature: 'Organizations', starter: '1', pro: '5', gov: 'Unlimited', enterprise: 'Unlimited' },
                    { feature: 'Voting Modes', starter: 'Yes/No', pro: 'All', gov: 'All', enterprise: 'All + Custom' },
                    { feature: 'Governance Games', starter: '1', pro: 'All 6', gov: 'All 6', enterprise: 'All 6' },
                    { feature: 'AI Assistant', starter: '-', pro: 'Full', gov: 'Full', enterprise: 'Custom Models' },
                    { feature: 'Participatory Budgeting', starter: '-', pro: '-', gov: 'Included', enterprise: 'Included' },
                    { feature: 'Sortition & Assemblies', starter: '-', pro: '-', gov: 'Included', enterprise: 'Included' },
                    { feature: 'Binding Proposals', starter: '-', pro: '-', gov: 'Included', enterprise: 'Included' },
                    { feature: 'Gov Verification Badge', starter: '-', pro: '-', gov: 'Included', enterprise: 'Included' },
                    { feature: 'API Access', starter: '-', pro: 'Read', gov: 'Full', enterprise: 'Full + Custom' },
                    { feature: 'Custom Branding', starter: '-', pro: '-', gov: 'Included', enterprise: 'Included' },
                    { feature: 'Identity Verification', starter: '-', pro: '-', gov: '-', enterprise: 'Included' },
                    { feature: 'On-Premise Deployment', starter: '-', pro: '-', gov: '-', enterprise: 'Included' },
                    { feature: 'SLA', starter: '-', pro: '99.9%', gov: '99.9%', enterprise: '99.99%' },
                    { feature: 'Support', starter: 'Forum', pro: 'Priority Email', gov: 'Dedicated Manager', enterprise: '24/7 Phone + Slack' },
                  ].map((row, idx) => (
                    <tr key={row.feature} className={idx % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                      <td className="py-3 px-6 text-cosmic-muted">{row.feature}</td>
                      <td className="py-3 px-4 text-center text-white/40">{row.starter}</td>
                      <td className="py-3 px-4 text-center text-cosmic-muted">{row.pro}</td>
                      <td className="py-3 px-4 text-center text-cosmic-teal">{row.gov}</td>
                      <td className="py-3 px-4 text-center text-cosmic-amber">{row.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ-style pricing notes */}
        <div className="mt-12 grid sm:grid-cols-2 gap-6">
          {[
            {
              icon: BadgeDollarSign,
              title: 'No Hidden Fees',
              desc: 'All prices include hosting, updates, and core features. No per-vote or per-proposal charges. Scale without surprise invoices.',
            },
            {
              icon: Handshake,
              title: 'Custom Enterprise Agreements',
              desc: 'Need multi-year contracts, procurement workflows, or specific data residency? Our sales team builds agreements that fit your institution.',
            },
            {
              icon: Palette,
              title: 'White-Label Available',
              desc: 'Gov and Enterprise plans support custom branding with your own domain, logo, and color scheme. Citizens see your brand, not ours.',
            },
            {
              icon: Database,
              title: 'Data Portability Guaranteed',
              desc: 'Export all your data at any time in open formats. No lock-in, ever. Your governance data belongs to your community.',
            },
          ].map((item) => (
            <div key={item.title} className="glass-card p-6 flex items-start gap-4 group hover:scale-[1.01] transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-cosmic-accent/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <item.icon className="w-5 h-5 text-cosmic-accent" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
                <p className="text-cosmic-muted text-xs leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Section ─── */
function CTASection() {
  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cosmic-accent/5 to-transparent" />
      <div className="planet-glow w-64 h-64 bg-cosmic-accent/20 -top-20 left-1/2 -translate-x-1/2" />
      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold mb-6">
            Ready to Launch Your<br /><span className="text-gradient">Governance Cosmos?</span>
          </h2>
          <p className="text-cosmic-muted text-base sm:text-lg mb-10 px-2">
            Start with a free account and explore the full platform. No credit card required. Upgrade when your community is ready.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-cosmic-accent hover:bg-cosmic-accent/90 text-white rounded-xl px-10 h-14 text-lg font-semibold glow-accent">
                <Rocket className="w-5 h-5 mr-2" /> Launch Free
              </Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="ghost" className="text-cosmic-muted hover:text-white rounded-xl px-8 h-14 text-base border border-white/10">
                View Pricing
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Contact Form Section ─── */
function ContactFormSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const categoryMap: Record<string, string> = {
      'General': 'general',
      'Support': 'support',
      'Sales': 'sales',
      'Partnership': 'partnership',
      'Feedback': 'feedback',
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject || 'General Inquiry',
          message: formData.message,
          category: categoryMap[formData.subject] || 'general',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  }, [formData]);

  return (
    <section id="contact" className="relative py-20 sm:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 cosmic-badge rounded-full px-4 py-1.5 mb-6">
            <MessageSquare className="w-3.5 h-3.5 text-cosmic-teal" />
            <span className="text-xs font-medium text-cosmic-teal">Get In Touch</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Contact <span className="text-gradient">Us</span>
          </h2>
          <p className="text-cosmic-muted text-lg max-w-2xl mx-auto">
            Have a question, idea, or partnership opportunity? We&apos;d love to hear from you. Our team typically responds within 24 hours.
          </p>
        </div>

        <div className="glass-card p-8 sm:p-10">
          {status === 'success' ? (
            <div className="text-center py-12" style={{ animation: 'scaleIn 0.4s ease-out' }}>
              <div className="w-16 h-16 rounded-full bg-cosmic-teal/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-cosmic-teal" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2 font-heading">Message Sent!</h3>
              <p className="text-cosmic-muted mb-6">Thank you for reaching out. We&apos;ll get back to you soon.</p>
              <Button
                onClick={() => setStatus('idle')}
                variant="ghost"
                className="text-cosmic-muted hover:text-white border border-white/10"
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contact-name" className="text-cosmic-muted text-sm">Name</Label>
                  <Input
                    id="contact-name"
                    placeholder="Your name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 focus-visible:border-cosmic-teal focus-visible:ring-cosmic-teal/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email" className="text-cosmic-muted text-sm">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 focus-visible:border-cosmic-teal focus-visible:ring-cosmic-teal/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-cosmic-muted text-sm">Subject</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, subject: val }))}
                >
                  <SelectTrigger className="w-full bg-white/5 border-white/10 text-white focus:ring-cosmic-teal/20">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0B1022] border-white/10">
                    <SelectItem value="General" className="text-white focus:bg-cosmic-accent/20 focus:text-white">General Inquiry</SelectItem>
                    <SelectItem value="Support" className="text-white focus:bg-cosmic-accent/20 focus:text-white">Support</SelectItem>
                    <SelectItem value="Sales" className="text-white focus:bg-cosmic-accent/20 focus:text-white">Sales</SelectItem>
                    <SelectItem value="Partnership" className="text-white focus:bg-cosmic-accent/20 focus:text-white">Partnership</SelectItem>
                    <SelectItem value="Feedback" className="text-white focus:bg-cosmic-accent/20 focus:text-white">Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-message" className="text-cosmic-muted text-sm">Message</Label>
                <Textarea
                  id="contact-message"
                  placeholder="Tell us how we can help..."
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 focus-visible:border-cosmic-teal focus-visible:ring-cosmic-teal/20 min-h-[120px]"
                />
              </div>
              {status === 'error' && (
                <div className="flex items-center gap-2 text-cosmic-rose text-sm" style={{ animation: 'slideUp 0.3s ease-out' }}>
                  <CircleAlert className="w-4 h-4" />
                  {errorMsg}
                </div>
              )}
              <Button
                type="submit"
                disabled={status === 'loading'}
                size="lg"
                className="w-full sm:w-auto bg-cosmic-accent hover:bg-cosmic-accent/90 text-white rounded-xl px-8 h-12 font-semibold"
              >
                {status === 'loading' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Main Landing Page ─── */
export default function LandingPage() {
  return (
    <main className="relative min-h-screen flex flex-col">
      <Starfield />
      <Navigation />
      <div className="relative z-10 flex-1">
        <HeroSection />
        <GovernanceSection />
        <EParticipationSection />
        <VerificationSection />
        <OnboardingSection />
        <AIStudioSection />
        <SecuritySection />
        <GamesSection />
        <PricingSection />
        <CTASection />
        <ContactFormSection />
      </div>
      <Footer />
    </main>
  );
}
