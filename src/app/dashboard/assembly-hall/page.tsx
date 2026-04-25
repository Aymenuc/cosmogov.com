'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield, Star, Brain, Handshake, Globe, Accessibility,
  Rocket, Sparkles, Users, MessageSquare, Plus, Send,
  Hand, Vote, Loader2, ChevronRight, X, Eye,
  ArrowUpRight, Circle, Zap, Waves, Activity,
  Languages, BookOpen, Maximize2, Minimize2,
} from 'lucide-react';

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */

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

interface DebateParticipant {
  id: string;
  displayName: string;
  role: string;
  agentType: string | null;
  stance: string;
  avatarUrl: string | null;
  handRaised?: boolean;
  speaking?: boolean;
}

interface DebateMessage {
  id: string;
  content: string;
  type: string;
  agentType: string | null;
  sentiment: string;
  simplifiedContent?: string | null;
  translatedContent?: string | null;
  targetLang?: string | null;
  isPinned?: boolean;
  createdAt: string;
  participant?: {
    id: string;
    displayName: string;
    role: string;
    agentType: string | null;
  } | null;
  user?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
}

interface DebateSession {
  id: string;
  title: string;
  description?: string | null;
  topic: string;
  status: string;
  phase: string;
  maxParticipants: number;
  participantCount: number;
  isPublic: boolean;
  consensusLevel: number;
  energyLevel: number;
  aiAgentsActive: string;
  summary?: string | null;
  consensusReport?: string | null;
  createdBy: string;
  creator?: { id: string; name: string; email: string; avatarUrl: string | null } | null;
  participants: DebateParticipant[];
  messages: DebateMessage[];
  _count?: { messages: number };
  createdAt: string;
  updatedAt: string;
}

/* ═══════════════════════════════════════════
   Constants & Maps
   ═══════════════════════════════════════════ */

const AGENT_COLORS: Record<string, { primary: string; secondary: string; glow: string }> = {
  moderator: { primary: '#6366f1', secondary: '#818cf8', glow: 'rgba(99,102,241,0.4)' },
  facilitator: { primary: '#f59e0b', secondary: '#fbbf24', glow: 'rgba(245,158,11,0.4)' },
  summarizer: { primary: '#8b5cf6', secondary: '#a78bfa', glow: 'rgba(139,92,246,0.4)' },
  consensus: { primary: '#10b981', secondary: '#34d399', glow: 'rgba(16,185,129,0.4)' },
  translator: { primary: '#06b6d4', secondary: '#22d3ee', glow: 'rgba(6,182,212,0.4)' },
  accessibility: { primary: '#ec4899', secondary: '#f472b6', glow: 'rgba(236,72,153,0.4)' },
};

const AGENT_ICONS: Record<string, typeof Shield> = {
  moderator: Shield,
  facilitator: Star,
  summarizer: Brain,
  consensus: Handshake,
  translator: Globe,
  accessibility: Accessibility,
};

const AGENT_LABELS: Record<string, string> = {
  moderator: 'Nexus',
  facilitator: 'Lumen',
  summarizer: 'Synthesis',
  consensus: 'Concord',
  translator: 'Babel',
  accessibility: 'Aegis',
};

const PHASE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  opening: { label: 'Opening', color: 'text-cosmic-accent', bg: 'bg-cosmic-accent/10 border-cosmic-accent/20' },
  debate: { label: 'Debate', color: 'text-cosmic-amber', bg: 'bg-cosmic-amber/10 border-cosmic-amber/20' },
  deliberation: { label: 'Deliberation', color: 'text-cosmic-violet', bg: 'bg-cosmic-violet/10 border-cosmic-violet/20' },
  consensus: { label: 'Consensus', color: 'text-cosmic-success', bg: 'bg-cosmic-success/10 border-cosmic-success/20' },
  closing: { label: 'Closing', color: 'text-cosmic-muted', bg: 'bg-white/5 border-white/10' },
};

/* ═══════════════════════════════════════════
   Utility Functions
   ═══════════════════════════════════════════ */

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function parseAgentConfig(agent: Agent): AvatarConfig {
  try {
    return JSON.parse(agent.avatarConfig);
  } catch {
    return { primaryColor: '#6366f1', secondaryColor: '#818cf8', shape: 'default', glowColor: 'rgba(99,102,241,0.4)', particleEffect: 'default' };
  }
}

/* ═══════════════════════════════════════════
   Canvas Drawing Functions
   ═══════════════════════════════════════════ */

interface Star {
  x: number; y: number; size: number; speed: number; brightness: number;
}

interface SpeechBubble {
  x: number; y: number; text: string; opacity: number; createdAt: number; color: string;
}

function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], time: number, w: number, h: number) {
  for (const star of stars) {
    const twinkle = 0.5 + 0.5 * Math.sin(time * 0.001 * star.speed * 5000 + star.x * 100);
    const alpha = star.brightness * twinkle;
    const sx = ((star.x + time * star.speed * 0.02) % 1) * w;
    const sy = star.y * h;
    ctx.beginPath();
    ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
    ctx.fill();
  }
}

function drawEnergyAura(ctx: CanvasRenderingContext2D, energyLevel: number, w: number, h: number, time: number) {
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.max(w, h) * 0.6;

  // Calmer = deep blue, heated = purple/red
  const r = Math.round(20 + energyLevel * 80);
  const g = Math.round(10 + (1 - energyLevel) * 30);
  const b = Math.round(60 + (1 - energyLevel) * 60);

  const pulse = 1 + 0.05 * Math.sin(time * 0.001);
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * pulse);
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.12)`);
  grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.05)`);
  grad.addColorStop(1, 'transparent');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawTopicStar(ctx: CanvasRenderingContext2D, topic: string, consensusLevel: number, time: number, cx: number, cy: number, scaleFactor: number = 1) {
  const baseR = 40 * scaleFactor;
  const pulse = 1 + 0.08 * Math.sin(time * 0.002);
  const r = baseR * pulse;

  // Outer glow
  const outerGrad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 3);
  const hue = consensusLevel > 0.6 ? '52, 211, 153' : consensusLevel > 0.3 ? '45, 107, 255' : '155, 92, 255';
  outerGrad.addColorStop(0, `rgba(${hue}, 0.25)`);
  outerGrad.addColorStop(0.4, `rgba(${hue}, 0.08)`);
  outerGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 3, 0, Math.PI * 2);
  ctx.fill();

  // Inner star glow
  const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  innerGrad.addColorStop(0, `rgba(255, 255, 255, 0.9)`);
  innerGrad.addColorStop(0.3, `rgba(${hue}, 0.6)`);
  innerGrad.addColorStop(0.7, `rgba(${hue}, 0.2)`);
  innerGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Orbital rings around topic
  ctx.strokeStyle = `rgba(${hue}, 0.15)`;
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * (1.5 + i * 0.8), 0, Math.PI * 2);
    ctx.stroke();
  }

  // Topic text
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(11 * scaleFactor)}px "Space Grotesk", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const maxChars = 18;
  const displayTopic = topic.length > maxChars ? topic.slice(0, maxChars) + '...' : topic;
  ctx.fillText(displayTopic, cx, cy);

  // Consensus percentage
  ctx.font = `${Math.round(9 * scaleFactor)}px "Inter", system-ui, sans-serif`;
  ctx.fillStyle = `rgba(${hue}, 0.9)`;
  ctx.fillText(`${Math.round(consensusLevel * 100)}% consensus`, cx, cy + r + 16 * scaleFactor);
}

