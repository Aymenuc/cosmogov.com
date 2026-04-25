'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Rocket, ArrowLeft, Briefcase, MapPin, Code2, Brain, Users,
  Palette, Server, CheckCircle2, Send, Sparkles,
} from 'lucide-react';
import Footer from '@/components/Footer';

/* ─── Job Data ─── */
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

/* ─── Confetti Particle Component ─── */
function ConfettiParticle({ delay, x, color }: { delay: number; x: number; color: string }) {
  return (
    <div
      className="absolute top-1/2 left-1/2 pointer-events-none"
      style={{
        animation: `confettiFall 1.5s ease-out ${delay}s both`,
        '--confetti-x': `${x}px`,
        '--confetti-color': color,
      } as React.CSSProperties}
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

/* ─── Main Page ─── */
export default function ApplicationPage() {
  const params = useParams();
  const id = params.id as string;
  const job = jobs.find((j) => j.id === id);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    portfolio: '',
    coverLetter: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    setSubmitted(true);
    setShowConfetti(true);
    // Remove confetti after animation
    setTimeout(() => setShowConfetti(false), 3000);
  }, []);

  useEffect(() => {
    // Inject confetti keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes confettiFall {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
        20% { transform: translate(calc(-50% + var(--confetti-x) * 0.3), calc(-50% - 60px)) scale(1.2); opacity: 1; }
        100% { transform: translate(calc(-50% + var(--confetti-x)), calc(-50% + 120px)) scale(0.3) rotate(360deg); opacity: 0; }
      }
      @keyframes scaleIn {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col bg-[#04050b]">
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cosmic-teal to-cosmic-violet flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-lg">CosmoGov</span>
          </Link>
        </nav>
        <main className="flex-grow flex items-center justify-center px-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4 font-heading">Position Not Found</h1>
            <p className="text-cosmic-muted mb-6">The position you are looking for does not exist or has been closed.</p>
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 text-sm font-medium bg-cosmic-accent text-white hover:bg-cosmic-accent/90 px-5 py-2.5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Careers
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const colors = accentMap[job.accent];
  const Icon = job.icon;

  const confettiColors = ['#14b8a6', '#a78bfa', '#f59e0b', '#fb7185', '#22d3ee', '#facc15'];
  const confettiParticles = Array.from({ length: 30 }, (_, i) => ({
    delay: Math.random() * 0.5,
    x: (Math.random() - 0.5) * 300,
    color: confettiColors[i % confettiColors.length],
  }));

  const inputClass = 'w-full bg-white/5 border border-white/10 text-white placeholder:text-cosmic-muted/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cosmic-teal focus:ring-1 focus:ring-cosmic-teal/20 transition-colors';
  const labelClass = 'text-sm text-cosmic-muted mb-1 block';

  return (
    <div className="min-h-screen flex flex-col bg-[#04050b]">
      <div className="fixed inset-0 starfield opacity-20 pointer-events-none" />

      {/* Navigation */}
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

      {/* Main Content */}
      <main className="relative z-10 flex-grow max-w-2xl mx-auto px-6 py-12 w-full">
        {/* Back Link */}
        <Link
          href="/careers"
          className="inline-flex items-center gap-2 text-sm text-cosmic-muted hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Careers
        </Link>

        {/* Job Header */}
        <div className="glass-card p-8 mb-8" style={{ animation: 'slideUp 0.5s ease-out both' }}>
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${colors.text}`} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading mb-2">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-sm text-cosmic-muted">
                  <Briefcase className="w-3.5 h-3.5" /> {job.department}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-cosmic-muted">
                  <MapPin className="w-3.5 h-3.5" /> {job.location}
                </span>
              </div>
            </div>
          </div>
          <p className="text-cosmic-muted text-sm leading-relaxed">{job.description}</p>
        </div>

        {/* Application Form */}
        <div className="glass-card p-8" style={{ animation: 'slideUp 0.5s ease-out 0.1s both' }}>
          {submitted ? (
            <div className="text-center py-8 relative" style={{ animation: 'scaleIn 0.4s ease-out' }}>
              {/* Confetti */}
              {showConfetti && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {confettiParticles.map((p, i) => (
                    <ConfettiParticle key={i} delay={p.delay} x={p.x} color={p.color} />
                  ))}
                </div>
              )}
              <div className="w-16 h-16 rounded-full bg-cosmic-teal/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-cosmic-teal" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 font-heading">Application Submitted!</h2>
              <p className="text-cosmic-muted mb-2">
                Thank you for applying for the {job.title} position. We appreciate your interest in joining CosmoGov.
              </p>
              <p className="text-cosmic-muted text-sm mb-6">
                We review every application carefully and will get back to you within 5-7 business days.
              </p>
              <div className="glass-card p-4 mb-6 inline-block">
                <p className="text-sm text-cosmic-muted flex items-center gap-2 justify-center">
                  <Sparkles className="w-4 h-4 text-cosmic-amber" />
                  <span>Email your resume to <span className="text-cosmic-accent font-medium">careers@cosmogov.io</span> after submitting</span>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/careers"
                  className="inline-flex items-center gap-2 text-sm font-medium bg-cosmic-accent text-white hover:bg-cosmic-accent/90 px-5 py-2.5 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Careers
                </Link>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ fullName: '', email: '', phone: '', portfolio: '', coverLetter: '' });
                  }}
                  className="text-sm text-cosmic-muted hover:text-white border border-white/10 px-5 py-2.5 rounded-lg transition-colors"
                >
                  Submit Another Application
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white font-heading mb-1">Apply for {job.title}</h2>
              <p className="text-cosmic-muted text-sm mb-6">Fill out the form below to submit your application.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className={labelClass}>
                    Full Name <span className="text-cosmic-rose">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    className={inputClass}
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email <span className="text-cosmic-rose">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="jane@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className={inputClass}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className={labelClass}>
                    Phone <span className="text-cosmic-muted/40 text-xs">(optional)</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className={inputClass}
                  />
                </div>

                {/* LinkedIn / Portfolio */}
                <div>
                  <label htmlFor="portfolio" className={labelClass}>
                    LinkedIn / Portfolio URL <span className="text-cosmic-muted/40 text-xs">(optional)</span>
                  </label>
                  <input
                    id="portfolio"
                    type="text"
                    placeholder="https://linkedin.com/in/janedoe"
                    value={formData.portfolio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, portfolio: e.target.value }))}
                    className={inputClass}
                  />
                </div>

                {/* Cover Letter */}
                <div>
                  <label htmlFor="coverLetter" className={labelClass}>
                    Cover Letter / Why CosmoGov? <span className="text-cosmic-rose">*</span>
                  </label>
                  <textarea
                    id="coverLetter"
                    required
                    rows={6}
                    placeholder="Tell us why you're excited about CosmoGov and what you'd bring to the team..."
                    value={formData.coverLetter}
                    onChange={(e) => setFormData((prev) => ({ ...prev, coverLetter: e.target.value }))}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {/* Resume Note */}
                <div className="rounded-xl bg-cosmic-amber/5 border border-cosmic-amber/10 p-4">
                  <p className="text-sm text-cosmic-amber/80 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Email your resume to <span className="text-cosmic-accent font-medium">careers@cosmogov.io</span> after submitting this form.</span>
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold bg-cosmic-accent text-white hover:bg-cosmic-accent/90 px-6 py-3.5 rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4" /> Submit Application
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
