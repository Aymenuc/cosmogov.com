'use client';

import Link from 'next/link';
import {
  Rocket, BookOpen, Code2, Compass, Cpu, Users, Shield,
  ArrowRight
} from 'lucide-react';
import Footer from '@/components/Footer';

function Starfield() {
  return <div className="fixed inset-0 starfield opacity-20 pointer-events-none" />;
}

const categories = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    description: 'Set up your account, create your first organization, and launch your initial proposal in under 10 minutes. This guide walks you through everything from registration to your first community vote, with step-by-step instructions and helpful tips along the way.',
    href: '/docs',
    accent: '#2EE6C7',
  },
  {
    icon: Code2,
    title: 'API Reference',
    description: 'Complete documentation for the CosmoGov REST API. Authenticate requests, manage proposals programmatically, retrieve participation data, and integrate governance features directly into your own applications. Includes examples in JavaScript, Python, and cURL.',
    href: '/docs/api',
    accent: '#9B5CFF',
  },
  {
    icon: Compass,
    title: 'Platform Guide',
    description: 'Deep-dive into every feature of the CosmoGov platform — from voting modes and participatory processes to reputation systems and analytics dashboards. Learn how to configure your organization, manage members, and customize your governance workflows.',
    href: '/docs',
    accent: '#2D6BFF',
  },
  {
    icon: Cpu,
    title: 'AI Agents',
    description: 'Understand how CosmoGov\'s AI agents work, from proposal drafting assistants to bias detection algorithms. Learn how to configure AI parameters, interpret confidence scores, and integrate AI-powered insights into your decision-making processes safely and effectively.',
    href: '/docs',
    accent: '#FFB547',
  },
  {
    icon: Users,
    title: 'Participation Framework',
    description: 'Master the five pillars of e-Participation on CosmoGov: participatory processes, budgeting, citizen initiatives, assemblies, and accountability tracking. Each pillar is explained with real-world examples and best practices for maximizing civic engagement.',
    href: '/docs',
    accent: '#FF5E8A',
  },
  {
    icon: Shield,
    title: 'Security & Privacy',
    description: 'Learn about CosmoGov\'s security architecture, data encryption standards, compliance certifications, and privacy controls. This section covers everything from end-to-end encryption and SOC 2 compliance to GDPR rights and data export procedures.',
    href: '/docs',
    accent: '#34D399',
  },
];

export default function DocsPage() {
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

      <main className="relative z-10 flex-grow max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 cosmic-badge rounded-full px-4 py-1.5 mb-6">
            <BookOpen className="w-3.5 h-3.5 text-cosmic-teal" />
            <span className="text-xs font-medium text-cosmic-teal">Knowledge Base</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 font-heading">
            <span className="text-gradient">Documentation</span>
          </h1>
          <p className="text-cosmic-muted text-lg max-w-2xl mx-auto leading-relaxed">
            Everything you need to build, configure, and govern with CosmoGov. From quickstart guides to in-depth API references, find the resources to make your civic infrastructure thrive.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link key={cat.title} href={cat.href} className="glass-card p-6 group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                style={{ background: `${cat.accent}15` }}
              >
                <cat.icon className="w-6 h-6" style={{ color: cat.accent }} />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2 font-heading">{cat.title}</h2>
              <p className="text-cosmic-muted text-sm leading-relaxed mb-4">{cat.description}</p>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium group-hover:gap-2.5 transition-all" style={{ color: cat.accent }}>
                Explore <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
