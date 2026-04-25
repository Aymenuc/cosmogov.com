'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User, Mail, Shield, Zap, Trash2, CreditCard, Bell,
  Check, Flame, Crown, Rocket, Building2, Gamepad2,
  FileText, BarChart3, ArrowUpRight, AlertTriangle,
  Save, Loader2, Globe, Moon, Sun
} from 'lucide-react';
import PushNotificationToggle from '@/components/PushNotificationToggle';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  plan: string;
  role: string;
  totalXp: number;
  level: number;
  streak: number;
  ageGroup: string | null;
  interests: string;
}

const planDetails: Record<string, { price: string; features: string[]; color: string }> = {
  community: { price: 'Free', color: 'text-cosmic-muted', features: ['5 proposals/month', '1 organization', '3 governance games', 'Basic AI assistant', 'Community support'] },
  team: { price: '$39/org/mo', color: 'text-cosmic-accent', features: ['Unlimited proposals', '5 organizations', 'All 6 games', 'Full AI assistant', 'Analytics dashboard', 'Custom game rounds', 'Priority support'] },
  guild: { price: '$149/org/mo', color: 'text-cosmic-violet', features: ['Everything in Team', 'Unlimited organizations', 'Decision quality metrics', 'Advanced analytics', 'API access', 'Dedicated account manager', 'Custom integrations'] },
  enterprise: { price: 'Custom', color: 'text-cosmic-amber', features: ['Everything in Guild', 'SSO & SAML', '99.99% SLA', 'Dedicated infrastructure', 'Custom AI models', 'On-premise option', '24/7 dedicated support'] },
};

