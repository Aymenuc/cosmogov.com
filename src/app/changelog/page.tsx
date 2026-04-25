'use client';

import Link from 'next/link';
import { Rocket, Sparkles, Bug, Wrench } from 'lucide-react';
import Footer from '@/components/Footer';

function Starfield() {
  return <div className="fixed inset-0 starfield opacity-20 pointer-events-none" />;
}

const versions = [
  {
    version: 'v0.4.0',
    date: 'April 22, 2026',
    accent: '#2EE6C7',
    features: [
      'Participatory Budgeting module — citizens can now propose, discuss, and vote on budget allocations with real-time tracking of fund distribution and implementation milestones.',
      'Accountability Tracker — every approved proposal now has a dedicated tracking page with milestones, evidence uploads, and transparency scores so communities can follow through from vote to impact.',
      'AI-Powered Bias Detection — our AI assistant now automatically scans proposals and deliberations for common cognitive biases including anchoring, confirmation bias, and groupthink, providing real-time alerts and suggested counterarguments.',
      'Enhanced reputation system with XP multipliers for consistent participation and streak bonuses for weekly engagement.',
    ],
    fixes: [
      'Fixed a race condition that could cause duplicate votes under high concurrency during large community votes.',
      'Resolved an issue where proposal descriptions with special characters were not rendering correctly in the mobile view.',
      'Corrected timezone handling for proposal deadlines, which previously showed incorrect end times for users in UTC+ offset regions.',
    ],
    improvements: [
      'Dashboard loading time reduced by 40% through query optimization and client-side caching improvements.',
      'Upgraded the real-time notification system to use WebSocket connections for instant delivery instead of polling.',
    ],
  },
  {
    version: 'v0.3.0',
    date: 'March 15, 2026',
    accent: '#9B5CFF',
    features: [
      'Assemblies module — ongoing deliberative spaces where communities can discuss, debate, and decide together in persistent conversation threads with structured agendas.',
      'Citizen Initiatives — create petitions, gather digital signatures, and trigger official responses when support thresholds are reached. Includes verification to prevent duplicate signatures.',
      'Cosmic Map — interactive geographic visualization of governance activity worldwide, with real-time data on proposals, participation rates, and community engagement hotspots.',
      'Three new governance games: Oracle Protocol, Signal Detective, and Cognitive Warfare — each training a different governance skill from prediction to bias detection.',
    ],
    fixes: [
      'Fixed ranked choice voting calculations that could produce incorrect elimination orderings in edge cases with tied last-place candidates.',
      'Resolved an issue where the AI chat assistant would occasionally lose conversation context after extended sessions.',
      'Fixed notification preferences not persisting after page refresh for some user accounts.',
    ],
    improvements: [
      'Completely redesigned the proposal creation flow with a guided wizard and AI-assisted drafting capabilities.',
      'Improved mobile responsiveness across all dashboard pages with better touch targets and navigation patterns.',
    ],
  },
  {
    version: 'v0.2.0',
    date: 'February 8, 2026',
    accent: '#FFB547',
    features: [
      'AI Studio launch — integrated AI assistant that can draft proposals, analyze vote patterns, predict outcomes, and identify potential governance risks before they become problems.',
      'Participatory Processes — multi-phase governance workflows that guide communities through information gathering, proposal creation, deliberation, voting, implementation, and evaluation stages.',
      'Organizations and team management — create and manage multiple organizations with role-based access controls, custom branding, and member invitation workflows.',
      'Chat rooms — real-time community discussion spaces with threaded conversations, mentions, and moderation tools.',
    ],
    fixes: [
      'Fixed authentication token refresh logic that caused unexpected logouts during active sessions.',
      'Resolved layout issues in the voting interface when proposals had more than five options.',
    ],
    improvements: [
      'Added comprehensive API documentation with interactive examples and code snippets in JavaScript, Python, and cURL.',
      'Upgraded the analytics dashboard with new charts for participation trends, vote distribution, and engagement metrics over time.',
    ],
  },
  {
    version: 'v0.1.0',
    date: 'January 10, 2026',
    accent: '#FF5E8A',
    features: [
      'Initial public beta release of CosmoGov — the interstellar civic operating system for participatory democracy.',
      'Three voting modes: Direct Democracy (simple yes/no), Council Vote (multiple choice), and Ranked Choice (preference ordering) — each designed for different decision types and community sizes.',
      'Neural Consensus and Strategic Command governance games — the first two games designed to train decision-making instincts while earning XP and reputation.',
      'User authentication with email and password, including secure session management and password recovery flows.',
      'Basic proposal creation and management with rich text editing, category tagging, and configurable voting periods.',
      'Reputation and leaderboard system — earn XP for participation, maintain streaks, and compete with fellow citizens on community leaderboards.',
    ],
    fixes: [],
    improvements: [],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#04050b]">
      <Starfield />
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cosmic-teal to-cosmic-violet flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-lg">CosmoGov</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm text-cosmic-muted hover:text-white transition-colors">Log in</Link>
          <Link href="/auth/signup" className="text-sm bg-cosmic-accent text-white px-4 py-1.5 rounded-lg hover:bg-cosmic-accent/90 transition-colors">Sign up free</Link>
        </div>
      </nav>

      <main className="relative z-10 flex-grow max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 cosmic-badge rounded-full px-4 py-1.5 mb-6">
            <Rocket className="w-3.5 h-3.5 text-cosmic-teal" />
            <span className="text-xs font-medium text-cosmic-teal">What&apos;s New</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 font-heading">
            <span className="text-gradient">Changelog</span>
          </h1>
          <p className="text-cosmic-muted text-lg max-w-2xl mx-auto leading-relaxed">
            A chronological record of all notable changes made to CosmoGov. Every feature, fix, and improvement — documented as we continue building the future of civic technology.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-white/5 hidden sm:block" />

          <div className="space-y-12">
            {versions.map((v, idx) => (
              <div key={v.version} className="relative sm:pl-16">
                {/* Timeline dot */}
                <div
                  className="hidden sm:flex absolute left-[18px] top-2 w-5 h-5 rounded-full border-2 items-center justify-center"
                  style={{ borderColor: v.accent, background: idx === 0 ? v.accent : '#04050b' }}
                >
                  {idx === 0 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>

                {/* Version card */}
                <div className="glass-card p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-white font-heading">{v.version}</h2>
                    <span
                      className="inline-flex items-center text-xs font-medium px-3 py-1 rounded-full"
                      style={{ background: `${v.accent}15`, color: v.accent }}
                    >
                      {v.date}
                    </span>
                  </div>

                  {v.features.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-cosmic-teal" />
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Features</h3>
                      </div>
                      <ul className="space-y-2">
                        {v.features.map((feature, i) => (
                          <li key={i} className="flex gap-3 text-sm text-cosmic-muted leading-relaxed">
                            <span className="text-cosmic-teal mt-1 flex-shrink-0">+</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {v.fixes.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Bug className="w-4 h-4 text-cosmic-rose" />
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Bug Fixes</h3>
                      </div>
                      <ul className="space-y-2">
                        {v.fixes.map((fix, i) => (
                          <li key={i} className="flex gap-3 text-sm text-cosmic-muted leading-relaxed">
                            <span className="text-cosmic-rose mt-1 flex-shrink-0">-</span>
                            <span>{fix}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {v.improvements.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Wrench className="w-4 h-4 text-cosmic-amber" />
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Improvements</h3>
                      </div>
                      <ul className="space-y-2">
                        {v.improvements.map((improvement, i) => (
                          <li key={i} className="flex gap-3 text-sm text-cosmic-muted leading-relaxed">
                            <span className="text-cosmic-amber mt-1 flex-shrink-0">~</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
