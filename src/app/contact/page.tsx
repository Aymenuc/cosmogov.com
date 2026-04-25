'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Rocket, ArrowRight, LayoutDashboard, MessageSquare,
  CheckCircle2, Mail, Clock, MapPin, ChevronDown, ChevronUp,
  Sparkles, Send, Globe, Shield, Users
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

/* ─── Navigation ─── */
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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#04050b]/80 backdrop-blur-xl border-b border-white/5' : 'bg-[#04050b]/60 backdrop-blur-xl'}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cosmic-teal to-cosmic-violet flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-lg tracking-tight">CosmoGov</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/#governance" className="text-sm text-cosmic-muted hover:text-white transition-colors">Governance</Link>
          <Link href="/#games" className="text-sm text-cosmic-muted hover:text-white transition-colors">Games</Link>
          <Link href="/#ai" className="text-sm text-cosmic-muted hover:text-white transition-colors">AI Studio</Link>
          <Link href="/#pricing" className="text-sm text-cosmic-muted hover:text-white transition-colors">Pricing</Link>
          <Link href="/contact" className="text-sm text-cosmic-accent hover:text-cosmic-accent/80 transition-colors font-medium">Contact</Link>
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
        <div className="md:hidden bg-[#04050b]/95 backdrop-blur-xl border-b border-white/5 px-6 py-4 space-y-3">
          <Link href="/#governance" className="block text-cosmic-muted hover:text-white py-2" onClick={() => setMobileOpen(false)}>Governance</Link>
          <Link href="/#games" className="block text-cosmic-muted hover:text-white py-2" onClick={() => setMobileOpen(false)}>Games</Link>
          <Link href="/#ai" className="block text-cosmic-muted hover:text-white py-2" onClick={() => setMobileOpen(false)}>AI Studio</Link>
          <Link href="/#pricing" className="block text-cosmic-muted hover:text-white py-2" onClick={() => setMobileOpen(false)}>Pricing</Link>
          <Link href="/contact" className="block text-cosmic-accent hover:text-cosmic-accent/80 py-2 font-medium" onClick={() => setMobileOpen(false)}>Contact</Link>
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
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      <div className="planet-glow w-64 h-64 bg-gradient-to-br from-cosmic-teal/20 to-cosmic-violet/20 top-[10%] right-[10%]" />
      <div className="planet-glow w-40 h-40 bg-gradient-to-br from-cosmic-amber/15 to-cosmic-rose/15 bottom-[10%] left-[5%]" style={{ animationDelay: '2s' }} />
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 cosmic-badge rounded-full px-4 py-1.5 mb-8" style={{ animation: 'slideUp 0.8s ease-out' }}>
          <MessageSquare className="w-3.5 h-3.5 text-cosmic-teal" />
          <span className="text-xs font-medium text-cosmic-teal">We&apos;re Here to Help</span>
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6" style={{ animation: 'slideUp 0.8s ease-out 0.1s both' }}>
          <span className="text-gradient">Get In</span>{' '}
          <span className="text-white">Touch</span>
        </h1>
        <p className="text-lg sm:text-xl text-cosmic-muted max-w-2xl mx-auto leading-relaxed" style={{ animation: 'slideUp 0.8s ease-out 0.2s both' }}>
          Have a question, idea, or partnership opportunity? We&apos;d love to hear from you. Our team typically responds within 24 hours.
        </p>
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
    <section className="relative py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
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
                      placeholder="Tell us what's on your mind..."
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 focus-visible:border-cosmic-teal focus-visible:ring-cosmic-teal/20 resize-none"
                    />
                  </div>
                  {status === 'error' && (
                    <p className="text-cosmic-rose text-sm">{errorMsg}</p>
                  )}
                  <Button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-cosmic-accent hover:bg-cosmic-accent/90 text-white rounded-xl h-12 text-base font-semibold"
                  >
                    {status === 'loading' ? 'Sending...' : <><Send className="w-4 h-4 mr-2" /> Send Message</>}
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Info Cards */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#0B1022] border-white/5">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-cosmic-teal/10 flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-cosmic-teal" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 font-heading">Email Us</h3>
                <p className="text-cosmic-muted text-sm mb-2">Reach out directly via email</p>
                <a href="mailto:hello@cosmogov.io" className="text-cosmic-accent hover:text-cosmic-accent/80 text-sm font-medium transition-colors">hello@cosmogov.io</a>
              </CardContent>
            </Card>

            <Card className="bg-[#0B1022] border-white/5">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-cosmic-amber/10 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-cosmic-amber" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 font-heading">Response Time</h3>
                <p className="text-cosmic-muted text-sm mb-2">We typically respond within</p>
                <span className="text-cosmic-amber font-bold text-lg font-heading">&lt; 24 hours</span>
              </CardContent>
            </Card>

            <Card className="bg-[#0B1022] border-white/5">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-cosmic-violet/10 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-cosmic-violet" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 font-heading">Offices</h3>
                <div className="space-y-2 text-sm text-cosmic-muted">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-cosmic-teal" />
                    <span>San Francisco, CA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-cosmic-violet" />
                    <span>London, UK</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-cosmic-amber" />
                    <span>Singapore</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ Section ─── */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'How do I create my first proposal?',
      a: 'Once you sign up and enter your dashboard, click "Proposals" in the sidebar, then "New Proposal." You can choose from three voting modes: Direct Democracy, Council Vote, or Ranked Choice. Our AI assistant can even help you draft it.',
    },
    {
      q: 'Is CosmoGov free to use?',
      a: 'Yes! Our Community plan is completely free and includes 5 proposals per month, 1 organization, 3 governance games, and basic AI assistance. You can upgrade to Team, Guild, or Enterprise plans for more features.',
    },
    {
      q: 'How does the AI governance assistant work?',
      a: 'Our AI assistant analyzes proposals for potential biases, generates risk assessments, predicts vote outcomes based on historical patterns, and can even help draft proposals. It\'s like having a governance expert on call 24/7.',
    },
    {
      q: 'Can I use CosmoGov for my DAO or community?',
      a: 'Absolutely! CosmoGov is designed for any group that makes decisions together — DAOs, nonprofits, student organizations, cooperatives, and corporate teams. Our flexible voting modes adapt to your governance style.',
    },
    {
      q: 'How is my data protected?',
      a: 'We use end-to-end encryption (AES-256 + TLS 1.3), are SOC 2 Type II compliant, GDPR ready, and offer SSO/SAML for enterprise plans. Your governance data is never shared with third parties.',
    },
    {
      q: 'What are governance games?',
      a: 'CosmoGov features 6 immersive games that train your decision-making instincts while earning XP. From Neural Consensus (coordination) to Oracle Protocol (prediction) to Cognitive Warfare (bias detection), each game sharpens a different governance skill.',
    },
  ];

  return (
    <section className="relative py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 cosmic-badge rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-cosmic-teal" />
            <span className="text-xs font-medium text-cosmic-teal">Common Questions</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="text-cosmic-muted text-lg">
            Everything you need to know about CosmoGov
          </p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="glass-card overflow-hidden"
              style={{ animation: `slideUp 0.5s ease-out ${i * 0.05}s both` }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                {openIndex === i ? (
                  <ChevronUp className="w-4 h-4 text-cosmic-muted flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-cosmic-muted flex-shrink-0" />
                )}
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 -mt-1">
                  <p className="text-sm text-cosmic-muted leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Main Page ─── */
export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#04050b]">
      <Starfield />
      <Navigation />
      <main className="flex-grow relative z-10">
        <HeroSection />
        <ContactFormSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
