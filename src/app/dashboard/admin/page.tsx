'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield, Users, Building2, FileText, Vote, Gamepad2, Inbox,
  CreditCard, BarChart3, Settings, Search, Eye, Reply, Check,
  TrendingUp, DollarSign, AlertTriangle, ArrowLeft, Zap,
  Activity, Clock, Mail, MessageSquare, CheckCircle, XCircle,
  ChevronDown, Loader2, Send
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalOrgs: number;
  activeProposals: number;
  totalVotes: number;
  totalGamesPlayed: number;
  unreadMessages: number;
  totalRevenue: number;
  planDistribution: { community: number; team: number; guild: number; enterprise: number };
  recentUsers: any[];
  recentMessages: any[];
}

export default function AdminPortalPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Role guard: check admin access BEFORE loading stats
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(user => {
        if (user && (user.role === 'admin' || user.role === 'super_admin')) {
          setIsAdmin(true);
        }
        setAuthChecked(true);
      })
      .catch(() => {
        setAuthChecked(true);
      });
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetch('/api/admin/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isAdmin]);

  const loadUsers = () => {
    fetch(`/api/admin/users?search=${searchQuery}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUsers(data.users || []); });
  };

  const loadMessages = (status = '') => {
    fetch(`/api/admin/messages${status ? `?status=${status}` : ''}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setMessages(Array.isArray(data) ? data : []); });
  };

  const loadBilling = () => {
    fetch('/api/admin/billing')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setBilling(data); });
  };

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'inbox') loadMessages();
    if (activeTab === 'billing') loadBilling();
  }, [activeTab]);

  const handleReply = async (msgId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    await fetch('/api/admin/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: msgId, status: 'replied', reply: replyText }),
    });
    setReplyText('');
    setReplyingTo(null);
    loadMessages();
    setSubmitting(false);
  };

  const handleMarkRead = async (msgId: string) => {
    await fetch('/api/admin/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: msgId, status: 'read' }),
    });
    loadMessages();
    if (stats) setStats({ ...stats, unreadMessages: Math.max(0, stats.unreadMessages - 1) });
  };

  const handleUserPlanChange = async (userId: string, plan: string) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, plan }),
    });
    loadUsers();
  };

  // Auth loading state
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Shield className="w-8 h-8 text-cosmic-rose animate-pulse" />
          <span className="text-cosmic-muted text-sm">Verifying access...</span>
        </div>
      </div>
    );
  }

  // Access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="glass-card-rose p-10 text-center max-w-md" style={{ animation: 'scaleIn 0.4s ease-out' }}>
          <div className="w-20 h-20 rounded-full bg-cosmic-rose/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-cosmic-rose" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 font-heading">Access Restricted</h1>
          <p className="text-cosmic-muted mb-8 leading-relaxed">
            You need admin privileges to access this portal. This area is reserved for CosmoGov administrators only.
          </p>
          <Link href="/dashboard">
            <Button className="bg-cosmic-accent hover:bg-cosmic-accent/90 text-white rounded-xl px-6">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Shield className="w-8 h-8 text-cosmic-rose animate-pulse" />
          <span className="text-cosmic-muted text-sm">Loading admin portal...</span>
        </div>
      </div>
    );
  }

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-cosmic-teal', bg: 'bg-cosmic-teal/10' },
    { label: 'Organizations', value: stats.totalOrgs, icon: Building2, color: 'text-cosmic-accent', bg: 'bg-cosmic-accent/10' },
    { label: 'Active Proposals', value: stats.activeProposals, icon: FileText, color: 'text-cosmic-violet', bg: 'bg-cosmic-violet/10' },
    { label: 'Total Votes', value: stats.totalVotes, icon: Vote, color: 'text-cosmic-amber', bg: 'bg-cosmic-amber/10' },
    { label: 'Games Played', value: stats.totalGamesPlayed, icon: Gamepad2, color: 'text-cosmic-rose', bg: 'bg-cosmic-rose/10' },
    { label: 'Unread Messages', value: stats.unreadMessages, icon: Inbox, color: 'text-cosmic-amber', bg: 'bg-cosmic-amber/10' },
    { label: 'Total Revenue', value: `$${((stats.totalRevenue || 0) / 100).toLocaleString()}`, icon: DollarSign, color: 'text-cosmic-success', bg: 'bg-cosmic-success/10' },
    { label: 'Monthly Revenue', value: `$${((stats.totalRevenue || 0) / 100).toLocaleString()}`, icon: TrendingUp, color: 'text-cosmic-teal', bg: 'bg-cosmic-teal/10' },
  ] : [];

  const planDistribution = stats?.planDistribution;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-cosmic-muted hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cosmic-rose/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-cosmic-rose" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading">Admin Portal</h1>
            <p className="text-cosmic-muted text-sm">Monitor, manage, and control your CosmoGov instance</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#0B1022] border border-white/5 p-1 mb-6 overflow-x-auto flex-nowrap min-w-max h-auto gap-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cosmic-rose/10 data-[state=active]:text-cosmic-rose">
            <Activity className="w-4 h-4 mr-1.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-cosmic-teal/10 data-[state=active]:text-cosmic-teal">
            <Users className="w-4 h-4 mr-1.5" /> Users
          </TabsTrigger>
          <TabsTrigger value="inbox" className="data-[state=active]:bg-cosmic-amber/10 data-[state=active]:text-cosmic-amber relative">
            <Inbox className="w-4 h-4 mr-1.5" /> Inbox
            {stats?.unreadMessages ? (
              <span className="ml-1 w-5 h-5 rounded-full bg-cosmic-rose text-[10px] font-bold text-white flex items-center justify-center">{stats.unreadMessages}</span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-cosmic-success/10 data-[state=active]:text-cosmic-success">
            <CreditCard className="w-4 h-4 mr-1.5" /> Billing
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="data-[state=active]:bg-cosmic-accent/10 data-[state=active]:text-cosmic-accent">
            <BarChart3 className="w-4 h-4 mr-1.5" /> Monitoring
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-cosmic-violet/10 data-[state=active]:text-cosmic-violet">
            <Settings className="w-4 h-4 mr-1.5" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map(s => (
              <Card key={s.label} className="bg-[#0B1022] border-white/5">
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold font-heading">{s.value}</p>
                  <p className="text-xs text-cosmic-muted mt-0.5">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Plan Distribution */}
            <Card className="bg-[#0B1022] border-white/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-cosmic-teal" /> User Plan Distribution
                </h3>
                {planDistribution && (
                  <div className="space-y-3">
                    {[
                      { label: 'Community', count: planDistribution.community, color: 'bg-white/20', pct: stats ? (planDistribution.community / stats.totalUsers * 100) : 0 },
                      { label: 'Team', count: planDistribution.team, color: 'bg-cosmic-accent', pct: stats ? (planDistribution.team / stats.totalUsers * 100) : 0 },
                      { label: 'Guild', count: planDistribution.guild, color: 'bg-cosmic-violet', pct: stats ? (planDistribution.guild / stats.totalUsers * 100) : 0 },
                      { label: 'Enterprise', count: planDistribution.enterprise, color: 'bg-cosmic-amber', pct: stats ? (planDistribution.enterprise / stats.totalUsers * 100) : 0 },
                    ].map(p => (
                      <div key={p.label}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-cosmic-muted">{p.label}</span>
                          <span className="font-medium">{p.count} users ({p.pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${p.color} rounded-full transition-all duration-700`} style={{ width: `${p.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Users */}
            <Card className="bg-[#0B1022] border-white/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cosmic-accent" /> Recent Signups
                </h3>
                <div className="space-y-3">
                  {stats?.recentUsers.map((u: any) => (
                    <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-cosmic-accent/20 flex items-center justify-center text-xs font-bold text-cosmic-accent">
                        {(u.name || 'U')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-cosmic-muted truncate">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] border-white/10">{u.plan}</Badge>
                        {u.role === 'admin' && <Badge className="text-[10px] bg-cosmic-rose/20 text-cosmic-rose border-0">Admin</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Messages */}
            <Card className="bg-[#0B1022] border-white/5 lg:col-span-2">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-cosmic-amber" /> Recent Contact Messages
                </h3>
                <div className="space-y-3">
                  {stats?.recentMessages.map((m: any) => (
                    <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${m.status === 'new' ? 'bg-cosmic-rose/20 text-cosmic-rose' : m.status === 'read' ? 'bg-cosmic-amber/20 text-cosmic-amber' : 'bg-cosmic-success/20 text-cosmic-success'}`}>
                        {m.status === 'new' ? '!' : m.status === 'replied' ? <Check className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium">{m.name}</span>
                          <Badge variant="outline" className="text-[10px] border-white/10">{m.category}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${m.priority === 'urgent' ? 'border-cosmic-rose/30 text-cosmic-rose' : m.priority === 'high' ? 'border-cosmic-amber/30 text-cosmic-amber' : 'border-white/10'}`}>
                            {m.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-cosmic-muted mb-1">{m.subject}</p>
                        <p className="text-xs text-cosmic-muted line-clamp-2">{m.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users">
          <Card className="bg-[#0B1022] border-white/5">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <h3 className="text-lg font-semibold font-heading flex items-center gap-2">
                  <Users className="w-5 h-5 text-cosmic-teal" /> User Management
                </h3>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search users..."
                    className="w-full sm:w-64 bg-white/5 border-white/10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                  />
                  <Button variant="ghost" size="sm" onClick={loadUsers} className="text-cosmic-muted">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-3 px-2 text-cosmic-muted font-medium">User</th>
                      <th className="text-left py-3 px-2 text-cosmic-muted font-medium">Plan</th>
                      <th className="text-left py-3 px-2 text-cosmic-muted font-medium">Role</th>
                      <th className="text-left py-3 px-2 text-cosmic-muted font-medium">XP / Level</th>
                      <th className="text-left py-3 px-2 text-cosmic-muted font-medium">Joined</th>
                      <th className="text-left py-3 px-2 text-cosmic-muted font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-cosmic-accent/20 flex items-center justify-center text-xs font-bold text-cosmic-accent">
                              {(u.name || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{u.name}</p>
                              <p className="text-xs text-cosmic-muted">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <select
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-cosmic-muted"
                            value={u.plan}
                            onChange={(e) => handleUserPlanChange(u.id, e.target.value)}
                          >
                            <option value="community">Community</option>
                            <option value="team">Team</option>
                            <option value="guild">Guild</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className={`text-[10px] ${u.role === 'admin' ? 'border-cosmic-rose/30 text-cosmic-rose' : 'border-white/10'}`}>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-cosmic-amber text-xs">{u.totalXp} XP</span>
                          <span className="text-cosmic-muted text-xs ml-1">Lv.{u.level}</span>
                        </td>
                        <td className="py-3 px-2 text-xs text-cosmic-muted">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2">
                          <Button variant="ghost" size="sm" className="text-cosmic-muted hover:text-white h-7 text-xs">
                            <Eye className="w-3 h-3 mr-1" /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-cosmic-muted">Click search to load users</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {users.map(u => (
                  <Card key={u.id} className="bg-white/[0.02] border-white/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-cosmic-accent/20 flex items-center justify-center text-sm font-bold text-cosmic-accent">
                          {(u.name || 'U')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-grow">
                          <p className="font-medium text-sm truncate">{u.name}</p>
                          <p className="text-xs text-cosmic-muted truncate">{u.email}</p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${u.role === 'admin' ? 'border-cosmic-rose/30 text-cosmic-rose' : 'border-white/10'}`}>
                          {u.role}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                        <div><span className="text-cosmic-amber font-bold">{u.totalXp} XP</span><br/><span className="text-cosmic-muted">XP</span></div>
                        <div><span className="font-bold">Lv.{u.level}</span><br/><span className="text-cosmic-muted">Level</span></div>
                        <div><span className="font-bold">{new Date(u.createdAt).toLocaleDateString()}</span><br/><span className="text-cosmic-muted">Joined</span></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <select
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-cosmic-muted"
                          value={u.plan}
                          onChange={(e) => handleUserPlanChange(u.id, e.target.value)}
                        >
                          <option value="community">Community</option>
                          <option value="team">Team</option>
                          <option value="guild">Guild</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                        <Button variant="ghost" size="sm" className="text-cosmic-muted hover:text-white h-7 text-xs">
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {users.length === 0 && (
                  <div className="py-8 text-center text-cosmic-muted">Click search to load users</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INBOX TAB */}
        <TabsContent value="inbox">
          <Card className="bg-[#0B1022] border-white/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold font-heading flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-cosmic-amber" /> Message Inbox
                </h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => loadMessages('new')} className="text-cosmic-rose text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" /> New
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => loadMessages('')} className="text-cosmic-muted text-xs">
                    All Messages
                  </Button>
                </div>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {messages.map(m => (
                  <div key={m.id} className={`p-4 rounded-xl border ${m.status === 'new' ? 'border-cosmic-rose/20 bg-cosmic-rose/5' : 'border-white/5 bg-white/[0.02]'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-sm">{m.name}</span>
                          <span className="text-xs text-cosmic-muted">{m.email}</span>
                          <Badge variant="outline" className="text-[10px] border-white/10">{m.category}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${m.priority === 'urgent' ? 'border-cosmic-rose/30 text-cosmic-rose' : m.priority === 'high' ? 'border-cosmic-amber/30 text-cosmic-amber' : 'border-white/10'}`}>
                            {m.priority}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${m.status === 'new' ? 'border-cosmic-rose/30 text-cosmic-rose' : m.status === 'replied' ? 'border-cosmic-success/30 text-cosmic-success' : 'border-white/10'}`}>
                            {m.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{m.subject}</p>
                      </div>
                      <span className="text-xs text-cosmic-muted">{new Date(m.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-cosmic-muted mb-3">{m.message}</p>
                    {m.reply && (
                      <div className="bg-cosmic-success/5 border border-cosmic-success/10 rounded-lg p-3 mb-3">
                        <p className="text-xs text-cosmic-success mb-1">Reply:</p>
                        <p className="text-sm">{m.reply}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {m.status === 'new' && (
                        <Button variant="ghost" size="sm" className="text-xs text-cosmic-amber" onClick={() => handleMarkRead(m.id)}>
                          <Eye className="w-3 h-3 mr-1" /> Mark Read
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-xs text-cosmic-accent" onClick={() => setReplyingTo(replyingTo === m.id ? null : m.id)}>
                        <Reply className="w-3 h-3 mr-1" /> Reply
                      </Button>
                    </div>
                    {replyingTo === m.id && (
                      <div className="mt-3 flex items-center gap-2">
                        <Input
                          className="flex-grow bg-white/5 border-white/10"
                          placeholder="Type your reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleReply(m.id)}
                        />
                        <Button size="sm" className="bg-cosmic-accent text-white" onClick={() => handleReply(m.id)} disabled={submitting}>
                          {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="py-12 text-center text-cosmic-muted">
                    <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No messages found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BILLING TAB */}
        <TabsContent value="billing">
          <div className="grid lg:grid-cols-3 gap-4 mb-6">
            <Card className="bg-[#0B1022] border-white/5">
              <CardContent className="p-4">
                <div className="w-9 h-9 rounded-lg bg-cosmic-success/10 flex items-center justify-center mb-3">
                  <DollarSign className="w-4 h-4 text-cosmic-success" />
                </div>
                <p className="text-2xl font-bold font-heading">${((billing?.monthlyRevenue?._sum?.amount || 0) / 100).toLocaleString()}</p>
                <p className="text-xs text-cosmic-muted mt-0.5">Total Revenue</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0B1022] border-white/5">
              <CardContent className="p-4">
                <div className="w-9 h-9 rounded-lg bg-cosmic-accent/10 flex items-center justify-center mb-3">
                  <CreditCard className="w-4 h-4 text-cosmic-accent" />
                </div>
                <p className="text-2xl font-bold font-heading">{billing?.monthlyRevenue?._count || 0}</p>
                <p className="text-xs text-cosmic-muted mt-0.5">Paid Subscriptions</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0B1022] border-white/5">
              <CardContent className="p-4">
                <div className="w-9 h-9 rounded-lg bg-cosmic-violet/10 flex items-center justify-center mb-3">
                  <TrendingUp className="w-4 h-4 text-cosmic-violet" />
                </div>
                <p className="text-2xl font-bold font-heading">{billing?.planBreakdown?.length || 0}</p>
                <p className="text-xs text-cosmic-muted mt-0.5">Active Plans</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#0B1022] border-white/5">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cosmic-success" /> Billing Records
              </h3>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-3 px-2 text-cosmic-muted font-medium">User</th>
                      <th className="text-left py-3 px-2 text-cosmic-muted font-medium">Plan</th>
                      <th className="text-left py-3 px-2 text-cosmic-muted font-medium">Amount</th>
                      <th className="text-left py-3 px-2 text-cosmic-muted font-medium">Status</th>
                      <th className="text-left py-3 px-2 text-cosmic-muted font-medium">Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billing?.records?.map((r: any) => (
                      <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-3 px-2 text-sm">{r.user?.name || 'Unknown'}</td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className="text-[10px] border-white/10 capitalize">{r.plan}</Badge>
                        </td>
                        <td className="py-3 px-2 text-sm font-medium">${(r.amount / 100).toFixed(2)}</td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className={`text-[10px] ${r.status === 'paid' ? 'border-cosmic-success/30 text-cosmic-success' : r.status === 'failed' ? 'border-cosmic-rose/30 text-cosmic-rose' : 'border-cosmic-amber/30 text-cosmic-amber'}`}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-xs text-cosmic-muted">
                          {new Date(r.periodStart).toLocaleDateString()} - {new Date(r.periodEnd).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {billing?.records?.map((r: any) => (
                  <Card key={r.id} className="bg-white/[0.02] border-white/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{r.user?.name || 'Unknown'}</span>
                        <Badge variant="outline" className={`text-[10px] ${r.status === 'paid' ? 'border-cosmic-success/30 text-cosmic-success' : r.status === 'failed' ? 'border-cosmic-rose/30 text-cosmic-rose' : 'border-cosmic-amber/30 text-cosmic-amber'}`}>
                          {r.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] border-white/10 capitalize">{r.plan}</Badge>
                        <span className="text-sm font-medium text-cosmic-amber">${(r.amount / 100).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-cosmic-muted">
                        {new Date(r.periodStart).toLocaleDateString()} - {new Date(r.periodEnd).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {(!billing?.records || billing.records.length === 0) && (
                  <div className="py-8 text-center text-cosmic-muted">No billing records</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MONITORING TAB */}
        <TabsContent value="monitoring">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-[#0B1022] border-white/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cosmic-accent" /> System Health
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'API Response Time', value: '42ms', status: 'healthy', pct: 95 },
                    { label: 'Database Load', value: '12%', status: 'healthy', pct: 12 },
                    { label: 'Memory Usage', value: '67%', status: 'warning', pct: 67 },
                    { label: 'CPU Usage', value: '23%', status: 'healthy', pct: 23 },
                    { label: 'Disk Space', value: '34%', status: 'healthy', pct: 34 },
                    { label: 'Error Rate', value: '0.02%', status: 'healthy', pct: 2 },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-cosmic-muted">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.value}</span>
                          <div className={`w-2 h-2 rounded-full ${item.status === 'healthy' ? 'bg-cosmic-success' : item.status === 'warning' ? 'bg-cosmic-amber' : 'bg-cosmic-rose'}`} />
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${item.status === 'healthy' ? 'bg-cosmic-success' : item.status === 'warning' ? 'bg-cosmic-amber' : 'bg-cosmic-rose'}`} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0B1022] border-white/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cosmic-violet" /> Activity Monitor
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Votes Today', value: 24, trend: '+12%', icon: Vote },
                    { label: 'New Proposals Today', value: 3, trend: '+50%', icon: FileText },
                    { label: 'Games Played Today', value: 18, trend: '+5%', icon: Gamepad2 },
                    { label: 'Active Users (24h)', value: 42, trend: '+8%', icon: Users },
                    { label: 'AI Queries Today', value: 67, trend: '+23%', icon: Brain },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cosmic-accent/10 flex items-center justify-center">
                          <item.icon className="w-4 h-4 text-cosmic-accent" />
                        </div>
                        <span className="text-sm text-cosmic-muted">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-heading">{item.value}</span>
                        <span className="text-xs text-cosmic-success">{item.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-[#0B1022] border-white/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cosmic-violet" /> Platform Settings
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Allow New Registrations', desc: 'Enable or disable user signups', enabled: true },
                    { label: 'Require Email Verification', desc: 'Users must verify email before accessing dashboard', enabled: false },
                    { label: 'Enable AI Assistant', desc: 'Allow users to access the AI governance assistant', enabled: true },
                    { label: 'Public Proposals by Default', desc: 'New proposals are visible to all users', enabled: true },
                    { label: 'Maintenance Mode', desc: 'Show maintenance page to non-admin users', enabled: false },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <div>
                        <p className="text-sm font-medium">{s.label}</p>
                        <p className="text-xs text-cosmic-muted">{s.desc}</p>
                      </div>
                      <div className={`w-10 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${s.enabled ? 'bg-cosmic-teal' : 'bg-white/10'}`}>
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${s.enabled ? 'translate-x-4' : ''}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0B1022] border-white/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cosmic-rose" /> Security & Access
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Two-Factor Authentication', desc: 'Require 2FA for admin accounts', enabled: true },
                    { label: 'Session Timeout', desc: 'Auto-logout after 30 minutes of inactivity', enabled: true },
                    { label: 'Rate Limiting', desc: 'Limit API requests per user to 100/min', enabled: true },
                    { label: 'Audit Logging', desc: 'Log all admin actions for compliance', enabled: true },
                    { label: 'IP Whitelisting', desc: 'Restrict admin access to known IPs', enabled: false },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <div>
                        <p className="text-sm font-medium">{s.label}</p>
                        <p className="text-xs text-cosmic-muted">{s.desc}</p>
                      </div>
                      <div className={`w-10 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${s.enabled ? 'bg-cosmic-teal' : 'bg-white/10'}`}>
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${s.enabled ? 'translate-x-4' : ''}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
