'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import LocationSelector, { LocationData } from '@/components/LocationSelector';

export default function CreateProposalPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('governance');
  const [votingType, setVotingType] = useState('yes_no');
  const [options, setOptions] = useState('For, Against');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [location, setLocation] = useState<LocationData>({});

  const handleAIGenerate = async () => {
    if (!title) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'proposal_draft',
          messages: [{ role: 'user', content: `Generate a detailed governance proposal about: ${title}` }],
        }),
      });
      const data = await res.json();
      if (data.content) setDescription(data.content);
    } catch {}
    setAiLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, category, votingType,
          options: options.split(',').map(o => o.trim()).filter(Boolean),
          countryId: location.countryId || undefined,
          countryName: location.countryName || undefined,
          stateId: location.stateId || undefined,
          stateName: location.stateName || undefined,
          cityId: location.cityId || undefined,
          cityName: location.cityName || undefined,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/proposals/${data.id}`);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" className="text-cosmic-muted hover:text-white mb-4" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>
      <h1 className="text-2xl font-bold font-heading mb-6">Create Proposal</h1>
      <Card className="bg-[#0B1022] border-white/5">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-cosmic-muted mb-1.5 block">Title</label>
              <div className="flex gap-2">
                <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="What should we decide?"
                  className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50" />
                <Button type="button" variant="ghost" className="text-cosmic-teal hover:text-cosmic-teal/80 whitespace-nowrap"
                  onClick={handleAIGenerate} disabled={aiLoading || !title}>
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span className="ml-1 text-xs">AI Draft</span>
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm text-cosmic-muted mb-1.5 block">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} required rows={8}
                placeholder="Describe the proposal in detail..."
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50 resize-y" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-cosmic-muted mb-1.5 block">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="governance">Governance</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-cosmic-muted mb-1.5 block">Voting Type</label>
                <Select value={votingType} onValueChange={setVotingType}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes_no">Yes / No</SelectItem>
                    <SelectItem value="single_choice">Single Choice</SelectItem>
                    <SelectItem value="ranked_choice">Ranked Choice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm text-cosmic-muted mb-1.5 block">Options (comma-separated)</label>
              <Input value={options} onChange={e => setOptions(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-cosmic-muted/50"
                placeholder="For, Against" />
            </div>

            {/* Location Selector */}
            <LocationSelector
              value={location}
              onChange={setLocation}
              showMap
            />

            <Button type="submit" className="w-full bg-cosmic-accent text-white rounded-xl h-11" disabled={loading}>
              {loading ? 'Creating...' : 'Create Proposal'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
