'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import WorkspaceHeading from '@/components/WorkspaceHeading';
import LocationSelector, { LocationData } from '@/components/LocationSelector';

export default function CreateProposalPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [error, setError] = useState('');
  // Pre-fill from a link (e.g. "Turn my street into a proposal" in Dream street).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('title')?.slice(0, 200);
    const d = params.get('description')?.slice(0, 4000);
    const org = params.get('orgId')?.slice(0, 100);
    if (t || d || org)
      Promise.resolve().then(() => {
        if (t) setTitle(t);
        if (d) setDescription(d);
        if (org) setOrganizationId(org);
      });
  }, []);
  const [category, setCategory] = useState('governance');
  const [votingType, setVotingType] = useState('yes_no');
  const [options, setOptions] = useState('For, Against');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [location, setLocation] = useState<LocationData>({});

  const handleAIGenerate = async () => {
    if (!title) return;
    setAiLoading(true);
    setError('');
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
      else if (data.error) setError(data.error);
    } catch {
      setError('The AI helper is not reachable right now. You can write the description yourself.');
    }
    setAiLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, category, votingType, organizationId,
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
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(`/dashboard/proposals/${data.id}`);
        return;
      }
      setError(data.error || 'We couldn’t publish the proposal. Check the fields and try again.');
    } catch {
      setError('We couldn’t reach CosmoGov. Check your connection and try again.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <WorkspaceHeading
        title={organizationId ? 'Start a community proposal' : 'Start a proposal'}
        description="Put a clear question to your neighbours. Once the first vote is in, the wording and choices are locked."
        back={{ href: '/dashboard/proposals', label: 'All proposals' }}
      />
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="proposal-title" className="text-sm text-cosmic-muted mb-1.5 block">Question or title</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input id="proposal-title" maxLength={200} value={title} onChange={e => setTitle(e.target.value)} required placeholder="What should we decide?"
                  className="bg-foreground/5 border-border text-foreground placeholder:text-cosmic-muted/50" />
                <Button type="button" variant="ghost" className="text-cosmic-teal hover:text-cosmic-teal/80 whitespace-nowrap"
                  onClick={handleAIGenerate} disabled={aiLoading || !title}>
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span className="ml-1 text-xs">Draft with AI</span>
                </Button>
              </div>
            </div>
            <div>
              <label htmlFor="proposal-description" className="text-sm text-cosmic-muted mb-1.5 block">What and why</label>
              <Textarea id="proposal-description" value={description} onChange={e => setDescription(e.target.value)} required rows={8}
                placeholder="What would change, who it affects, and why it matters…"
                className="bg-foreground/5 border-border text-foreground placeholder:text-cosmic-muted/50 resize-y min-h-[180px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="proposal-category" className="text-sm text-cosmic-muted mb-1.5 block">Topic</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="proposal-category" className="bg-foreground/5 border-border text-foreground"><SelectValue /></SelectTrigger>
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
                <label htmlFor="proposal-voting" className="text-sm text-cosmic-muted mb-1.5 block">How people vote</label>
                <Select value={votingType} onValueChange={setVotingType}>
                  <SelectTrigger id="proposal-voting" className="bg-foreground/5 border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes_no">Yes / No</SelectItem>
                    <SelectItem value="single_choice">Pick one option</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label htmlFor="proposal-options" className="text-sm text-cosmic-muted mb-1.5 block">Choices, separated by commas</label>
              <Input id="proposal-options" value={options} onChange={e => setOptions(e.target.value)}
                className="bg-foreground/5 border-border text-foreground placeholder:text-cosmic-muted/50"
                placeholder="For, Against" />
            </div>

            {/* Location Selector */}
            <LocationSelector
              value={location}
              onChange={setLocation}
              showMap
            />

            {error && <p className="form-error" role="alert">{error}</p>}
            <Button type="submit" className="w-full bg-cosmic-accent text-primary-foreground rounded-xl h-11" disabled={loading}>
              {loading ? 'Publishing…' : 'Publish proposal'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