function drawParticipant(
  ctx: CanvasRenderingContext2D,
  participant: DebateParticipant & { index: number; total: number },
  time: number,
  cx: number,
  cy: number,
  isSpeaking: boolean,
  scaleFactor: number = 1
) {
  const { index, total, stance, displayName } = participant;
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 + time * 0.0003;
  const stanceRadius = (stance === 'support' ? 100 : stance === 'oppose' ? 160 : 130) * scaleFactor;
  const orbitR = stanceRadius + Math.sin(time * 0.001 + index) * 8 * scaleFactor;
  const x = cx + Math.cos(angle) * orbitR;
  const y = cy + Math.sin(angle) * orbitR;
  const avatarR = (isSpeaking ? 18 : 14) * scaleFactor;

  // Stance-based color
  const stanceColors: Record<string, string> = {
    support: '#34d399',
    oppose: '#f87171',
    neutral: '#94a3b8',
    unsure: '#fbbf24',
  };
  const color = stanceColors[stance] || stanceColors.neutral;

  // Speaking glow
  if (isSpeaking) {
    const glowGrad = ctx.createRadialGradient(x, y, avatarR * 0.5, x, y, avatarR * 3);
    glowGrad.addColorStop(0, `${color}40`);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x, y, avatarR * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Avatar circle with ring
  ctx.beginPath();
  ctx.arc(x, y, avatarR, 0, Math.PI * 2);
  ctx.fillStyle = `${color}20`;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = isSpeaking ? 2.5 : 1.5;
  ctx.stroke();

  // Initial letter
  const initial = (displayName || '?')[0].toUpperCase();
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.max(8, Math.round(avatarR * 0.9))}px "Space Grotesk", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initial, x, y);

  // Name label
  ctx.font = `${Math.max(6, Math.round(8 * scaleFactor))}px "Inter", system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(200, 215, 255, 0.7)';
  ctx.fillText(displayName.length > 10 ? displayName.slice(0, 10) + '..' : displayName, x, y + avatarR + 10 * scaleFactor);

  return { x, y };
}

function drawAIAgent(
  ctx: CanvasRenderingContext2D,
  agentType: string,
  index: number,
  time: number,
  w: number,
  h: number,
  cx: number,
  cy: number,
  isSpeaking: boolean,
  scaleFactor: number = 1
) {
  const colors = AGENT_COLORS[agentType] || AGENT_COLORS.moderator;
  const agentAngle = (index / 6) * Math.PI * 2 - Math.PI / 2;
  const agentOrbitR = Math.min(w, h) * 0.38;
  const drift = Math.sin(time * 0.0005 + index * 1.5) * 12;
  const x = cx + Math.cos(agentAngle) * agentOrbitR + drift * 0.3;
  const y = cy + Math.sin(agentAngle) * agentOrbitR + drift * 0.2;
  const size = (isSpeaking ? 28 : 22) * scaleFactor;
  const pulse = isSpeaking ? 1 + 0.15 * Math.sin(time * 0.005) : 1;

  // Outer glow
  const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, size * 2.5 * pulse);
  glowGrad.addColorStop(0, `${colors.primary}30`);
  glowGrad.addColorStop(0.5, `${colors.primary}10`);
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, size * 2.5 * pulse, 0, Math.PI * 2);
  ctx.fill();

  switch (agentType) {
    case 'moderator': {
      // Hexagonal shape
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2 + time * 0.0002;
        const px = x + Math.cos(a) * size * pulse;
        const py = y + Math.sin(a) * size * pulse;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = `${colors.primary}25`;
      ctx.fill();
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner hex
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + time * 0.0003;
        const px = x + Math.cos(a) * size * 0.6 * pulse;
        const py = y + Math.sin(a) * size * 0.6 * pulse;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = `${colors.secondary}60`;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Orbital dot
      const orbAngle = time * 0.003;
      ctx.beginPath();
      ctx.arc(x + Math.cos(orbAngle) * size * 1.3, y + Math.sin(orbAngle) * size * 1.3, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = colors.primary;
      ctx.fill();
      break;
    }
    case 'facilitator': {
      // Star burst
      const points = 8;
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? size * pulse : size * 0.5 * pulse;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = `${colors.primary}25`;
      ctx.fill();
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Sparkle particles
      for (let i = 0; i < 4; i++) {
        const sa = time * 0.002 + i * 1.57;
        const sr = size * (0.8 + 0.3 * Math.sin(time * 0.003 + i));
        const sparkleAlpha = 0.4 + 0.6 * Math.abs(Math.sin(time * 0.004 + i * 0.7));
        ctx.beginPath();
        ctx.arc(x + Math.cos(sa) * sr, y + Math.sin(sa) * sr, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 191, 36, ${sparkleAlpha})`;
        ctx.fill();
      }
      break;
    }
    case 'summarizer': {
      // Nebula swirl
      for (let i = 0; i < 3; i++) {
        const nebulaAngle = time * 0.001 + i * 2.09;
        const nebulaR = size * (0.7 + i * 0.15) * pulse;
        const grad = ctx.createRadialGradient(
          x + Math.cos(nebulaAngle) * 5,
          y + Math.sin(nebulaAngle) * 5,
          0,
          x, y, nebulaR
        );
        grad.addColorStop(0, `${colors.primary}30`);
        grad.addColorStop(0.5, `${colors.secondary}15`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, nebulaR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dust particles
      for (let i = 0; i < 6; i++) {
        const da = time * 0.0008 + i * 1.05;
        const dr = size * (0.4 + 0.5 * Math.sin(time * 0.002 + i));
        ctx.beginPath();
        ctx.arc(x + Math.cos(da) * dr, y + Math.sin(da) * dr, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `${i % 2 === 0 ? colors.primary : colors.secondary}80`;
        ctx.fill();
      }
      break;
    }
    case 'consensus': {
      // Constellation pattern
      const nodePositions = [
        { dx: 0, dy: -size * 0.7 },
        { dx: -size * 0.6, dy: -size * 0.2 },
        { dx: size * 0.6, dy: -size * 0.2 },
        { dx: -size * 0.4, dy: size * 0.5 },
        { dx: size * 0.4, dy: size * 0.5 },
        { dx: 0, dy: 0 },
      ];

      // Lines between nodes
      const connections = [[0,1],[0,2],[1,3],[2,4],[3,4],[5,0],[5,1],[5,2],[5,3],[5,4]];
      ctx.strokeStyle = `${colors.primary}40`;
      ctx.lineWidth = 0.8;
      for (const [a, b] of connections) {
        const na = nodePositions[a];
        const nb = nodePositions[b];
        ctx.beginPath();
        ctx.moveTo(x + na.dx * pulse, y + na.dy * pulse);
        ctx.lineTo(x + nb.dx * pulse, y + nb.dy * pulse);
        ctx.stroke();
      }

      // Node dots
      for (let i = 0; i < nodePositions.length; i++) {
        const n = nodePositions[i];
        const nodeAlpha = 0.5 + 0.5 * Math.sin(time * 0.003 + i * 0.8);
        ctx.beginPath();
        ctx.arc(x + n.dx * pulse, y + n.dy * pulse, i === 5 ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = i === 5 ? colors.primary : `${colors.secondary}${Math.round(nodeAlpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      }
      break;
    }
    case 'translator': {
      // Prism triangle
      ctx.beginPath();
      ctx.moveTo(x, y - size * pulse);
      ctx.lineTo(x + size * 0.87 * pulse, y + size * 0.5 * pulse);
      ctx.lineTo(x - size * 0.87 * pulse, y + size * 0.5 * pulse);
      ctx.closePath();
      ctx.fillStyle = `${colors.primary}20`;
      ctx.fill();
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Rainbow refraction lines
      const rainbowColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
      for (let i = 0; i < rainbowColors.length; i++) {
        const lineAlpha = 0.3 + 0.3 * Math.sin(time * 0.003 + i * 0.5);
        ctx.beginPath();
        ctx.moveTo(x + size * 0.87 * pulse, y + (i - 2.5) * 3);
        ctx.lineTo(x + size * 1.6 * pulse, y - size * 0.4 + i * 5);
        ctx.strokeStyle = rainbowColors[i] + Math.round(lineAlpha * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      break;
    }
    case 'accessibility': {
      // Shield shape
      ctx.beginPath();
      ctx.moveTo(x, y - size * pulse);
      ctx.bezierCurveTo(x + size * pulse, y - size * 0.6 * pulse, x + size * 0.9 * pulse, y + size * 0.2 * pulse, x, y + size * pulse);
      ctx.bezierCurveTo(x - size * 0.9 * pulse, y + size * 0.2 * pulse, x - size * pulse, y - size * 0.6 * pulse, x, y - size * pulse);
      ctx.fillStyle = `${colors.primary}20`;
      ctx.fill();
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Warm aura rings
      for (let i = 1; i <= 3; i++) {
        const ringAlpha = 0.15 - i * 0.04;
        ctx.beginPath();
        ctx.arc(x, y, (size + i * 8) * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `${colors.secondary}${Math.round(Math.max(ringAlpha, 0.03) * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Floating warm particles
      for (let i = 0; i < 3; i++) {
        const pa = time * 0.002 + i * 2.1;
        const pr = (size + 15) * pulse;
        ctx.beginPath();
        ctx.arc(x + Math.cos(pa) * pr, y + Math.sin(pa) * pr, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `${colors.secondary}80`;
        ctx.fill();
      }
      break;
    }
  }

  // Agent label
  ctx.font = `bold ${Math.max(6, Math.round(8 * scaleFactor))}px "Space Grotesk", system-ui, sans-serif`;
  ctx.fillStyle = colors.primary;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(AGENT_LABELS[agentType] || agentType, x, y + size + 6 * scaleFactor);
}

function drawConsensusLines(
  ctx: CanvasRenderingContext2D,
  participantPositions: Array<{ x: number; y: number; stance: string }>,
  consensusLevel: number
) {
  if (consensusLevel <= 0 || participantPositions.length < 2) return;

  const supportNodes = participantPositions.filter(p => p.stance === 'support');
  if (supportNodes.length < 2) return;

  const alpha = Math.min(consensusLevel * 0.6, 0.4);

  // Connect support nodes
  for (let i = 0; i < supportNodes.length; i++) {
    for (let j = i + 1; j < supportNodes.length; j++) {
      ctx.beginPath();
      ctx.moveTo(supportNodes[i].x, supportNodes[i].y);
      ctx.lineTo(supportNodes[j].x, supportNodes[j].y);
      ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Connect neutral to support if consensus is high
  if (consensusLevel > 0.4) {
    const neutralNodes = participantPositions.filter(p => p.stance === 'neutral' || p.stance === 'unsure');
    for (const neutral of neutralNodes) {
      const closest = supportNodes.reduce((best, s) => {
        const d = Math.hypot(s.x - neutral.x, s.y - neutral.y);
        return d < best.d ? { node: s, d } : best;
      }, { node: supportNodes[0], d: Infinity });
      ctx.beginPath();
      ctx.moveTo(neutral.x, neutral.y);
      ctx.lineTo(closest.node.x, closest.node.y);
      ctx.strokeStyle = `rgba(52, 211, 153, ${alpha * 0.5})`;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, opacity: number, color: string) {
  if (opacity <= 0) return;
  const maxW = 120;
  ctx.font = '9px "Inter", system-ui, sans-serif';
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxW) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (lines.length === 0) return;

  const lineH = 13;
  const padding = 8;
  const bubbleW = maxW + padding * 2;
  const bubbleH = lines.length * lineH + padding * 2;
  const bx = x - bubbleW / 2;
  const by = y - bubbleH - 20;

  ctx.globalAlpha = opacity;

  // Bubble background
  ctx.fillStyle = 'rgba(11, 16, 34, 0.9)';
  ctx.beginPath();
  ctx.roundRect(bx, by, bubbleW, bubbleH, 8);
  ctx.fill();
  ctx.strokeStyle = `${color}60`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Tail
  ctx.beginPath();
  ctx.moveTo(x - 4, by + bubbleH);
  ctx.lineTo(x, by + bubbleH + 6);
  ctx.lineTo(x + 4, by + bubbleH);
  ctx.fillStyle = 'rgba(11, 16, 34, 0.9)';
  ctx.fill();

  // Text
  ctx.fillStyle = '#F2F5FF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], bx + padding, by + padding + i * lineH);
  }

  ctx.globalAlpha = 1;
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.7);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(1, 'rgba(4, 5, 11, 0.6)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/* ═══════════════════════════════════════════
   Cosmic Debate Canvas Component
   ═══════════════════════════════════════════ */

function CosmicDebateCanvas({
  debate,
  speakingId,
  speechBubbles,
}: {
  debate: DebateSession;
  speakingId: string | null;
  speechBubbles: SpeechBubble[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>();
  const starsRef = useRef<Star[]>([]);
  const initializedRef = useRef(false);

  // Initialize stars once
  if (!initializedRef.current) {
    starsRef.current = Array.from({ length: 200 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 1.8 + 0.2,
      speed: Math.random() * 0.0002 + 0.00005,
      brightness: Math.random() * 0.6 + 0.2,
    }));
    initializedRef.current = true;
  }

  // Resize canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const humanParticipants = debate.participants?.filter(p => p.role !== 'ai_agent') || [];
    const aiAgentTypes = ['moderator', 'facilitator', 'summarizer', 'consensus', 'translator', 'accessibility'];

    function animate(time: number) {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#04050b';
      ctx.fillRect(0, 0, w, h);

      // Energy aura
      drawEnergyAura(ctx, debate.energyLevel || 0.5, w, h, time);

      // Stars
      drawStars(ctx, starsRef.current, time, w, h);

      const scaleFactor = Math.min(w, h) / 400;

      // Consensus constellation lines
      const participantPositions: Array<{ x: number; y: number; stance: string }> = [];
      for (let i = 0; i < humanParticipants.length; i++) {
        const p = humanParticipants[i];
        const angle = (i / Math.max(humanParticipants.length, 1)) * Math.PI * 2 + time * 0.0003;
        const stanceRadius = (p.stance === 'support' ? 100 : p.stance === 'oppose' ? 160 : 130) * scaleFactor;
        const orbitR = stanceRadius + Math.sin(time * 0.001 + i) * 8 * scaleFactor;
        participantPositions.push({
          x: cx + Math.cos(angle) * orbitR,
          y: cy + Math.sin(angle) * orbitR,
          stance: p.stance,
        });
      }
      drawConsensusLines(ctx, participantPositions, debate.consensusLevel || 0);

      // Topic star
      drawTopicStar(ctx, debate.topic, debate.consensusLevel || 0, time, cx, cy, scaleFactor);

      // AI Agent entities
      for (let i = 0; i < aiAgentTypes.length; i++) {
        const agentType = aiAgentTypes[i];
        const agentParticipant = debate.participants?.find(p => p.agentType === agentType);
        const isSpeaking = speakingId === agentParticipant?.id;
        drawAIAgent(ctx, agentType, i, time, w, h, cx, cy, isSpeaking, scaleFactor);
      }

      // Human participants
      for (let i = 0; i < humanParticipants.length; i++) {
        const p = humanParticipants[i];
        const isSpeaking = speakingId === p.id;
        drawParticipant(ctx, { ...p, index: i, total: humanParticipants.length }, time, cx, cy, isSpeaking, scaleFactor);
      }

      // Speech bubbles
      const now = Date.now();
      for (const bubble of speechBubbles) {
        const age = now - bubble.createdAt;
        const maxAge = 3000;
        if (age < maxAge) {
          const opacity = age > maxAge * 0.7 ? 1 - (age - maxAge * 0.7) / (maxAge * 0.3) : Math.min(age / 200, 1);
          drawSpeechBubble(ctx, bubble.x, bubble.y, bubble.text, opacity * 0.9, bubble.color);
        }
      }

      // Vignette
      drawVignette(ctx, w, h);

      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [debate, speakingId, speechBubbles]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ background: '#04050b' }}
    />
  );
}

/* ═══════════════════════════════════════════
   Agent Preview Card (Lobby)
   ═══════════════════════════════════════════ */

function AgentPreviewCard({ agent }: { agent: Agent }) {
  const config = parseAgentConfig(agent);
  const Icon = AGENT_ICONS[agent.type] || Shield;
  const label = AGENT_LABELS[agent.type] || agent.type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-[#0B1022] border-white/5 hover:border-white/10 transition-all group h-full">
        <CardContent className="p-4 text-center">
          {/* Mini cosmic avatar */}
          <div className="relative w-16 h-16 mx-auto mb-3" style={{ animation: 'floatDrift 4s ease-in-out infinite' }}>
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, ${config.glowColor}, transparent 70%)`,
                animation: 'pulseGlow 3s ease-in-out infinite',
              }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ filter: `drop-shadow(0 0 8px ${config.primaryColor})` }}
            >
              <Icon className="w-6 h-6" style={{ color: config.primaryColor }} />
            </div>
          </div>

          <h4 className="text-sm font-bold font-heading">{agent.name}</h4>
          <p className="text-[10px] text-cosmic-muted mt-0.5">{label}</p>

          <div className="flex items-center justify-center gap-1.5 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cosmic-success" style={{ boxShadow: '0 0 4px rgba(52, 211, 153, 0.6)' }} />
            <span className="text-[9px] text-cosmic-success">Active</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Message Bubble Component
   ═══════════════════════════════════════════ */

function MessageBubble({ message, isNew }: { message: DebateMessage; isNew: boolean }) {
  const isAI = !!message.agentType;
  const agentColors = message.agentType ? AGENT_COLORS[message.agentType] : null;
  const displayName = message.participant?.displayName || message.user?.name || 'Unknown';
  const Icon = message.agentType ? (AGENT_ICONS[message.agentType] || Shield) : null;

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 10, scale: 0.95 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex gap-2.5 ${isAI ? '' : ''}`}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
        style={{
          background: isAI && agentColors ? `${agentColors.primary}20` : 'rgba(45, 107, 255, 0.15)',
          border: isAI && agentColors ? `1.5px solid ${agentColors.primary}50` : '1.5px solid rgba(45, 107, 255, 0.2)',
          boxShadow: isAI && agentColors ? `0 0 12px ${agentColors.primary}20` : 'none',
        }}
      >
        {isAI && Icon ? (
          <Icon className="w-3.5 h-3.5" style={{ color: agentColors?.primary }} />
        ) : (
          <span style={{ color: 'rgba(45, 107, 255, 0.9)' }}>{displayName[0].toUpperCase()}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="text-xs font-semibold"
            style={{ color: isAI && agentColors ? agentColors.primary : '#F2F5FF' }}
          >
            {displayName}
          </span>
          {isAI && (
            <Badge
              className="text-[8px] px-1.5 py-0 rounded-full border-0"
              style={{
                background: agentColors ? `${agentColors.primary}15` : 'rgba(99,102,241,0.1)',
                color: agentColors?.primary,
              }}
            >
              AI
            </Badge>
          )}
          <span className="text-[9px] text-cosmic-muted">{timeAgo(message.createdAt)}</span>
        </div>
        <div
          className="text-sm leading-relaxed rounded-lg px-3 py-2"
          style={{
            background: isAI && agentColors ? `${agentColors.primary}08` : 'rgba(255,255,255,0.03)',
            border: isAI && agentColors ? `1px solid ${agentColors.primary}15` : '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {message.content}
        </div>
        {/* Show translated/simplified content if available */}
        {message.simplifiedContent && (
          <div className="mt-1 text-xs text-cosmic-muted bg-pink-500/5 border border-pink-500/10 rounded-lg px-3 py-1.5">
            <span className="text-pink-400 font-medium text-[10px] mr-1">Simplified:</span>
            {message.simplifiedContent}
          </div>
        )}
        {message.translatedContent && (
          <div className="mt-1 text-xs text-cosmic-muted bg-cyan-500/5 border border-cyan-500/10 rounded-lg px-3 py-1.5">
            <span className="text-cyan-400 font-medium text-[10px] mr-1">Translated ({message.targetLang}):</span>
            {message.translatedContent}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   Create Debate Modal
   ═══════════════════════════════════════════ */

function CreateDebateModal({
  open,
  onClose,
  onCreate,
  creating,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { title: string; description: string; topic: string; isPublic: boolean; maxParticipants: number }) => void;
  creating: boolean;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [maxParticipants, setMaxParticipants] = useState(50);

  const handleSubmit = () => {
    if (!title.trim() || !topic.trim()) return;
    onCreate({ title: title.trim(), description: description.trim(), topic: topic.trim(), isPublic, maxParticipants });
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-lg"
          style={{
            background: 'linear-gradient(145deg, rgba(12, 16, 32, 0.95), rgba(5, 8, 19, 0.95))',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(242, 245, 255, 0.1)',
            borderRadius: '20px',
            boxShadow: '0 0 60px rgba(45, 107, 255, 0.1), 0 30px 80px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cosmic-accent/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cosmic-accent" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base">Launch New Assembly</h3>
                <p className="text-[11px] text-cosmic-muted">Start a cosmic debate session</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <X className="w-4 h-4 text-cosmic-muted" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <div>
              <Label className="text-xs text-cosmic-muted mb-1.5 block">Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Budget Allocation for 2026"
                className="bg-white/5 border-white/10 text-sm rounded-xl placeholder:text-cosmic-muted/50 focus:border-cosmic-accent/50"
              />
            </div>

            <div>
              <Label className="text-xs text-cosmic-muted mb-1.5 block">Topic *</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., How should we distribute the city budget?"
                className="bg-white/5 border-white/10 text-sm rounded-xl placeholder:text-cosmic-muted/50 focus:border-cosmic-accent/50"
              />
            </div>

            <div>
              <Label className="text-xs text-cosmic-muted mb-1.5 block">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide context for the debate..."
                rows={3}
                className="bg-white/5 border-white/10 text-sm rounded-xl placeholder:text-cosmic-muted/50 focus:border-cosmic-accent/50 resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs text-cosmic-muted block">Public Assembly</Label>
                <p className="text-[10px] text-cosmic-muted/60 mt-0.5">Anyone can discover and join</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-cosmic-muted">Max Participants</Label>
                <span className="text-xs font-mono text-cosmic-accent">{maxParticipants}</span>
              </div>
              <Slider
                value={[maxParticipants]}
                onValueChange={([v]) => setMaxParticipants(v)}
                min={5}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-[9px] text-cosmic-muted/50 mt-1">
                <span>5</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-white/5 flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/10 text-cosmic-muted hover:text-white rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || !topic.trim() || creating}
              className="flex-1 bg-cosmic-accent text-white rounded-xl hover:bg-cosmic-accent/90 relative overflow-hidden"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Rocket className="w-4 h-4 mr-2" />
              )}
              {creating ? 'Launching...' : 'Launch Assembly'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════
   Lobby Animated Stars Background
   ═══════════════════════════════════════════ */

function LobbyStarsBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated stars via CSS */}
      {Array.from({ length: 50 }, (_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            background: `rgba(200, 220, 255, ${0.2 + Math.random() * 0.6})`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `starPulse ${2 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
      {/* Shooting star */}
      <div className="shooting-star" style={{ top: '15%', left: '10%', animationDelay: '0s' }} />
      <div className="shooting-star" style={{ top: '40%', left: '60%', animationDelay: '4s' }} />
      {/* Nebula blobs */}
      <div
        className="absolute w-80 h-80 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%)',
          top: '10%',
          right: '-5%',
          animation: 'nebulaDrift 12s ease-in-out infinite alternate',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute w-64 h-64 rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(46,230,199,0.25), transparent 70%)',
          bottom: '15%',
          left: '-5%',
          animation: 'nebulaDrift 10s ease-in-out infinite alternate-reverse',
          filter: 'blur(35px)',
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════ */

export default function AssemblyHallPage() {
  // ── State ──
  const [agents, setAgents] = useState<Agent[]>([]);
  const [debates, setDebates] = useState<DebateSession[]>([]);
  const [currentDebate, setCurrentDebate] = useState<DebateSession | null>(null);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubble[]>([]);
  const [targetLang, setTargetLang] = useState('en');
  const [simplifyLevel, setSimplifyLevel] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const newMessageIdsRef = useRef<Set<string>>(new Set());

  // ── Fetch initial data ──
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

  // ── Join a debate ──
  const joinDebate = useCallback(async (debateId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/ai/debate/${debateId}`);
      if (!res.ok) throw new Error('Failed to load debate');
      const data: DebateSession = await res.json();
      setCurrentDebate(data);
      setMessages(data.messages || []);
    } catch {
      setError('Failed to join debate session');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Create a debate ──
  const createDebate = useCallback(async (data: {
    title: string;
    description: string;
    topic: string;
    isPublic: boolean;
    maxParticipants: number;
  }) => {
    setCreating(true);
    try {
      const res = await fetch('/api/ai/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create debate');
      const debate: DebateSession = await res.json();
      setCurrentDebate(debate);
      setMessages([]);
      setShowCreateModal(false);
    } catch {
      setError('Failed to create debate session');
    } finally {
      setCreating(false);
    }
  }, []);

  // ── Send message ──
  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !currentDebate || sending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);
    setSpeakingId('user-current');

    // Optimistic message
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: DebateMessage = {
      id: optimisticId,
      content,
      type: 'statement',
      agentType: null,
      sentiment: 'neutral',
      createdAt: new Date().toISOString(),
      participant: { id: 'user-current', displayName: 'You', role: 'participant', agentType: null },
      user: { id: '', name: 'You', avatarUrl: null },
    };
    setMessages(prev => [...prev, optimisticMsg]);
    newMessageIdsRef.current.add(optimisticId);

    // Add speech bubble
    setSpeechBubbles(prev => [...prev, {
      x: 300, y: 250, text: content, opacity: 1, createdAt: Date.now(), color: '#2D6BFF',
    }]);

    try {
      const res = await fetch(`/api/ai/debate/${currentDebate.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          type: 'statement',
          targetLang: targetLang !== 'en' ? targetLang : undefined,
          simplifyLevel: simplifyLevel || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      const data = await res.json();

      // Replace optimistic message with real one
      if (data.userMessage) {
        setMessages(prev => prev.map(m => m.id === optimisticId ? data.userMessage : m));
        newMessageIdsRef.current.delete(optimisticId);
        newMessageIdsRef.current.add(data.userMessage.id);
      }

      // Add AI responses with delay for typing effect
      if (data.aiResponses && Array.isArray(data.aiResponses)) {
        for (let i = 0; i < data.aiResponses.length; i++) {
          const aiResp = data.aiResponses[i];
          const agentColors = AGENT_COLORS[aiResp.agentType];
          const agentName = AGENT_LABELS[aiResp.agentType] || aiResp.agentType;

          setTimeout(() => {
            const aiMsg: DebateMessage = {
              id: aiResp.id,
              content: aiResp.content,
              type: aiResp.type,
              agentType: aiResp.agentType,
              sentiment: 'neutral',
              createdAt: new Date().toISOString(),
              participant: { id: `ai-${aiResp.agentType}`, displayName: agentName, role: 'ai_agent', agentType: aiResp.agentType },
            };

            setMessages(prev => [...prev, aiMsg]);
            newMessageIdsRef.current.add(aiMsg.id);
            setSpeakingId(`ai-${aiResp.agentType}`);

            // AI speech bubble
            const bubbleAngle = Math.random() * Math.PI * 2;
            setSpeechBubbles(prev => [...prev, {
              x: 300 + Math.cos(bubbleAngle) * 120,
              y: 250 + Math.sin(bubbleAngle) * 120,
              text: aiResp.content.slice(0, 60),
              opacity: 1,
              createdAt: Date.now(),
              color: agentColors?.primary || '#6366f1',
            }]);

            setTimeout(() => setSpeakingId(null), 2000);
          }, 800 + i * 1200);
        }
      }

      // Update debate energy
      if (data.userMessage) {
        setCurrentDebate(prev => prev ? {
          ...prev,
          energyLevel: Math.min(1, (prev.energyLevel || 0.5) + 0.05),
          status: prev.status === 'waiting' ? 'active' : prev.status,
        } : null);
      }
    } catch {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      newMessageIdsRef.current.delete(optimisticId);
      setError('Failed to send message. Try again.');
    } finally {
      setSending(false);
      setTimeout(() => setSpeakingId(null), 1500);
    }
  }, [messageInput, currentDebate, sending, targetLang, simplifyLevel]);

  // ── Poll for new messages ──
  useEffect(() => {
    if (!currentDebate || polling) return;

    const interval = setInterval(async () => {
      setPolling(true);
      try {
        const res = await fetch(`/api/ai/debate/${currentDebate.id}/messages`);
        if (res.ok) {
          const data: DebateMessage[] = await res.json();
          const existingIds = new Set(messages.map(m => m.id));
          const newMsgs = data.filter(m => !existingIds.has(m.id));
          if (newMsgs.length > 0) {
            setMessages(prev => [...prev, ...newMsgs]);
            newMsgs.forEach(m => newMessageIdsRef.current.add(m.id));
          }
        }

        // Also refresh debate state
        const debateRes = await fetch(`/api/ai/debate/${currentDebate.id}`);
        if (debateRes.ok) {
          const debateData: DebateSession = await debateRes.json();
          setCurrentDebate(prev => prev ? {
            ...prev,
            consensusLevel: debateData.consensusLevel,
            energyLevel: debateData.energyLevel,
            phase: debateData.phase,
            status: debateData.status,
            participants: debateData.participants || prev.participants,
          } : null);
        }
      } catch {
        // Silently fail on poll errors
      } finally {
        setPolling(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentDebate, messages, polling]);

  // ── Auto-scroll messages ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Clean old speech bubbles ──
  useEffect(() => {
    const interval = setInterval(() => {
      setSpeechBubbles(prev => prev.filter(b => Date.now() - b.createdAt < 3500));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Leave debate ──
  const leaveDebate = useCallback(() => {
    setCurrentDebate(null);
    setMessages([]);
    setSpeechBubbles([]);
    setSpeakingId(null);
    // Refresh debates list
    fetch('/api/ai/debate?status=active')
      .then(r => r.json())
      .then(data => setDebates(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // ── Loading state ──
  if (loading && !currentDebate) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-cosmic-accent/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cosmic-accent" style={{ animation: 'orbitSpin 1s linear infinite' }} />
            <div className="absolute inset-2 rounded-full border border-transparent border-t-cosmic-teal" style={{ animation: 'orbitSpin 1.5s linear infinite reverse' }} />
            <Rocket className="absolute inset-0 m-auto w-6 h-6 text-cosmic-accent" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cosmic-accent animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-cosmic-teal animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-cosmic-violet animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-cosmic-muted text-sm">Entering the Assembly Hall...</span>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     STATE 2: Active Debate Session
     ═══════════════════════════════════════════ */
  if (currentDebate) {
    const phaseConfig = PHASE_CONFIG[currentDebate.phase] || PHASE_CONFIG.opening;
    const consensusPct = Math.round((currentDebate.consensusLevel || 0) * 100);

    return (
      <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : '-m-4 lg:-m-8'}`} style={{ background: '#04050b' }}>
        {/* Top bar */}
        <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#04050b]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={leaveDebate}
              className="text-cosmic-muted hover:text-white shrink-0 h-7 px-2"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
              Back
            </Button>
            <div className="min-w-0">
              <h2 className="text-sm font-heading font-bold truncate">{currentDebate.title}</h2>
              <p className="text-[10px] text-cosmic-muted truncate">{currentDebate.topic}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Phase badge */}
            <Badge variant="outline" className={`text-[10px] rounded-full border ${phaseConfig.bg} ${phaseConfig.color}`}>
              <Circle className="w-1.5 h-1.5 mr-1 fill-current" />
              {phaseConfig.label}
            </Badge>

            {/* Consensus */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-cosmic-muted hidden sm:block">Consensus</span>
              <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${consensusPct}%`,
                    background: consensusPct > 60 ? 'linear-gradient(90deg, #10b981, #34d399)' : consensusPct > 30 ? 'linear-gradient(90deg, #2D6BFF, #5B8FFF)' : 'linear-gradient(90deg, #9B5CFF, #c084fc)',
                  }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-cosmic-success">{consensusPct}%</span>
            </div>

            {/* Fullscreen toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-cosmic-muted hover:text-white h-7 w-7 p-0"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {/* Main content: Canvas + Chat */}
        <div className="flex-grow flex flex-col lg:flex-row min-h-0">
          {/* Left Panel: Cosmic Canvas */}
          <div className="relative lg:w-[70%] h-[45vh] lg:h-auto min-h-[300px]">
            <CosmicDebateCanvas
              debate={currentDebate}
              speakingId={speakingId}
              speechBubbles={speechBubbles}
            />

            {/* Overlay: Participants count */}
            <div className="absolute top-3 left-3 glass-card rounded-xl px-3 py-2 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-cosmic-teal" />
              <span className="text-[11px] text-cosmic-muted">
                {currentDebate.participants?.length || 0} participants
              </span>
            </div>

            {/* Overlay: Energy level */}
            <div className="absolute top-3 right-3 glass-card rounded-xl px-3 py-2 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cosmic-amber" />
              <span className="text-[11px] text-cosmic-muted">
                Energy: {Math.round((currentDebate.energyLevel || 0.5) * 100)}%
              </span>
            </div>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 glass-card rounded-xl px-3 py-2">
              <div className="flex items-center gap-3 text-[9px] text-cosmic-muted">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Support</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Oppose</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" /> Neutral</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Chat/Messages */}
          <div className="lg:w-[30%] flex flex-col border-l border-white/5 bg-[#04050b] min-h-0">
            {/* Chat header */}
            <div className="shrink-0 px-4 py-3 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cosmic-accent" />
                  <span className="text-sm font-heading font-bold">Assembly Chat</span>
                </div>
                <Badge variant="outline" className="text-[9px] rounded-full border-white/10 text-cosmic-muted">
                  {messages.length} messages
                </Badge>
              </div>

              {/* Consensus bar */}
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-cosmic-muted">Consensus Level</span>
                  <span className="text-cosmic-success font-mono font-bold">{consensusPct}%</span>
                </div>
                <Progress value={consensusPct} className="h-1.5" />
              </div>
            </div>

            {/* Messages list */}
            <ScrollArea className="flex-grow min-h-0">
              <div className="p-4 space-y-4">
                {/* Pinned messages */}
                {messages.filter(m => m.isPinned).map(m => (
                  <div key={`pinned-${m.id}`} className="bg-cosmic-amber/5 border border-cosmic-amber/15 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Eye className="w-3 h-3 text-cosmic-amber" />
                      <span className="text-[9px] text-cosmic-amber font-medium">Pinned Summary</span>
                    </div>
                    <p className="text-xs text-cosmic-muted">{m.content}</p>
                  </div>
                ))}

                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-2xl bg-cosmic-accent/10 flex items-center justify-center mx-auto mb-3">
                      <Waves className="w-6 h-6 text-cosmic-accent/40" />
                    </div>
                    <p className="text-sm text-cosmic-muted">The assembly is quiet...</p>
                    <p className="text-xs text-cosmic-muted/50 mt-1">Be the first to speak!</p>
                  </div>
                )}

                {messages.map(m => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isNew={newMessageIdsRef.current.has(m.id)}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="shrink-0 p-3 border-t border-white/5 bg-[#070A12]">
              {/* Options row */}
              <div className="flex items-center gap-2 mb-2">
                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger className="h-7 text-[10px] bg-white/5 border-white/10 rounded-lg w-[100px]">
                    <Languages className="w-3 h-3 mr-1 text-cosmic-teal" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0B1022] border-white/10">
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={simplifyLevel} onValueChange={setSimplifyLevel}>
                  <SelectTrigger className="h-7 text-[10px] bg-white/5 border-white/10 rounded-lg w-[100px]">
                    <BookOpen className="w-3 h-3 mr-1 text-pink-400" />
                    <SelectValue placeholder="Simplify" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0B1022] border-white/10">
                    <SelectItem value="">Off</SelectItem>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="eli5">ELI5</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] text-cosmic-amber hover:text-cosmic-amber px-2"
                  title="Raise Hand"
                >
                  <Hand className="w-3.5 h-3.5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] text-cosmic-success hover:text-cosmic-success px-2"
                  title="Consensus Check"
                >
                  <Vote className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Input row */}
              <div className="flex items-center gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Share your thoughts with the assembly..."
                  className="bg-white/5 border-white/10 text-sm rounded-xl placeholder:text-cosmic-muted/40 focus:border-cosmic-accent/50"
                  disabled={sending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || sending}
                  size="sm"
                  className="bg-cosmic-accent text-white rounded-xl h-9 w-9 p-0 shrink-0"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     STATE 1: Lobby / No active debate
     ═══════════════════════════════════════════ */

  const activeDebates = debates.filter(d => d.status === 'active' || d.status === 'waiting');

  return (
    <div className="space-y-8 relative">
      <LobbyStarsBackground />

      {/* Error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cosmic-rose/10 border border-cosmic-rose/20 rounded-xl px-4 py-3 flex items-center justify-between"
        >
          <span className="text-sm text-cosmic-rose">{error}</span>
          <button onClick={() => setError(null)} className="text-cosmic-rose hover:text-cosmic-rose/80">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl glass-card p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(46,230,199,0.1), transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(155,92,255,0.06), transparent 60%)' }} />
        </div>

        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="cosmic-badge rounded-full px-3 py-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cosmic-accent" />
              <span className="text-xs font-medium text-cosmic-accent">
                {activeDebates.length} Live {activeDebates.length === 1 ? 'Assembly' : 'Assemblies'}
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-4">
            <span className="text-gradient">AI Assembly Hall</span>
          </h1>

          <p className="text-cosmic-muted text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-4 sm:mb-8">
            Enter the cosmic debate space where six AI agents orbit the discourse — moderating, facilitating,
            synthesizing, building consensus, translating, and ensuring every voice is heard.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-cosmic-accent text-white rounded-xl px-6 h-11 text-sm font-medium"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Launch Assembly
            </Button>
            {activeDebates.length > 0 && (
              <Button
                variant="outline"
                className="border-white/10 text-cosmic-muted hover:text-white hover:border-white/20 rounded-xl px-6 h-11"
                onClick={() => {
                  const el = document.getElementById('active-debates');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Join Live Debate <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Animated orbit preview */}
          <div className="relative w-48 h-48 mx-auto mt-10">
            <div className="absolute inset-0 rounded-full border border-white/5" style={{ animation: 'orbitSpin 20s linear infinite' }}>
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-indigo-500" style={{ boxShadow: '0 0 10px rgba(99,102,241,0.6)' }} />
            </div>
            <div className="absolute inset-4 rounded-full border border-white/5" style={{ animation: 'orbitSpin 14s linear infinite reverse' }}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-500" style={{ boxShadow: '0 0 8px rgba(245,158,11,0.6)' }} />
            </div>
            <div className="absolute inset-8 rounded-full border border-white/5" style={{ animation: 'orbitSpin 10s linear infinite' }}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-violet-500" style={{ boxShadow: '0 0 8px rgba(139,92,246,0.6)' }} />
            </div>
            <div className="absolute inset-12 rounded-full border border-white/5" style={{ animation: 'orbitSpin 8s linear infinite reverse' }}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 8px rgba(16,185,129,0.6)' }} />
            </div>
            {/* Center star */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full" style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(45,107,255,0.4), transparent)',
                boxShadow: '0 0 30px rgba(45,107,255,0.3)',
                animation: 'pulseGlow 3s ease-in-out infinite',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Agents Preview ── */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cosmic-violet" />
              AI Assembly Agents
            </h2>
            <p className="text-sm text-cosmic-muted mt-1">Six cosmic entities ready to guide your assembly</p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4">
          {agents.length > 0 ? agents.map((agent) => (
            <AgentPreviewCard key={agent.id} agent={agent} />
          )) : (
            // Default agents if API hasn't been seeded
            ['moderator', 'facilitator', 'summarizer', 'consensus', 'translator', 'accessibility'].map((type) => (
              <AgentPreviewCard
                key={type}
                agent={{
                  id: type,
                  type,
                  name: AGENT_LABELS[type],
                  description: '',
                  personality: '{}',
                  capabilities: '[]',
                  avatarConfig: JSON.stringify({
                    primaryColor: AGENT_COLORS[type]?.primary || '#6366f1',
                    secondaryColor: AGENT_COLORS[type]?.secondary || '#818cf8',
                    glowColor: AGENT_COLORS[type]?.glow || 'rgba(99,102,241,0.4)',
                    shape: 'default',
                    particleEffect: 'default',
                  }),
                  systemPrompt: '',
                  isActive: true,
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Active Debates ── */}
      <div id="active-debates" className="scroll-mt-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold font-heading flex items-center gap-2">
              <Activity className="w-5 h-5 text-cosmic-teal" />
              Live Assemblies
            </h2>
            <p className="text-sm text-cosmic-muted mt-1">Join an active debate or start your own</p>
          </div>
        </div>

        {activeDebates.length === 0 ? (
          <Card className="bg-[#0B1022] border-white/5">
            <CardContent className="p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-cosmic-teal/10 flex items-center justify-center mx-auto mb-4">
                <Waves className="w-7 h-7 text-cosmic-teal/40" />
              </div>
              <h3 className="text-base font-semibold font-heading mb-1">No Active Assemblies</h3>
              <p className="text-sm text-cosmic-muted mb-4">Launch a new assembly to see AI agents in action.</p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-cosmic-accent text-white rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" /> Launch Assembly
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {activeDebates.map((debate, i) => {
              const pct = Math.round((debate.consensusLevel || 0) * 100);
              const phaseCfg = PHASE_CONFIG[debate.phase] || PHASE_CONFIG.opening;
              return (
                <motion.div
                  key={debate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <Card className="bg-[#0B1022] border-white/5 hover:border-white/10 transition-all group cursor-pointer" onClick={() => joinDebate(debate.id)}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 flex-grow">
                          <h4 className="text-sm font-semibold truncate group-hover:text-cosmic-accent transition-colors">{debate.title}</h4>
                          <p className="text-xs text-cosmic-muted mt-0.5 truncate">{debate.topic}</p>
                        </div>
                        <div className="flex items-center gap-1.5 ml-3 shrink-0">
                          <div className="w-2 h-2 rounded-full bg-cosmic-rose animate-pulse" style={{ boxShadow: '0 0 6px rgba(255, 94, 138, 0.6)' }} />
                          <span className="text-[10px] text-cosmic-rose font-medium uppercase tracking-wider">Live</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-cosmic-muted mb-3">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {debate.participants?.length || debate.participantCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {debate._count?.messages || 0}
                        </span>
                        <Badge variant="outline" className={`text-[9px] rounded-full border ${phaseCfg.bg} ${phaseCfg.color} ml-auto`}>
                          {phaseCfg.label}
                        </Badge>
                      </div>

                      {/* Consensus bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-cosmic-muted">Consensus</span>
                          <span className="text-cosmic-success font-mono font-bold">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              background: 'linear-gradient(90deg, #10b981, #34d399)',
                            }}
                          />
                        </div>
                      </div>

                      <Button size="sm" className="w-full bg-cosmic-accent/10 text-cosmic-accent hover:bg-cosmic-accent hover:text-white rounded-xl h-8 text-xs transition-all">
                        Enter Assembly <ArrowUpRight className="w-3 h-3 ml-1.5" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── How It Works ── */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold font-heading">How the Assembly Works</h2>
          <p className="text-sm text-cosmic-muted mt-1">AI agents seamlessly guide your democratic process</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 sm:gap-6">
          {[
            {
              step: '01',
              title: 'Launch or Join',
              desc: 'Start a new assembly or join a live debate. All 6 AI agents activate automatically.',
              icon: Rocket,
              color: '#2D6BFF',
            },
            {
              step: '02',
              title: 'AI Agents Orchestrate',
              desc: 'Nexus moderates, Lumen facilitates, Synthesis summarizes, Concord builds consensus, Babel translates, Aegis ensures access.',
              icon: Sparkles,
              color: '#9B5CFF',
            },
            {
              step: '03',
              title: 'Reach Consensus',
              desc: 'Watch the consensus constellation grow in real-time as common ground emerges between participants.',
              icon: Handshake,
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
                <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${item.color}, transparent)`, opacity: 0.5 }} />
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${item.color}12` }}>
                      <item.icon className="w-6 h-6" style={{ color: item.color }} />
                    </div>
                    <span className="text-3xl font-bold font-heading text-white/10">{item.step}</span>
                  </div>
                  <h3 className="text-base font-semibold font-heading mb-2">{item.title}</h3>
                  <p className="text-sm text-cosmic-muted leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Create Debate Modal ── */}
      <CreateDebateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={createDebate}
        creating={creating}
      />
    </div>
  );
}