const interestTags = ['Governance', 'Democracy', 'Data Science', 'Psychology', 'Strategy', 'Leadership', 'Ethics', 'Finance', 'Community', 'Technology', 'Policy', 'Logic'];

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [ageGroup, setAgeGroup] = useState('adult');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    votes: true, proposals: true, games: true, system: true, mentions: true,
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        setUser(data);
        setName(data.name || '');
        setAgeGroup(data.ageGroup || 'adult');
        try {
          const interests = JSON.parse(data.interests || '[]');
          setSelectedInterests(Array.isArray(interests) ? interests : []);
        } catch { setSelectedInterests([]); }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ageGroup, interests: JSON.stringify(selectedInterests) }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {}
    setSaving(false);
  };

  const toggleInterest = (tag: string) => {
    setSelectedInterests(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex items-center gap-2 text-cosmic-muted">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading...
      </div>
    </div>
  );

  const currentPlan = planDetails[user.plan] || planDetails.community;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold font-heading mb-6">Settings</h1>

      <Tabs defaultValue="profile">
        <TabsList className="bg-[#0B1022] border border-white/5 p-1 mb-6 overflow-x-auto flex-nowrap min-w-max">
          <TabsTrigger value="profile" className="data-[state=active]:bg-cosmic-accent/10 data-[state=active]:text-cosmic-accent">
            <User className="w-4 h-4 mr-1.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="plan" className="data-[state=active]:bg-cosmic-violet/10 data-[state=active]:text-cosmic-violet">
            <CreditCard className="w-4 h-4 mr-1.5" /> Plan & Billing
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-cosmic-amber/10 data-[state=active]:text-cosmic-amber">
            <Bell className="w-4 h-4 mr-1.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-cosmic-teal/10 data-[state=active]:text-cosmic-teal">
            <Globe className="w-4 h-4 mr-1.5" /> Preferences
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile">
          <Card className="bg-[#0B1022] border-white/5 mb-6">
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-cosmic-accent" /> Profile Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-cosmic-accent/20 flex items-center justify-center text-2xl font-bold text-cosmic-accent ring-4 ring-cosmic-accent/10">
                    {(name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{name || 'Unnamed User'}</p>
                    <p className="text-sm text-cosmic-muted">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-[10px] capitalize ${currentPlan.color}`}>{user.plan}</Badge>
                      {user.role === 'admin' && <Badge className="text-[10px] bg-cosmic-rose/20 text-cosmic-rose border-0">Admin</Badge>}
                      <Badge variant="outline" className="text-[10px] border-white/10">Lv.{user.level}</Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-cosmic-muted mb-1.5 block">Display Name</label>
                  <Input value={name} onChange={e => setName(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-sm text-cosmic-muted mb-1.5 block">Email</label>
                  <Input value={user.email} disabled className="bg-white/5 border-white/10 text-cosmic-muted" />
                  <p className="text-xs text-cosmic-muted mt-1">Email changes require verification</p>
                </div>
                <div>
                  <label className="text-sm text-cosmic-muted mb-1.5 block">Age Group</label>
                  <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                    <option value="youth">Youth (13-17)</option>
                    <option value="young_adult">Young Adult (18-25)</option>
                    <option value="adult">Adult (26-55)</option>
                    <option value="senior">Senior (55+)</option>
                  </select>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cosmic-amber" />
                    <span className="text-sm">{user.totalXp?.toLocaleString()} XP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-cosmic-amber" />
                    <span className="text-sm">{user.streak} day streak</span>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave} disabled={saving} className="bg-cosmic-accent text-white rounded-xl">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : saved ? <Check className="w-4 h-4 mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                    {saved ? 'Saved!' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0B1022] border-cosmic-rose/10">
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold mb-2 flex items-center gap-2 text-cosmic-rose">
                <AlertTriangle className="w-4 h-4" /> Danger Zone
              </h2>
              <p className="text-xs text-cosmic-muted mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
              <Button variant="ghost" className="text-cosmic-rose hover:bg-cosmic-rose/10">Delete Account</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLAN & BILLING TAB */}
        <TabsContent value="plan">
          <Card className="bg-[#0B1022] border-white/5 mb-6">
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Crown className="w-4 h-4 text-cosmic-violet" /> Current Plan
              </h2>
              <div className="flex items-center justify-between p-4 rounded-xl bg-cosmic-violet/5 border border-cosmic-violet/10 mb-4">
                <div>
                  <p className="text-lg font-bold font-heading capitalize">{user.plan} Plan</p>
                  <p className="text-sm text-cosmic-muted">{currentPlan.price}</p>
                </div>
                <Badge className="bg-cosmic-teal/20 text-cosmic-teal border-0">Active</Badge>
              </div>
              <div className="space-y-2 mb-4">
                {currentPlan.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-3 h-3 text-cosmic-teal" />
                    <span className="text-cosmic-muted">{f}</span>
                  </div>
                ))}
              </div>
              {user.plan !== 'guild' && user.plan !== 'enterprise' && (
                <Button className="bg-cosmic-violet text-white rounded-xl">
                  <ArrowUpRight className="w-4 h-4 mr-1" /> Upgrade Plan
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#0B1022] border-white/5">
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cosmic-accent" /> Billing History
              </h2>
              <p className="text-xs text-cosmic-muted">No billing records found for your account.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications">
          <Card className="bg-[#0B1022] border-white/5">
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-cosmic-amber" /> Notification Preferences
              </h2>
              <div className="space-y-4">
                {[
                  { key: 'votes', label: 'Vote Notifications', desc: 'Get notified when someone votes on your proposals' },
                  { key: 'proposals', label: 'Proposal Updates', desc: 'New proposals in your organizations' },
                  { key: 'games', label: 'Game Results', desc: 'Leaderboard updates and game achievements' },
                  { key: 'system', label: 'System Alerts', desc: 'Important platform updates and maintenance' },
                  { key: 'mentions', label: 'Mentions', desc: 'When someone mentions you in a comment' },
                ].map(s => (
                  <div key={s.key} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div>
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-xs text-cosmic-muted">{s.desc}</p>
                    </div>
                    <div
                      className={`w-10 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${notifSettings[s.key as keyof typeof notifSettings] ? 'bg-cosmic-teal' : 'bg-white/10'}`}
                      onClick={() => setNotifSettings(prev => ({ ...prev, [s.key]: !prev[s.key as keyof typeof prev] }))}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifSettings[s.key as keyof typeof notifSettings] ? 'translate-x-4' : ''}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Push Notifications */}
              <div className="mt-6 pt-4 border-t border-white/5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cosmic-teal" /> Browser Push Notifications
                </h3>
                <PushNotificationToggle />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREFERENCES TAB */}
        <TabsContent value="preferences">
          <Card className="bg-[#0B1022] border-white/5 mb-6">
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cosmic-teal" /> Interests
              </h2>
              <p className="text-xs text-cosmic-muted mb-3">Select your interests to get personalized game and content recommendations</p>
              <div className="flex flex-wrap gap-2">
                {interestTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleInterest(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      selectedInterests.includes(tag) ? 'border-cosmic-teal/30 bg-cosmic-teal/10 text-cosmic-teal' : 'border-white/5 text-cosmic-muted hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0B1022] border-white/5">
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-cosmic-amber" /> Game Preferences
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <div>
                    <p className="text-sm font-medium">Animated Game Effects</p>
                    <p className="text-xs text-cosmic-muted">Canvas animations and visual effects during games</p>
                  </div>
                  <div className="w-10 h-6 rounded-full flex items-center px-0.5 cursor-pointer bg-cosmic-teal">
                    <div className="w-5 h-5 rounded-full bg-white translate-x-4 transition-transform" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <div>
                    <p className="text-sm font-medium">Sound Effects</p>
                    <p className="text-xs text-cosmic-muted">Audio feedback during game interactions</p>
                  </div>
                  <div className="w-10 h-6 rounded-full flex items-center px-0.5 cursor-pointer bg-white/10">
                    <div className="w-5 h-5 rounded-full bg-white transition-transform" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <div>
                    <p className="text-sm font-medium">Difficulty Hint</p>
                    <p className="text-xs text-cosmic-muted">Show recommended difficulty based on your level</p>
                  </div>
                  <div className="w-10 h-6 rounded-full flex items-center px-0.5 cursor-pointer bg-cosmic-teal">
                    <div className="w-5 h-5 rounded-full bg-white translate-x-4 transition-transform" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving} className="bg-cosmic-accent text-white rounded-xl">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
