'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function EditProposalPage() {
  const params = useParams();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    try {
      await fetch(`/api/proposals/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      router.push(`/dashboard/proposals/${params.id}`);
    } catch {}
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-cosmic-accent animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" className="text-cosmic-muted hover:text-white mb-4" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
      <h1 className="text-2xl font-bold font-heading mb-6">Edit Proposal</h1>
      <Card className="bg-[#0B1022] border-white/5">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-cosmic-muted mb-1.5 block">Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} required className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-sm text-cosmic-muted mb-1.5 block">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} required rows={8} className="bg-white/5 border-white/10 text-white resize-y" />
            </div>
            <Button type="submit" className="w-full bg-cosmic-accent text-white rounded-xl h-11" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
