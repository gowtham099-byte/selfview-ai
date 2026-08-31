import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, AudioLines, ListChecks, LineChart, Sparkles, ShieldCheck } from "lucide-react";

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
    <div className="min-h-screen p-0 lg:p-5">
      <div className="paper-grid min-h-screen overflow-hidden border-border bg-background/85 lg:min-h-[calc(100vh-2.5rem)] lg:rounded-xl lg:border lg:shadow-lift">
        <header className="mx-auto flex h-20 w-full max-w-7xl items-center border-b border-border px-6 lg:px-10">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-brass">
              <Sparkles className="size-4" />
            </span>
            <span className="font-display text-xl font-bold">Panelly</span>
          </Link>
          <span className="command-label ml-8 hidden md:block">AI interview command</span>
          <Button asChild variant="outline" size="sm" className="ml-auto">
            <Link to="/auth">Sign in</Link>
          </Button>
        </header>

        <main className="mx-auto w-full max-w-7xl px-6 pb-16 lg:px-10">
          <section className="grid min-h-[68vh] border-x border-b border-border lg:grid-cols-[1.35fr_0.65fr]">
            <div className="flex flex-col justify-between p-7 sm:p-12 lg:p-16">
              <div>
                <span className="command-label text-primary">Adaptive interview intelligence</span>
                <h1 className="mt-6 max-w-4xl text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
                  Enter every interview with a stronger answer.
                </h1>
                <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  Panelly runs rigorous AI interview simulations, follows your reasoning in real time, and turns every response into a practical improvement plan.
                </p>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 px-7">
                  <Link to="/auth">Start simulation <ArrowRight className="size-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-7">
                  <Link to="/auth">Explore question bank</Link>
                </Button>
              </div>
            </div>

            <div className="relative flex min-h-[430px] flex-col border-t border-border bg-card/55 p-6 backdrop-blur-xl lg:border-t-0 lg:border-l">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="command-label">Simulation monitor</span>
                <span className="flex items-center gap-2 text-xs text-primary"><span className="size-2 animate-pulse rounded-full bg-primary" /> Live</span>
              </div>
              <div className="flex flex-1 items-center justify-center py-10">
                <div className="relative flex size-44 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
                  <div className="absolute inset-5 animate-pulse rounded-full border border-primary/30" />
                  <div className="flex size-24 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-brass"><AudioLines className="size-9" /></div>
                </div>
              </div>
              <blockquote className="border-l-2 border-primary pl-5 font-display text-xl leading-relaxed">
                “Tell me about a decision you made with incomplete information.”
              </blockquote>
              <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border">
                {[['Clarity','82'],['Structure','76'],['Pace','Optimal']].map(([label,value]) => <div key={label} className="bg-background/90 p-3"><p className="command-label">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>)}
              </div>
            </div>
          </section>

          <section className="grid border-x border-b border-border md:grid-cols-3">
            {features.map((feature, index) => (
              <div key={feature.title} className="border-b border-border p-7 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0 lg:p-9">
                <div className="mb-10 flex items-center justify-between"><span className="command-label">0{index + 1} / capability</span><feature.icon className="size-5 text-primary" /></div>
                <h2 className="text-2xl">{feature.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
              </div>
            ))}
          </section>

          <section className="mt-6 flex flex-col justify-between gap-6 border border-border bg-card/50 p-7 backdrop-blur-md md:flex-row md:items-center lg:p-10">
            <div className="flex items-start gap-4"><ShieldCheck className="mt-1 size-5 text-primary" /><div><p className="command-label">Private practice environment</p><h2 className="mt-2 text-2xl">Train, review, repeat—without the pressure.</h2></div></div>
            <Button asChild variant="outline"><Link to="/auth">Open your workspace <ArrowRight /></Link></Button>
          </section>
        </main>
      </div>
    </div>
  );
}

