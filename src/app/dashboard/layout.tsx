"use client";
import "../portal.css";
import VerifyEmailBanner from "@/components/VerifyEmailBanner";
import { planFor } from "@/lib/plans";
import "../rewards.css";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileSignature,
  FileText,
  Gamepad2,
  Sticker,
  ScrollText,
  Globe2,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Users,
  Vote,
  Wallet,
  X,
  BarChart3,
  Scale,
  ClipboardList,
  Dices,
  Gavel,
  Eye,
  Activity,
  Star,
} from "lucide-react";
import Brand, { BrandMark } from "@/components/Brand";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  WorkspaceProvider,
  type WorkspaceUser,
} from "@/components/WorkspaceContext";
import CommandMenu from "@/components/CommandMenu";
import StickerCelebration from "@/components/stickers/StickerCelebration";
interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
}
const mainLinks = [
  { label: "Mission studio", href: "/dashboard/missions", icon: Sparkles },
  { label: "My civic desk", href: "/dashboard", icon: LayoutDashboard },
  { label: "Sticker book", href: "/dashboard/stickers", icon: Sticker },
  { label: "Civic record", href: "/dashboard/record", icon: ScrollText },
  {
    label: "Explore participation",
    href: "/dashboard/participation",
    icon: Globe2,
  },
  { label: "Proposals & voting", href: "/dashboard/proposals", icon: Vote },
  { label: "My communities", href: "/dashboard/organizations", icon: Users },
  { label: "Community map", href: "/dashboard/cosmic-map", icon: Landmark },
  {
    label: "Accountability",
    href: "/dashboard/participation/accountability",
    icon: Eye,
  },
];
const toolGroups: { label: string; items: [string, string, LucideIcon][] }[] = [
  {
    label: "Participation tools",
    items: [
      ["Budgets", "/dashboard/participation/budget", Wallet],
      ["Legislation", "/dashboard/participation/legislation", Scale],
      ["Surveys & polls", "/dashboard/participation/surveys", ClipboardList],
      [
        "Citizen initiatives",
        "/dashboard/participation/initiatives",
        FileSignature,
      ],
      [
        "Binding proposals",
        "/dashboard/participation/binding-proposals",
        Gavel,
      ],
      ["Assemblies", "/dashboard/participation/assemblies", Users],
      ["Meetings", "/dashboard/participation/meetings", Calendar],
      ["Sortition", "/dashboard/participation/sortition", Dices],
    ],
  },
  {
    label: "Community & insights",
    items: [
      ["Decision log", "/dashboard/decisions", Target],
      ["Community discussions", "/dashboard/chat", MessageCircle],
      ["Assembly hall", "/dashboard/assembly-hall", Building2],
      ["Global explorer", "/dashboard/explore", Globe2],
      ["Governance pulse", "/dashboard/pulse", Activity],
      ["Analytics", "/dashboard/analytics", BarChart3],
    ],
  },
  {
    label: "Learn & grow",
    items: [
      ["AI agents", "/dashboard/ai-agents", Sparkles],
      ["Civic games", "/dashboard/games", Gamepad2],
      ["Leaderboards", "/dashboard/leaderboards", Trophy],
      ["My reputation", "/dashboard/reputation", Star],
    ],
  },
];
const allLabels = [
  ...mainLinks.map((item) => [item.href, item.label]),
  ...toolGroups.flatMap((group) =>
    group.items.map(([label, href]) => [href, label]),
  ),
  ["/dashboard/settings", "Settings"],
  ["/dashboard/search", "Search"],
  ["/dashboard/assistant", "AI assistant"],
  ["/dashboard/admin", "Administration"],
  ["/dashboard/gov-portal", "Government portal"],
].sort((a, b) => b[0].length - a[0].length);
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<WorkspaceUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMobileOpen(false);
  }
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/auth/login");
          return;
        }
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (alive) setUser(data);
      })
      .catch(() => {
        if (alive)
          setError("We couldn’t load your workspace. Please try again.");
      });
    return () => {
      alive = false;
    };
  }, [router]);
  useEffect(() => {
    if (!user) return;
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) =>
        setNotifications(Array.isArray(data) ? data.slice(0, 10) : []),
      )
      .catch(() => {});
  }, [user]);
  const logout = async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (res.ok) router.push("/");
    else setError("Sign out failed. Please try again.");
  };
  const activeHref = allLabels.find(
    ([href]) =>
      pathname === href ||
      (href !== "/dashboard" && pathname.startsWith(`${href}/`)),
  )?.[0];
  const pageTitle =
    allLabels.find(([href]) => href === activeHref)?.[1] || "Your workspace";
  const isAdmin = ["admin", "super_admin"].includes(user?.role || "");
  const isOfficial = isAdmin || user?.role === "gov_official";
  const unread = notifications.filter((item) => !item.read).length;
  const sideContent = (
    <>
      <div className="sidebar-brand">
        <Brand />
        <span className="beta-label">BETA</span>
      </div>
      <div className="workspace-label">
        <span className="workspace-symbol">
          <Globe2 size={19} />
        </span>
        <div>
          <strong>Your civic workspace</strong>
          <span>A place to make a difference</span>
        </div>
      </div>
      <Link href="/dashboard/missions" className="civic-button sidebar-create">
        <Plus size={16} />
        Start a mission
      </Link>
      <nav aria-label="Workspace navigation" className="workspace-nav">
        {isOfficial && (
          <div className="workspace-staff-group">
            <div className="nav-group-label">
              {isAdmin ? "RUNNING COSMOGOV" : "FOR OFFICIALS"}
            </div>
            {isAdmin && (
              <Link
                href="/dashboard/admin"
                aria-current={activeHref === "/dashboard/admin" ? "page" : undefined}
                className={`workspace-nav-link ${activeHref === "/dashboard/admin" ? "active" : ""}`}
              >
                <Shield size={17} strokeWidth={1.6} />
                <span>Administration</span>
              </Link>
            )}
            <Link
              href="/dashboard/gov-portal"
              aria-current={activeHref === "/dashboard/gov-portal" ? "page" : undefined}
              className={`workspace-nav-link ${activeHref === "/dashboard/gov-portal" ? "active" : ""}`}
            >
              <Landmark size={17} strokeWidth={1.6} />
              <span>Government portal</span>
            </Link>
          </div>
        )}
        <div className="nav-group-label">YOUR COMMUNITY</div>
        {mainLinks.map((item) => (
          <Link
            key={item.href}
            aria-current={activeHref === item.href ? "page" : undefined}
            className={
              activeHref === item.href
                ? "workspace-nav-link active"
                : "workspace-nav-link"
            }
            href={item.href}
          >
            <item.icon size={17} strokeWidth={1.6} />
            <span>{item.label}</span>
            {activeHref === item.href && <span className="nav-active-dot" />}
          </Link>
        ))}
        <div className="workspace-tool-groups">
          {toolGroups.map((group) => (
            <details
              key={group.label}
              open={
                group.items.some(([, href]) => activeHref === href) || undefined
              }
            >
              <summary>
                {group.label}
                <ChevronDown size={13} />
              </summary>
              <div>
                {group.items.map(([label, href, Icon]) => (
                  <Link
                    key={href}
                    href={href}
                    aria-current={activeHref === href ? "page" : undefined}
                    className={
                      activeHref === href
                        ? "workspace-nav-link active"
                        : "workspace-nav-link"
                    }
                  >
                    <Icon size={16} strokeWidth={1.6} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </div>
      </nav>
      <div className="sidebar-bottom">
        <Link href="/dashboard/assistant" className="assistant-link">
          <span>
            <Sparkles size={16} />A little clarity, with AI
          </span>
          <ArrowUpRight size={15} />
        </Link>
        <Link href="/docs" className="workspace-nav-link">
          <CircleHelp size={16} />
          Help & documentation
        </Link>
        <Link href="/dashboard/settings" className="sidebar-user">
          <span className="user-avatar">
            {(user?.name || "You").slice(0, 1).toUpperCase()}
          </span>
          <span>
            <strong>{user?.name || "Your account"}</strong>
            <small>{planFor(user?.plan).name} plan</small>
          </span>
          <Settings size={16} />
        </Link>
        <button className="sidebar-signout" onClick={logout}>
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </>
  );
  if (!user)
    return (
      <div className="workspace-loading">
        <BrandMark />
        <h1>{error || "Making room for your voice…"}</h1>
        {error ? (
          <button
            className="civic-button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        ) : (
          <div className="loading-line" />
        )}
      </div>
    );
  return (
    <WorkspaceProvider user={user}>
      <div className="workspace-shell">
        <aside className="workspace-sidebar">{sideContent}</aside>
        <div className="workspace-body">
          <header className="workspace-topbar">
            <div className="workspace-breadcrumb">
              <button
                className="mobile-workspace-toggle"
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={21} />
              </button>
              <span>Workspace</span>
              <ChevronRight size={12} />
              <strong>{pageTitle}</strong>
            </div>
            <div className="workspace-top-actions">
              <CommandMenu />
              <button
                className="notification-trigger"
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
                onClick={() => setNotifOpen(true)}
              >
                <Bell size={18} />
                {unread > 0 && <span />}
              </button>
              <Link
                href="/dashboard/settings"
                className="user-avatar small"
                aria-label="Your profile"
              >
                {(user.name || "Y")[0].toUpperCase()}
              </Link>
            </div>
          </header>
          <main className="workspace-main" id="main-content">
            <div className="workspace-content">
              {user && !user.emailVerifiedAt && <VerifyEmailBanner email={user.email} />}
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              {children}
            </div>
            <StickerCelebration />
          </main>
          <footer className="workspace-footer">
            <span>Small actions. Shared progress.</span>
            <Link href="/">Made possible by cosmogov.</Link>
          </footer>
        </div>
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogContent
            className="mobile-workspace-menu"
            showCloseButton={false}
          >
            <DialogTitle className="sr-only">Workspace navigation</DialogTitle>
            <DialogDescription className="sr-only">
              Choose a destination in your civic workspace.
            </DialogDescription>
            <button
              className="mobile-menu-close"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            >
              <X size={21} />
            </button>
            {sideContent}
          </DialogContent>
        </Dialog>
        <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
          <DialogContent className="notifications-dialog">
            <DialogTitle>Keep the conversation going.</DialogTitle>
            <DialogDescription>
              Your community updates and official responses.
            </DialogDescription>
            {unread > 0 && (
              <button
                className="text-link"
                onClick={async () => {
                  const res = await fetch("/api/notifications/read-all", {
                    method: "POST",
                  });
                  if (res.ok)
                    setNotifications((items) =>
                      items.map((item) => ({ ...item, read: true })),
                    );
                }}
              >
                <Check size={14} />
                Mark all as read
              </button>
            )}
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <Bell size={28} />
                  <h3>You’re all caught up.</h3>
                  <p>Community updates will appear here.</p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div key={item.id} className={item.read ? "" : "unread"}>
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                    {item.link?.startsWith("/dashboard") && (
                      <Link
                        href={item.link}
                        onClick={() => setNotifOpen(false)}
                        className="text-link"
                      >
                        View update <ArrowUpRight size={14} />
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </WorkspaceProvider>
  );
}
