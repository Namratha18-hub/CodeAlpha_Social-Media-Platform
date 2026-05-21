import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Home, Compass, Bell, User as UserIcon, Settings, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => setMobileOpen(false), [pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const navItems = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/explore", label: "Explore", icon: Compass },
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: profile ? `/u/${profile.username}` : "/home", label: "Profile", icon: UserIcon },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 glass border-b">
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/home" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-brand" />
            <span className="font-display font-bold">Pulse</span>
          </Link>
          <button onClick={() => setMobileOpen((o) => !o)} className="p-2 rounded-lg hover:bg-secondary">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        {mobileOpen && (
          <nav className="border-t bg-card p-2 space-y-1">
            {navItems.map((it) => (
              <Link key={it.label} to={it.to} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary">
                <it.icon className="h-5 w-5" /> {it.label}
              </Link>
            ))}
            <button onClick={() => signOut()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary text-left">
              <LogOut className="h-5 w-5" /> Sign out
            </button>
          </nav>
        )}
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex sticky top-0 h-screen w-64 shrink-0 flex-col border-r bg-sidebar px-4 py-6">
        <Link to="/home" className="mb-8 flex items-center gap-2 px-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-brand shadow-glow" />
          <span className="font-display text-xl font-bold">Pulse</span>
        </Link>
        <nav className="flex-1 space-y-1">
          {navItems.map((it) => {
            const active = pathname === it.to || (it.to !== "/home" && pathname.startsWith(it.to));
            return (
              <Link
                key={it.label}
                to={it.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-gradient-brand text-primary-foreground shadow-soft" : "hover:bg-secondary"
                }`}
              >
                <it.icon className="h-5 w-5" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 border-t pt-4">
          {profile && (
            <Link to={`/u/${profile.username}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-secondary">
              <Avatar url={profile.avatar_url} name={profile.display_name || profile.username} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{profile.display_name || profile.username}</div>
                <div className="truncate text-xs text-muted-foreground">@{profile.username}</div>
              </div>
            </Link>
          )}
          <button onClick={() => signOut()} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) return <img src={url} alt={name} className="h-9 w-9 rounded-full object-cover" />;
  return (
    <div className="h-9 w-9 rounded-full bg-gradient-brand text-primary-foreground grid place-items-center text-sm font-bold">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
