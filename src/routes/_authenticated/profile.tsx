import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getProfile, listAttempts, saveProfile } from "@/lib/interview.functions";
import { EXPERIENCE_LEVELS, SECTORS } from "@/lib/taxonomy";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile · Panelly" },
      {
        name: "description",
        content:
          "Tell Panelly your target role, sector and experience so mock interviews and feedback are tailored to you.",
      },
      { property: "og:title", content: "Your profile · Panelly" },
      {
        property: "og:description",
        content: "Set your target role and experience so interviews are tailored to you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const queryClient = useQueryClient();
  const fetchProfile = useServerFn(getProfile);
  const fetchAttempts = useServerFn(listAttempts);
  const save = useServerFn(saveProfile);

  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile({}) });
  const attemptsQuery = useQuery({ queryKey: ["attempts"], queryFn: () => fetchAttempts({}) });

  const [fullName, setFullName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetSector, setTargetSector] = useState("general");
  const [experience, setExperience] = useState("fresher");
  const [goal, setGoal] = useState("");

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setTargetRole(profile.target_role ?? "");
    setTargetSector(profile.target_sector ?? "general");
    setExperience(profile.experience_level ?? "fresher");
    setGoal(profile.goal ?? "");
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          full_name: fullName.trim().slice(0, 80) || null,
          target_role: targetRole.trim().slice(0, 80) || null,
          target_sector: targetSector,
          experience_level: experience,
          goal: goal.trim().slice(0, 500) || null,
        },
      }),
    onSuccess: () => {
      toast.success("Profile saved");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const attempts = attemptsQuery.data ?? [];

  return (
    <AppShell title="Your profile" subtitle="The panel uses this to tailor every question.">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_320px]">

        <Card className="shadow-paper">
          <CardHeader>
            <CardTitle className="text-2xl">Your profile</CardTitle>
            <CardDescription>The panel uses this to tailor every question.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                maxLength={80}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">Target role or exam</Label>
              <Input
                id="target"
                maxLength={80}
                placeholder="e.g. SBI PO, Data Analyst"
                value={targetRole}
                onChange={(event) => setTargetRole(event.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Sector</Label>
                <Select value={targetSector} onValueChange={setTargetSector}>
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
              <div className="space-y-2">
                <Label>Experience</Label>
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">What are you working on?</Label>
              <Textarea
                id="goal"
                rows={4}
                maxLength={500}
                placeholder="e.g. I freeze on 'tell me about yourself' and rambling answers."
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
              />
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : "Save profile"}
            </Button>
          </CardContent>
        </Card>

        <Card className="h-fit shadow-paper">
          <CardHeader>
            <CardTitle className="text-2xl">Recent practice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {attempts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Scored answers from the question bank appear here.
              </p>
            )}
            {attempts.map((attempt) => (
              <div key={attempt.id} className="border-b border-border pb-3 last:border-0">
                <p className="line-clamp-2 text-sm">
                  {(attempt.questions as { prompt?: string } | null)?.prompt ?? "Practice answer"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {attempt.score}/100 · {new Date(attempt.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );

}
