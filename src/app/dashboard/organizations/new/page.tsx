'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Building2 } from 'lucide-react';

export default function NewOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSlug = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description }),
      });
      if (res.ok) { router.push('/dashboard/organizations'); }
      else { const data = await res.json(); alert(data.error); }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      <Button variant="ghost" className="text-cosmic-muted hover:text-white mb-4" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
      <h1 className="text-2xl font-bold font-heading mb-6">Create Organization</h1>
      <Card className="bg-[#0B1022] border-white/5">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-cosmic-muted mb-1.5 block">Organization Name</label>
              <Input value={name} onChange={e => handleSlug(e.target.value)} required placeholder="Stargate Collective"
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50" />
            </div>
            <div>
              <label className="text-sm text-cosmic-muted mb-1.5 block">URL Slug</label>
              <Input value={slug} onChange={e => setSlug(e.target.value)} required placeholder="stargate"
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50" />
            </div>
            <div>
              <label className="text-sm text-cosmic-muted mb-1.5 block">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this organization govern?"
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 resize-none" rows={3} />
            </div>
            <Button type="submit" className="w-full bg-cosmic-accent text-white rounded-xl h-11" disabled={loading}>
              {loading ? 'Creating...' : <><Building2 className="w-4 h-4 mr-1" /> Create Organization</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
