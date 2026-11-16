'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import WorkspaceHeading from '@/components/WorkspaceHeading';

export default function EditProposalPage() {
  const params = useParams();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/proposals/${params.id}`).then(r => r.json()).then(data => {
      setTitle(data.title || '');
      setDescription(data.description || '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/proposals/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        router.push(`/dashboard/proposals/${params.id}`);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'We couldn’t save your changes. Try again.');
    } catch {
      setError('We couldn’t reach CosmoGov. Check your connection and try again.');
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20" role="status"><Loader2 className="w-6 h-6 text-cosmic-accent animate-spin" aria-hidden="true" /><span className="sr-only">Loading the proposal</span></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <WorkspaceHeading
        title="Edit proposal"
        description="You can change the wording until the first vote is cast. After that it's locked, so everyone voted on the same text."
        back={{ href: `/dashboard/proposals/${params.id}`, label: 'Back to the proposal' }}
      />
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="edit-title" className="text-sm text-cosmic-muted mb-1.5 block">Question or title</label>
              <Input id="edit-title" maxLength={200} value={title} onChange={e => setTitle(e.target.value)} required className="bg-foreground/5 border-border text-foreground" />
            </div>
            <div>
              <label htmlFor="edit-description" className="text-sm text-cosmic-muted mb-1.5 block">What and why</label>
              <Textarea id="edit-description" value={description} onChange={e => setDescription(e.target.value)} required rows={8} className="bg-foreground/5 border-border text-foreground resize-y min-h-[180px]" />
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <Button type="submit" className="w-full bg-cosmic-accent text-primary-foreground rounded-xl h-11" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
