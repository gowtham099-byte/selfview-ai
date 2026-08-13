import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getProfile } from "@/lib/interview.functions";
import { LayoutDashboard, ListChecks, UserRound, LogOut } from "lucide-react";
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
    <div className="min-h-screen p-0 lg:p-6">
      <div className="flex min-h-screen overflow-hidden border-border bg-card lg:min-h-[calc(100vh-3rem)] lg:rounded-3xl lg:border lg:shadow-lift">
        <aside className="hidden w-72 shrink-0 flex-col bg-sidebar p-8 text-sidebar-foreground lg:flex">
          <Link to="/dashboard" className="mb-12 block">
            <span className="font-display text-2xl font-bold tracking-tight text-sidebar-primary uppercase">
              Panelly
            </span>
          </Link>

          <nav className="flex-1 space-y-6">
            {links.map((link) => {
              const active = pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-4 pb-2 font-display text-lg font-medium transition-colors",
                    active
                      ? "border-b-2 border-sidebar-primary text-sidebar-foreground"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      active
                        ? "bg-sidebar-primary"
                        : "border border-sidebar-foreground/30 bg-transparent",
                    )}
                  />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-4 border-t border-sidebar-border pt-8">
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
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="fixed inset-x-0 top-0 z-30 flex items-center gap-4 bg-sidebar px-4 py-3 text-sidebar-foreground lg:hidden">
          <Link to="/dashboard" className="font-display font-bold text-sidebar-primary uppercase">
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
            <button onClick={handleSignOut} aria-label="Sign out" className="p-2 opacity-60">
              <LogOut className="size-4" />
            </button>
          </nav>
        </div>

        <main className="min-w-0 flex-1 overflow-y-auto bg-background pt-16 lg:pt-0">
          <header className="flex flex-wrap items-end justify-between gap-4 px-6 py-8 lg:px-10">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">{title}</h1>
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
