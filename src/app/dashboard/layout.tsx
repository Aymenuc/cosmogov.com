'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import {
  LayoutDashboard, FileText, Building2, Gamepad2, Brain,
  BarChart3, Trophy, Settings, LogOut, Menu, X, Rocket,
  Flame, Zap, Search, Target, Shield, Bell, ChevronDown,
  Home, Crown, User, CreditCard, Inbox, MessageSquare,
  Star, Activity, Megaphone, Wallet, Eye,
  FileSignature, Users, Calendar, Sparkles, Orbit, Globe,
  Scale, ClipboardList, Dices, Gavel, Landmark
} from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  plan: string;
  role: string;
  totalXp: number;
  level: number;
  streak: number;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

const navSections = [
  {
    label: null, // No header for overview
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    ],
  },
  {
    label: 'Participate',
    items: [
      { href: '/dashboard/participation', icon: Megaphone, label: 'Hub' },
      { href: '/dashboard/participation/budget', icon: Wallet, label: 'Budget' },
      { href: '/dashboard/participation/legislation', icon: Scale, label: 'Legislation' },
      { href: '/dashboard/participation/surveys', icon: ClipboardList, label: 'Surveys' },
      { href: '/dashboard/participation/sortition', icon: Dices, label: 'Sortition' },
      { href: '/dashboard/participation/binding-proposals', icon: Gavel, label: 'Binding Proposals' },
      { href: '/dashboard/participation/initiatives', icon: FileSignature, label: 'Initiatives' },
      { href: '/dashboard/participation/accountability', icon: Eye, label: 'Accountability' },
      { href: '/dashboard/participation/assemblies', icon: Users, label: 'Assemblies' },
      { href: '/dashboard/participation/meetings', icon: Calendar, label: 'Meetings' },
    ],
  },
  {
    label: 'Propose & Decide',
    items: [
      { href: '/dashboard/proposals', icon: FileText, label: 'Proposals' },
      { href: '/dashboard/decisions', icon: Target, label: 'Decisions' },
    ],
  },
  {
    label: 'Community',
    items: [
      { href: '/dashboard/organizations', icon: Building2, label: 'Organizations' },
      { href: '/dashboard/assembly-hall', icon: Star, label: 'Assembly Hall' },
      { href: '/dashboard/chat', icon: MessageSquare, label: 'Chat Rooms' },
    ],
  },
  {
    label: 'Explore',
    items: [
      { href: '/dashboard/cosmic-map', icon: Globe, label: 'Cosmic Map' },
      { href: '/dashboard/explore', icon: Orbit, label: 'Global Explorer' },
      { href: '/dashboard/pulse', icon: Activity, label: 'Governance Pulse' },
    ],
  },
  {
    label: 'AI & Intelligence',
    items: [
      { href: '/dashboard/ai-agents', icon: Sparkles, label: 'AI Agents' },
      { href: '/dashboard/assistant', icon: Brain, label: 'AI Assistant' },
      { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  {
    label: 'Progress',
    items: [
      { href: '/dashboard/games', icon: Gamepad2, label: 'Games' },
      { href: '/dashboard/leaderboards', icon: Trophy, label: 'Leaderboards' },
      { href: '/dashboard/reputation', icon: Star, label: 'Cosmic Score' },
    ],
  },
  {
    label: null, // No header for utility items
    items: [
      { href: '/dashboard/search', icon: Search, label: 'Search' },
      { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

// Gov Portal nav item — only visible for gov_official, admin, super_admin
const govPortalNavItem = { href: '/dashboard/gov-portal', icon: Landmark, label: 'Gov Portal' };

const planColors: Record<string, string> = {
  community: 'bg-white/10 text-cosmic-muted',
  team: 'bg-cosmic-accent/20 text-cosmic-accent',
  guild: 'bg-cosmic-violet/20 text-cosmic-violet',
  enterprise: 'bg-cosmic-amber/20 text-cosmic-amber',
};

const planLabels: Record<string, string> = {
  community: 'Community',
  team: 'Team',
  guild: 'Guild',
  enterprise: 'Enterprise',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) { setUser(data); setLoading(false); }
        else { router.push('/auth/login'); }
      })
      .catch(() => router.push('/auth/login'));
  }, [router]);

  useEffect(() => {
    if (user) {
      fetch('/api/notifications')
        .then(r => r.ok ? r.json() : [])
        .then(data => setNotifications(Array.isArray(data) ? data.slice(0, 10) : []))
        .catch(() => {});
    }
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cosmic-teal to-cosmic-violet animate-pulse flex items-center justify-center">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cosmic-teal animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-cosmic-accent animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-cosmic-violet animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-cosmic-muted text-sm">Loading cosmos...</span>
        </div>
      </div>
    );
  }

  const xpToNext = (user?.level || 1) * 500;
  const xpProgress = ((user?.totalXp || 0) % xpToNext) / xpToNext * 100;
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isGovOfficial = user?.role === 'gov_official' || isAdmin;

  return (
    <div className="min-h-screen flex overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-[#04050b]/50 backdrop-blur-xl">
        <div className="p-4">
          {/* Logo + Back to Home */}
          <div className="flex items-center justify-between mb-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cosmic-teal to-cosmic-violet flex items-center justify-center group-hover:scale-110 transition-transform">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-lg">CosmoGov</span>
            </Link>
          </div>
          <Link href="/" className="flex items-center gap-1.5 text-xs text-cosmic-muted hover:text-cosmic-teal transition-colors py-1">
            <Home className="w-3 h-3" /> Back to Home
          </Link>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-4 mb-4">
            <div className="glass-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-full bg-cosmic-accent/20 flex items-center justify-center text-sm font-bold text-cosmic-accent ring-2 ring-cosmic-accent/10">
                  {(user.name || 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-grow">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-cosmic-muted">Lv.{user.level}</span>
                    {user.streak > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-cosmic-amber">
                        <Flame className="w-3 h-3" />{user.streak}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* XP Progress */}
              <div className="flex items-center gap-2 text-xs mb-2">
                <Zap className="w-3 h-3 text-cosmic-amber" />
                <span className="text-cosmic-amber">{user.totalXp} XP</span>
                <div className="flex-grow h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cosmic-teal to-cosmic-accent rounded-full transition-all duration-700" style={{ width: `${xpProgress}%` }} />
                </div>
              </div>
              {/* Plan Badge */}
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${planColors[user.plan] || planColors.community}`}>
                  {planLabels[user.plan] || 'Community'}
                </span>
                {isAdmin && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cosmic-rose/20 text-cosmic-rose">
                    Admin
                  </span>
                )}
                {user.role === 'gov_official' && !isAdmin && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cosmic-teal/20 text-cosmic-teal">
                    Gov Official
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-grow px-3 overflow-y-auto scrollbar-thin" style={{ scrollbarGutter: 'stable' }}>
          {navSections.map((section, si) => (
            <div key={si} className={si > 0 ? 'mt-4' : ''}>
              {section.label && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-cosmic-muted/50">
                  {section.label}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <Link key={item.href} href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${active ? 'bg-cosmic-accent/10 text-cosmic-accent' : 'text-cosmic-muted hover:text-white hover:bg-white/5'}`}>
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          {/* Gov Portal & Admin Links */}
          {(isAdmin || isGovOfficial) && (
            <div className="mt-4">
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-cosmic-muted/50">Administration</div>
              {isGovOfficial && (
                <Link href="/dashboard/gov-portal"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${pathname.startsWith('/dashboard/gov-portal') ? 'bg-cosmic-teal/10 text-cosmic-teal' : 'text-cosmic-muted hover:text-cosmic-teal hover:bg-cosmic-teal/5'}`}>
                  <Landmark className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Gov Portal</span>
                </Link>
              )}
              {isAdmin && (
                <Link href="/dashboard/admin"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${pathname.startsWith('/dashboard/admin') ? 'bg-cosmic-rose/10 text-cosmic-rose' : 'text-cosmic-muted hover:text-cosmic-rose hover:bg-cosmic-rose/5'}`}>
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Admin Portal</span>
                </Link>
              )}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Button variant="ghost" className="w-full justify-start text-cosmic-muted hover:text-cosmic-rose" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Log Out
          </Button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-grow flex flex-col min-h-screen min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 h-14 bg-[#04050b]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button className="lg:hidden text-white p-1" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            {/* Mobile logo */}
            <Link href="/" className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cosmic-teal to-cosmic-violet flex items-center justify-center">
                <Rocket className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-heading font-bold">CosmoGov</span>
            </Link>
            {/* Breadcrumb / Page title */}
            <div className="block lg:hidden">
              <span className="text-sm text-cosmic-muted truncate">
                {navSections.flatMap(s => s.items).find(i => pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href)))?.label || 'Dashboard'}
              </span>
            </div>
            <div className="hidden lg:block">
              <span className="text-sm text-cosmic-muted">
                {navSections.flatMap(s => s.items).find(i => pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href)))?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Bell className="w-4 h-4 text-cosmic-muted" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-cosmic-rose text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm glass-card p-0 rounded-xl overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
                  <div className="flex items-center justify-between p-3 border-b border-white/5">
                    <span className="text-sm font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-cosmic-accent hover:text-cosmic-teal transition-colors">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-cosmic-muted">No notifications yet</div>
                    ) : notifications.map(n => (
                      <div key={n.id} className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${!n.read ? 'bg-cosmic-accent/5' : ''}`}>
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-cosmic-muted mt-0.5">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-cosmic-accent/20 flex items-center justify-center text-xs font-bold text-cosmic-accent">
                  {(user?.name || 'U')[0].toUpperCase()}
                </div>
                <ChevronDown className="w-3 h-3 text-cosmic-muted" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] glass-card p-0 rounded-xl overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
                  <div className="p-3 border-b border-white/5">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-cosmic-muted">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link href="/dashboard/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-cosmic-muted hover:text-white hover:bg-white/5 transition-colors">
                      <User className="w-4 h-4" /> Profile & Settings
                    </Link>
                    <Link href="/dashboard/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-cosmic-muted hover:text-white hover:bg-white/5 transition-colors">
                      <CreditCard className="w-4 h-4" /> Billing
                    </Link>
                    {isAdmin && (
                      <Link href="/dashboard/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-cosmic-rose hover:text-cosmic-rose hover:bg-cosmic-rose/5 transition-colors">
                        <Shield className="w-4 h-4" /> Admin Portal
                      </Link>
                    )}
                    {isGovOfficial && (
                      <Link href="/dashboard/gov-portal" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-cosmic-teal hover:text-cosmic-teal hover:bg-cosmic-teal/5 transition-colors">
                        <Landmark className="w-4 h-4" /> Gov Portal
                      </Link>
                    )}
                    <Link href="/" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-cosmic-muted hover:text-white hover:bg-white/5 transition-colors">
                      <Home className="w-4 h-4" /> Back to Home
                    </Link>
                    <button onClick={() => { setUserMenuOpen(false); handleLogout(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-cosmic-rose hover:bg-cosmic-rose/5 transition-colors w-full">
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Nav Overlay */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-[#04050b]/95 backdrop-blur-xl pt-14 overflow-y-auto">
            <nav className="p-4 pb-8">
              <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-cosmic-teal hover:bg-cosmic-teal/5">
                <Home className="w-5 h-5" /> Back to Home
              </Link>
              {navSections.map((section, si) => (
                <div key={si} className={si > 0 ? 'mt-4' : 'mt-2'}>
                  {section.label && (
                    <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-cosmic-muted/50">
                      {section.label}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {section.items.map(item => {
                      const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${active ? 'bg-cosmic-accent/10 text-cosmic-accent' : 'text-cosmic-muted hover:text-white'}`}>
                          <item.icon className="w-5 h-5 flex-shrink-0" /> <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              {(isAdmin || isGovOfficial) && (
                <div className="mt-4">
                  <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-cosmic-muted/50">Administration</div>
                  {isGovOfficial && (
                    <Link href="/dashboard/gov-portal" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-cosmic-teal">
                      <Landmark className="w-5 h-5 flex-shrink-0" /> <span className="truncate">Gov Portal</span>
                    </Link>
                  )}
                  {isAdmin && (
                    <Link href="/dashboard/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-cosmic-rose">
                      <Shield className="w-5 h-5 flex-shrink-0" /> <span className="truncate">Admin Portal</span>
                    </Link>
                  )}
                </div>
              )}
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-cosmic-rose w-full mt-4">
                <LogOut className="w-5 h-5 flex-shrink-0" /> Log Out
              </button>
            </nav>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-grow p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <PWAInstallPrompt />
    </div>
  );
}
