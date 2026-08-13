import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, MessagesSquare, ListChecks, LineChart } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panelly · AI mock interviews and practice questions" },
      {
        name: "description",
        content:
          "Practise for any interview with an AI panel that asks real follow-ups, scores your answers and tracks your progress across IT, government, banking and more.",
      },
      { property: "og:title", content: "Panelly · AI mock interviews and practice questions" },
      {
        property: "og:description",
        content:
          "An AI panel that asks real follow-ups, scores your answers and tracks your interview progress.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: MessagesSquare,
    title: "Live mock interviews",
    body: "A panel that reads your answer, probes the weak spot and moves on like a real interviewer would.",
  },
  {
    icon: ListChecks,
    title: "Question bank",
    body: "Curated questions across IT, government, civil services, banking, teaching and healthcare.",
  },
  {
    icon: LineChart,
    title: "Scores and feedback",
    body: "Every round ends with a score out of 100 and specific notes on what to fix next time.",
  },
];

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen p-0 lg:p-6">
      <div className="paper-grid min-h-screen overflow-hidden border-border bg-background lg:min-h-[calc(100vh-3rem)] lg:rounded-3xl lg:border lg:shadow-lift">
        <header className="mx-auto flex h-20 w-full max-w-6xl items-center px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-brass">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-display text-2xl font-bold tracking-tight uppercase">
              Panelly
            </span>
          </Link>
          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <Link to="/auth">Sign in</Link>
          </Button>
        </header>

        <main className="mx-auto w-full max-w-6xl px-6 pb-16">
          <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 sm:p-14">
            <div className="relative z-10 max-w-2xl">
              <span className="font-display text-xs font-bold tracking-[0.2em] text-ink uppercase">
                Interview preparation
              </span>
              <h1 className="mt-5 text-5xl leading-[1.02] sm:text-6xl">
                Sit the interview <span className="text-ink">before</span> the interview.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                Panelly runs realistic AI mock interviews for any role or exam, follows up on your
                answers, and tells you exactly where you lost marks.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Button asChild size="lg" className="rounded-xl px-8 py-6 font-semibold">
                  <Link to="/auth">Start a mock interview</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-2 px-8 py-6 font-semibold"
                >
                  <Link to="/auth">Browse the question bank</Link>
                </Button>
              </div>
            </div>

            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -bottom-24 size-80 rounded-full bg-accent/15 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute top-12 right-12 hidden size-64 rotate-12 items-center justify-center rounded-2xl border border-ink/20 p-8 lg:flex"
            >
              <div className="flex size-full flex-col justify-end rounded-xl border border-ink/20 p-4">
                <div className="mb-2 h-1 w-1/2 bg-ink/20" />
                <div className="h-1 w-full bg-ink/20" />
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={
                  index === 0
                    ? "flex flex-col justify-between rounded-[2rem] bg-ink p-8 text-ink-foreground"
                    : index === 2
                      ? "flex flex-col justify-between rounded-[2rem] bg-accent p-8 text-accent-foreground"
                      : "flex flex-col justify-between rounded-[2rem] border border-border bg-card p-8 shadow-paper"
                }
              >
                <span className="flex size-12 items-center justify-center rounded-full border border-current/20">
                  <feature.icon className="size-5" />
                </span>
                <div className="mt-10">
                  <h2 className="text-2xl">{feature.title}</h2>
                  <p className="mt-2 text-sm opacity-80">{feature.body}</p>
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}

