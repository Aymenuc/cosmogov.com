'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Rocket, ArrowRight, Landmark, User } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'gov_official'>('user');
  const [govCode, setGovCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          govCode: role === 'gov_official' ? govCode : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Signup failed'); return; }

      // Redirect gov officials to gov portal, others to dashboard
      router.push(role === 'gov_official' ? '/dashboard/gov-portal' : '/dashboard');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass-card p-8 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cosmic-teal to-cosmic-violet flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-bold text-xl">CosmoGov</span>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2 font-heading">Create Your Cosmos</h1>
        <p className="text-cosmic-muted text-center text-sm mb-6">Start your interstellar governance journey</p>
        {error && <div className="bg-cosmic-rose/10 border border-cosmic-rose/20 text-cosmic-rose rounded-lg px-4 py-2 text-sm mb-4">{error}</div>}

        {/* Role Selection */}
        <div className="mb-6">
          <label className="text-sm text-cosmic-muted mb-2 block">I am joining as...</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`p-3 rounded-xl border text-left transition-all ${
                role === 'user'
                  ? 'border-cosmic-accent/40 bg-cosmic-accent/10 ring-1 ring-cosmic-accent/20'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <User className={`w-4 h-4 ${role === 'user' ? 'text-cosmic-accent' : 'text-cosmic-muted'}`} />
                <span className={`text-sm font-medium ${role === 'user' ? 'text-cosmic-accent' : 'text-cosmic-muted'}`}>Citizen</span>
              </div>
              <p className="text-[11px] text-cosmic-muted leading-snug">
                Participate, vote, sign initiatives, and propose changes
              </p>
            </button>
            <button
              type="button"
              onClick={() => setRole('gov_official')}
              className={`p-3 rounded-xl border text-left transition-all ${
                role === 'gov_official'
                  ? 'border-cosmic-teal/40 bg-cosmic-teal/10 ring-1 ring-cosmic-teal/20'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Landmark className={`w-4 h-4 ${role === 'gov_official' ? 'text-cosmic-teal' : 'text-cosmic-muted'}`} />
                <span className={`text-sm font-medium ${role === 'gov_official' ? 'text-cosmic-teal' : 'text-cosmic-muted'}`}>Gov Official</span>
              </div>
              <p className="text-[11px] text-cosmic-muted leading-snug">
                Review and respond to citizen initiatives and proposals
              </p>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-cosmic-muted mb-1.5 block">Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50" placeholder="Your name" />
          </div>
          <div>
            <label className="text-sm text-cosmic-muted mb-1.5 block">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50" placeholder="you@cosmos.io" />
          </div>
          <div>
            <label className="text-sm text-cosmic-muted mb-1.5 block">Password</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50" placeholder="Min 6 characters" />
          </div>

          {/* Government Verification Code */}
          {role === 'gov_official' && (
            <div>
              <label className="text-sm text-cosmic-muted mb-1.5 block flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-cosmic-teal" />
                Government Verification Code
              </label>
              <Input
                value={govCode}
                onChange={e => setGovCode(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                placeholder="Enter your gov verification code"
              />
              <p className="text-[11px] text-cosmic-muted/60 mt-1">
                Contact your CosmoGov administrator to obtain a verification code. Without a valid code, your account will be created as a regular citizen.
              </p>
            </div>
          )}

          <Button type="submit" className="w-full bg-cosmic-accent hover:bg-cosmic-accent/90 text-white rounded-xl h-11" disabled={loading}>
            {loading ? 'Creating...' : <>Launch <Rocket className="w-4 h-4 ml-1" /></>}
          </Button>
        </form>
        <p className="text-center text-sm text-cosmic-muted mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-cosmic-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
