'use client';

import Link from 'next/link';
import { Rocket, MapPin, Briefcase, Code2, Brain, Users, Palette, Server } from 'lucide-react';
import Footer from '@/components/Footer';

function Starfield() {
  return <div className="fixed inset-0 starfield opacity-20 pointer-events-none" />;
}

const jobs = [
  {
    id: 'full-stack-engineer',
    title: 'Full-Stack Engineer',
    department: 'Engineering',
    location: 'Remote',
    icon: Code2,
    accent: 'teal',
    description: 'Build and scale the core CosmoGov platform, from real-time voting systems to AI-powered governance features. You will work across the entire stack, designing APIs, implementing responsive interfaces, and optimizing database performance for our growing community of civic organizations. We are looking for someone who is passionate about building technology that empowers communities and strengthens democratic participation.',
  },
  {
    id: 'ai-ml-engineer',
    title: 'AI/ML Engineer',
    department: 'AI Research',
    location: 'Remote',
    icon: Brain,
    accent: 'violet',
    description: 'Develop and deploy the machine learning models that power CosmoGov\'s AI assistant, bias detection, and predictive analytics. You will work on natural language processing for proposal analysis, recommendation systems for civic engagement, and anomaly detection for vote integrity. Experience with transformer architectures, prompt engineering, and responsible AI practices is essential for this role.',
  },
  {
    id: 'community-manager',
    title: 'Community Manager',
    department: 'Community',
    location: 'Remote',
    icon: Users,
    accent: 'amber',
    description: 'Be the bridge between CosmoGov and the communities we serve. You will manage our Discord and forum spaces, onboard new organizations, gather feedback to inform product development, and create educational content that helps users get the most out of the platform. We need someone who genuinely cares about civic engagement and can build authentic relationships with diverse communities worldwide.',
  },
  {
    id: 'ux-designer',
    title: 'UX Designer',
    department: 'Design',
    location: 'Remote',
    icon: Palette,
    accent: 'rose',
    description: 'Design intuitive, accessible, and delightful experiences that make civic participation feel effortless. You will conduct user research, create wireframes and prototypes, and collaborate closely with engineers to ship polished features. Our users range from tech-savvy DAO operators to first-time community organizers, so you will need to balance complexity with simplicity across every interaction.',
  },
  {
    id: 'devops-engineer',
    title: 'DevOps Engineer',
    department: 'Infrastructure',
    location: 'Remote',
    icon: Server,
    accent: 'teal',
    description: 'Keep CosmoGov fast, reliable, and secure at scale. You will manage our cloud infrastructure, implement CI/CD pipelines, monitor system health, and ensure 99.9% uptime for our global user base. Experience with Kubernetes, infrastructure as code, and incident response is critical. You will also play a key role in our SOC 2 compliance efforts and security posture management.',
  },
];

const accentMap: Record<string, { bg: string; text: string; iconBg: string }> = {
  teal: { bg: 'bg-cosmic-teal/10', text: 'text-cosmic-teal', iconBg: 'bg-cosmic-teal/10' },
  violet: { bg: 'bg-cosmic-violet/10', text: 'text-cosmic-violet', iconBg: 'bg-cosmic-violet/10' },
  amber: { bg: 'bg-cosmic-amber/10', text: 'text-cosmic-amber', iconBg: 'bg-cosmic-amber/10' },
  rose: { bg: 'bg-cosmic-rose/10', text: 'text-cosmic-rose', iconBg: 'bg-cosmic-rose/10' },
};

export default function CareersPage() {
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
            <span className="text-xs font-medium text-cosmic-teal">Join the Mission</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 font-heading">
            Careers at <span className="text-gradient">CosmoGov</span>
          </h1>
          <p className="text-cosmic-muted text-lg max-w-2xl mx-auto leading-relaxed">
            Help us build the future of civic engagement. We are a remote-first team passionate about empowering communities through technology. Every role at CosmoGov contributes to making governance more transparent, inclusive, and effective for everyone.
          </p>
        </div>

        <div className="space-y-6">
          {jobs.map((job) => {
            const colors = accentMap[job.accent];
            return (
              <div key={job.title} className="glass-card p-8 group hover:scale-[1.01] transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                  <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <job.icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div className="flex-grow">
                    <h2 className="text-xl font-bold text-white font-heading mb-2">{job.title}</h2>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-cosmic-muted">
                        <Briefcase className="w-3.5 h-3.5" /> {job.department}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm text-cosmic-muted">
                        <MapPin className="w-3.5 h-3.5" /> {job.location}
                      </span>
                    </div>
                    <p className="text-cosmic-muted text-sm leading-relaxed mb-5">{job.description}</p>
                    <Link
                      href={`/careers/${job.id}`}
                      className="inline-flex items-center gap-2 text-sm font-medium bg-cosmic-accent text-white hover:bg-cosmic-accent/90 px-4 py-2 rounded-lg transition-colors"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 glass-card p-8 text-center">
          <h3 className="text-xl font-bold text-white font-heading mb-3">Don&apos;t see your role?</h3>
          <p className="text-cosmic-muted text-sm leading-relaxed max-w-lg mx-auto">
            We are always looking for talented people who are passionate about civic technology and democratic innovation. Send your resume and a note about how you would like to contribute to careers@cosmogov.io.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
