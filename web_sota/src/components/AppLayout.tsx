import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  BookOpen,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Cpu,
  Inbox,
  LayoutDashboard,
  ListVideo,
  MessagesSquare,
  ScrollText,
  Settings,
  Tv,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/channels", label: "Channels", icon: Tv },
  { to: "/playlists", label: "Playlists", icon: ListVideo },
  { to: "/guide", label: "EPG Guide", icon: BookOpen },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/tools", label: "Tools", icon: Wrench },
  { to: "/chat", label: "Chat", icon: MessagesSquare },
  { to: "/skills", label: "Skills", icon: Boxes },
  { to: "/api-docs", label: "API Docs", icon: ScrollText },
  { to: "/logs", label: "Logs", icon: ScrollText },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help", icon: CircleHelp },
];

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("glass rounded-xl p-4", className)}>{children}</div>;
}

export function Stat({ label, value, testid }: { label: string; value: string; testid: string }) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-amber-400" data-testid={testid}>
        {value}
      </div>
    </Card>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {sub ? <p className="text-sm text-muted-foreground">{sub}</p> : null}
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <Card className="text-center text-sm text-muted-foreground">{text}</Card>;
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("nav_collapsed") === "1");
  const [health, setHealth] = useState<"ok" | "down" | "probing">("probing");
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((r) => {
        if (!cancelled) setHealth(r.ok ? "ok" : "down");
      })
      .catch(() => {
        if (!cancelled) setHealth("down");
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const toggle = () => {
    setCollapsed((c) => {
      localStorage.setItem("nav_collapsed", c ? "0" : "1");
      return !c;
    });
  };

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "sticky top-0 flex h-screen flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl transition-all",
          collapsed ? "w-16" : "w-56",
        )}
      >
        <div className="flex items-center justify-between p-3">
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-2 font-bold">
              <Cpu className="h-5 w-5 text-amber-400" />
              <span className="text-sm">iptv-org-mcp</span>
            </Link>
          )}
          <button
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            data-testid="nav-collapse"
            className="rounded-md p-1.5 hover:bg-secondary"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {NAV.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                data-testid={`nav-${item.to.slice(1)}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-secondary",
                  active && "bg-secondary text-amber-400",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2 border-t border-border/60 p-3 text-xs">
          <span
            data-testid="backend-health"
            className={cn(
              "inline-block h-2.5 w-2.5 rounded-full",
              health === "ok" && "bg-green-500",
              health === "down" && "bg-red-500",
              health === "probing" && "animate-pulse bg-amber-400",
            )}
          />
          {!collapsed && <span className="text-muted-foreground">:11242 {health}</span>}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-2.5 backdrop-blur-xl">
          <div className="text-sm font-medium">
            {NAV.find((n) => n.to === location.pathname)?.label ?? "iptv-org-mcp"}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/help" data-testid="topbar-help" className="rounded-md px-2 py-1 hover:bg-secondary">
              Help
            </Link>
            <Link to="/logs" data-testid="topbar-logs" className="rounded-md px-2 py-1 hover:bg-secondary">
              Logs
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
