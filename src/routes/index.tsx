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
    <div className="paper-grid min-h-screen">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="size-4" />
          </span>
          <span className="font-display text-xl">Panelly</span>
        </Link>
        <Button asChild variant="ghost" size="sm" className="ml-auto">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4">
        <section className="py-20 sm:py-28">
          <p className="text-sm tracking-[0.2em] text-muted-foreground uppercase">
            Interview preparation
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] sm:text-7xl">
            Sit the interview before the interview.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Panelly runs realistic AI mock interviews for any role or exam, follows up on your
            answers, and tells you exactly where you lost marks.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Start a mock interview</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Browse the question bank</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 pb-24 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-card p-6 shadow-paper"
            >
              <feature.icon className="size-6 text-accent-foreground" />
              <h2 className="mt-4 text-2xl">{feature.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
