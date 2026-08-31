import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getProfile } from "@/lib/interview.functions";
import { LayoutDashboard, ListChecks, UserRound, LogOut, Sparkles, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/dashboard", label: "Interviews", icon: LayoutDashboard },
  { to: "/practice", label: "Practice", icon: ListChecks },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

function initialsOf(name?: string | null, fallback = "PA") {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || fallback;
}

export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const fetchProfile = useServerFn(getProfile);
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile({}) });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen p-0 lg:p-5">
      <div className="glass-3d flex min-h-screen overflow-hidden border-border lg:min-h-[calc(100vh-2.5rem)] lg:rounded-xl lg:border">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-6 text-sidebar-foreground lg:flex">
          <Link to="/dashboard" className="mb-12 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shadow-brass">
              <Sparkles className="size-4" />
            </span>
            <span className="font-display text-xl font-bold">Panelly</span>
          </Link>

          <p className="command-label mb-3">Workspace</p>
          <nav className="flex-1 space-y-1">
            {links.map((link) => {
              const active = pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-sidebar-accent text-sidebar-foreground shadow-paper"
                      : "text-sidebar-foreground/55 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  <link.icon className={cn("size-4", active && "text-sidebar-primary")} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mb-5 rounded-md border border-sidebar-primary/25 bg-sidebar-primary/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-sidebar-primary">
              <Activity className="size-4" />
              <span className="command-label text-sidebar-primary">AI coach online</span>
            </div>
            <p className="text-xs leading-relaxed text-sidebar-foreground/55">Adaptive questions and feedback are ready for your next round.</p>
          </div>
          <div className="mt-auto space-y-4 border-t border-sidebar-border pt-6">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-full border border-sidebar-primary/30 bg-sidebar-accent text-sm font-bold">
                {initialsOf(profileQuery.data?.full_name)}
              </div>
              <div className="min-w-0 text-sm">
                <p className="truncate font-medium">
                  {profileQuery.data?.full_name ?? "Your profile"}
                </p>
                <p className="truncate opacity-60">
                  {profileQuery.data?.target_role ?? "Set a target role"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="justify-start px-0 text-sidebar-foreground/60 hover:bg-transparent hover:text-sidebar-foreground"
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="glass-3d fixed inset-x-0 top-0 z-30 flex items-center gap-4 border-b border-sidebar-border px-4 py-3 text-sidebar-foreground lg:hidden">
          <Link to="/dashboard" className="font-display font-bold text-sidebar-primary">
            Panelly
          </Link>
          <nav className="ml-auto flex items-center gap-3">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                aria-label={link.label}
                className={cn(
                  "rounded-full p-2 transition-colors",
                  pathname.startsWith(link.to)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/60",
                )}
              >
                <link.icon className="size-4" />
              </Link>
            ))}
            <Button onClick={handleSignOut} aria-label="Sign out" variant="ghost" size="icon" className="opacity-60">
              <LogOut className="size-4" />
            </Button>
          </nav>
        </div>

        <main className="min-w-0 flex-1 overflow-y-auto bg-background/75 pt-16 lg:pt-0">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-6 py-7 lg:px-10">
            <div>
              <p className="command-label mb-2">Interview intelligence / workspace</p>
              <h1 className="font-display text-3xl font-bold lg:text-4xl">{title}</h1>
              {subtitle && <p className="mt-2 max-w-xl text-muted-foreground">{subtitle}</p>}
            </div>
            {action}
          </header>
          <div className="px-6 pb-14 lg:px-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
