'use client';

import Link from 'next/link';
import { Rocket, Eye, Heart, Lightbulb, Shield, Users } from 'lucide-react';
import Footer from '@/components/Footer';

function Starfield() {
  return <div className="fixed inset-0 starfield opacity-20 pointer-events-none" />;
}

const values = [
  {
    icon: Eye,
    title: 'Transparency',
    description: 'Every decision, every vote, every outcome — fully visible and auditable. We believe that sunlight is the best disinfectant, and that citizens deserve to see exactly how their governance works. No back rooms, no hidden agendas, just clear and open processes.',
  },
  {
    icon: Users,
    title: 'Inclusivity',
    description: 'Governance belongs to everyone, not just the loudest voices or the most privileged. CosmoGov is designed to lower barriers to participation, accommodate diverse needs, and ensure that every community member can meaningfully contribute to the decisions that shape their lives.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'We push the boundaries of what civic technology can be. From AI-assisted deliberation to gamified engagement, we continuously explore new frontiers in how communities govern themselves. Stagnation is the enemy of progress — we embrace bold ideas and creative solutions.',
  },
  {
    icon: Heart,
    title: 'Empowerment',
    description: 'Our platform exists to give people real power over the decisions that affect them. Not token participation, not performative consultation, but genuine agency. Every feature we build is measured against one question: does this make citizens more powerful?',
  },
  {
    icon: Shield,
    title: 'Accountability',
    description: 'Promises must be tracked, progress must be measured, and leaders must answer to their communities. CosmoGov provides the tools to follow through from vote to implementation, ensuring that governance is not just a moment but a continuous commitment to results.',
  },
];

export default function AboutPage() {
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
            <span className="text-xs font-medium text-cosmic-teal">Our Story</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 font-heading">
            About <span className="text-gradient">CosmoGov</span>
          </h1>
          <p className="text-cosmic-muted text-lg max-w-2xl mx-auto leading-relaxed">
            Building the operating system for interstellar civic engagement — one community at a time.
          </p>
        </div>

        <section className="mb-12">
          <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-cosmic-teal/10 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-cosmic-teal" />
              </div>
              <h2 className="text-2xl font-bold text-white font-heading">Our Mission</h2>
            </div>
            <p className="text-cosmic-muted leading-relaxed">
              CosmoGov is the interstellar civic operating system designed to transform governance from a chore into an adventure. We believe that every citizen deserves a voice, every community deserves transparency, and every decision deserves informed participation. Our platform combines AI-powered deliberation tools, gamified engagement, and participatory democracy frameworks to create a governance experience that is accessible, engaging, and impactful. We exist to bridge the gap between the promise of democracy and its practice — making it possible for communities of any size to deliberate, decide, and hold power accountable with confidence and clarity.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <div className="glass-card-violet p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-cosmic-violet/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-cosmic-violet" />
              </div>
              <h2 className="text-2xl font-bold text-white font-heading">Our Vision</h2>
            </div>
            <p className="text-cosmic-muted leading-relaxed">
              We envision a world where civic participation is as natural as social interaction — where citizens are empowered with the tools, knowledge, and community support to shape the decisions that affect their lives. From neighborhood budgets to global policy, CosmoGov makes every voice count. We see a future where the friction between intention and action in governance is eliminated, where AI augments human judgment rather than replacing it, and where the act of participating in democracy is not just a duty but a genuinely rewarding experience. Our vision is nothing less than a renaissance in how humans govern themselves together.
            </p>
          </div>
        </section>

        <section>
          <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-cosmic-amber/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-cosmic-amber" />
              </div>
              <h2 className="text-2xl font-bold text-white font-heading">Our Values</h2>
            </div>
            <div className="space-y-6">
              {values.map((value) => (
                <div key={value.title} className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                    <value.icon className="w-5 h-5 text-cosmic-teal" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2 font-heading">{value.title}</h3>
                    <p className="text-cosmic-muted text-sm leading-relaxed">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
