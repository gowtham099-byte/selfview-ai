import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/AppShell";
import { getAdminOverview } from "@/lib/admin.functions";
import { labelFor, SECTORS } from "@/lib/taxonomy";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin overview · Panelly" },
      { name: "description", content: "Private member and interview performance overview." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const fetchOverview = useServerFn(getAdminOverview);
  const overviewQuery = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchOverview({}),
  });

  if (overviewQuery.isLoading) {
    return (
      <AppShell title="Admin overview" subtitle="Member activity and interview performance.">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </AppShell>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <AppShell title="Admin access required" subtitle="This area is restricted to administrators.">
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            Your account cannot access the admin overview.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const { stats, members, recent_sessions: recentSessions } = overviewQuery.data;

  return (
    <AppShell title="Admin overview" subtitle="Member activity and interview performance.">
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Members" value={stats.members} />
          <StatCard label="Interviews" value={stats.interviews} />
          <StatCard label="Completed rounds" value={stats.completed_interviews} />
          <StatCard label="Practice attempts" value={stats.practice_attempts} />
        </div>

        <Card className="shadow-paper">
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-y border-border bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Member</th>
                  <th className="px-6 py-3 font-medium">Target</th>
                  <th className="px-6 py-3 font-medium">Interviews</th>
                  <th className="px-6 py-3 font-medium">Practice</th>
                  <th className="px-6 py-3 font-medium">Average</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-4">
                      <p className="font-medium">{member.full_name ?? "Unnamed member"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{member.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p>{member.target_role ?? "Not set"}</p>
                      {member.target_sector && (
                        <Badge variant="secondary">{labelFor(SECTORS, member.target_sector)}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {member.completed_interviews}/{member.interview_count} completed
                    </td>
                    <td className="px-6 py-4">{member.practice_count}</td>
                    <td className="px-6 py-4 font-medium">
                      {member.average_score === null ? "—" : `${member.average_score}/100`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="shadow-paper">
          <CardHeader>
            <CardTitle>Recent interview results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-wrap items-center gap-4 border-b border-border pb-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{session.member_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {session.role} · {labelFor(SECTORS, session.sector)} ·{" "}
                    {new Date(session.updated_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant={session.status === "completed" ? "default" : "outline"}>
                  {session.status === "completed"
                    ? `Score ${session.overall_score ?? 0}`
                    : "Active"}
                </Badge>
              </div>
            ))}
            {recentSessions.length === 0 && (
              <p className="text-sm text-muted-foreground">No interviews recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="shadow-paper">
      <CardContent className="p-5">
        <p className="command-label text-muted-foreground">{label}</p>
        <p className="mt-2 font-display text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
