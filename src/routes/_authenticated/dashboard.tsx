import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createSession, deleteSession, listSessions, getProfile } from "@/lib/interview.functions";
import { DIFFICULTIES, INTERVIEW_TYPES, SECTORS, labelFor } from "@/lib/taxonomy";
import { Mic, Trash2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your mock interviews · Panelly" },
      {
        name: "description",
        content:
          "Start a new AI mock interview for any role or exam and revisit past sessions with scores and feedback.",
      },
      { property: "og:title", content: "Your mock interviews · Panelly" },
      {
        property: "og:description",
        content: "Start an AI mock interview and revisit past sessions with scores and feedback.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchSessions = useServerFn(listSessions);
  const fetchProfile = useServerFn(getProfile);
  const create = useServerFn(createSession);
  const remove = useServerFn(deleteSession);

  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile({}) });
  const sessionsQuery = useQuery({ queryKey: ["sessions"], queryFn: () => fetchSessions({}) });

  const [role, setRole] = useState("");
  const [sector, setSector] = useState("general");
  const [type, setType] = useState("mixed");
  const [difficulty, setDifficulty] = useState("medium");

  const createMutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          role: role.trim() || profileQuery.data?.target_role || "General role",
          sector,
          interview_type: type,
          difficulty,
        },
      }),
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      navigate({ to: "/interview/$sessionId", params: { sessionId: row.id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const sessions = sessionsQuery.data ?? [];

  return (
    <AppShell
      title={
        profileQuery.data?.full_name
          ? `Ready when you are, ${profileQuery.data.full_name.split(" ")[0]}`
          : "Ready when you are"
      }
      subtitle="Pick a role and round type. The panel adapts its questions, probes your answers and scores you at the end."
    >
      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">

          <Card className="h-fit shadow-paper">
            <CardHeader>
              <CardTitle className="text-2xl">New mock interview</CardTitle>
              <CardDescription>Set the board, then walk in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role or exam</Label>
                <Input
                  id="role"
                  maxLength={80}
                  placeholder={profileQuery.data?.target_role || "e.g. UPSC CSE, Backend Engineer"}
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Sector</Label>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Round</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVIEW_TYPES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Intensity</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
              >
                <Mic className="size-4" />
                {createMutation.isPending ? "Setting up…" : "Start interview"}
              </Button>
            </CardContent>
          </Card>

          <section>
            <h2 className="text-2xl">Past sessions</h2>
            <div className="mt-4 space-y-3">
              {sessionsQuery.isLoading &&
                [0, 1, 2].map((index) => <Skeleton key={index} className="h-24 w-full" />)}

              {!sessionsQuery.isLoading && sessions.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-10 text-center text-muted-foreground">
                    No interviews yet. Your first session will show up here with its score.
                  </CardContent>
                </Card>
              )}

              {sessions.map((session) => (
                <Card key={session.id} className="shadow-paper transition-shadow hover:shadow-lift">
                  <CardContent className="flex flex-wrap items-center gap-4 py-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium">{session.role}</span>
                        <Badge variant="secondary">{labelFor(SECTORS, session.sector)}</Badge>
                        <Badge variant="outline">
                          {labelFor(INTERVIEW_TYPES, session.interview_type)}
                        </Badge>
                        {session.status === "completed" && (
                          <Badge className="bg-accent text-accent-foreground">
                            Score {session.overall_score ?? 0}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Updated {new Date(session.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to="/interview/$sessionId" params={{ sessionId: session.id }}>
                          Open <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete session"
                        onClick={() => deleteMutation.mutate(session.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
      </div>
    </AppShell>
  );

}
