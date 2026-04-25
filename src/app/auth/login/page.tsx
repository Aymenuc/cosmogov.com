'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Rocket, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }
      router.push('/dashboard');
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
        <h1 className="text-2xl font-bold text-center mb-2 font-heading">Welcome Back</h1>
        <p className="text-cosmic-muted text-center text-sm mb-6">Sign in to your governance cosmos</p>
        {error && <div className="bg-cosmic-rose/10 border border-cosmic-rose/20 text-cosmic-rose rounded-lg px-4 py-2 text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-cosmic-muted mb-1.5 block">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50" placeholder="you@cosmos.io" />
          </div>
          <div>
            <label className="text-sm text-cosmic-muted mb-1.5 block">Password</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50" placeholder="Enter password" />
          </div>
          <Button type="submit" className="w-full bg-cosmic-accent hover:bg-cosmic-accent/90 text-white rounded-xl h-11" disabled={loading}>
            {loading ? 'Signing in...' : <>Sign In <ArrowRight className="w-4 h-4 ml-1" /></>}
          </Button>
        </form>
        <p className="text-center text-sm text-cosmic-muted mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-cosmic-accent hover:underline">Sign up</Link>
        </p>
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-xs text-cosmic-muted text-center">Demo: alice@cosmogov.io / demo123</p>
        </div>
      </div>
    </div>
  );
}
