'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import WorkspaceHeading from '@/components/WorkspaceHeading';

export default function NewOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSlug = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { router.push(`/dashboard/organizations/${data.slug}`); return; }
      setError(data.error || 'We couldn’t create the community. Try again.');
    } catch {
      setError('We couldn’t reach CosmoGov. Check your connection and try again.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      <WorkspaceHeading
        title="Create a community"
        description="A space for your street, association or council to propose and decide together. You'll be its first admin."
        back={{ href: '/dashboard/organizations', label: 'My communities' }}
      />
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="org-name" className="text-sm text-cosmic-muted mb-1.5 block">Community name</label>
              <Input id="org-name" maxLength={80} value={name} onChange={e => handleSlug(e.target.value)} required placeholder="Riverside Residents"
                className="bg-foreground/5 border-border text-foreground placeholder:text-cosmic-muted/50" />
            </div>
            <div>
              <label htmlFor="org-slug" className="text-sm text-cosmic-muted mb-1.5 block">Link name</label>
              <Input id="org-slug" maxLength={50} aria-describedby="org-slug-hint" value={slug} onChange={e => setSlug(e.target.value)} required placeholder="riverside-residents"
                className="bg-foreground/5 border-border text-foreground placeholder:text-cosmic-muted/50" />
              <p id="org-slug-hint" className="text-xs text-cosmic-muted mt-1">Lowercase letters, numbers and dashes. It becomes the community&apos;s address.</p>
            </div>
            <div>
              <label htmlFor="org-description" className="text-sm text-cosmic-muted mb-1.5 block">What it&apos;s for</label>
              <Textarea id="org-description" maxLength={1000} value={description} onChange={e => setDescription(e.target.value)} placeholder="What will this community decide together?"
                className="bg-foreground/5 border-border text-foreground placeholder:text-cosmic-muted/50 resize-none" rows={3} />
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <Button type="submit" className="w-full bg-cosmic-accent text-primary-foreground rounded-xl h-11" disabled={loading}>
              {loading ? 'Creating…' : <><Building2 className="w-4 h-4 mr-1" aria-hidden="true" /> Create community</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
