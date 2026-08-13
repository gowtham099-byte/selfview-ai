import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { listQuestions } from "@/lib/questions.functions";
import { scoreAnswer } from "@/lib/interview.functions";
import { DIFFICULTIES, SECTORS, labelFor } from "@/lib/taxonomy";
import { Lightbulb, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/practice")({
  head: () => ({
    meta: [
      { title: "Practice question bank · Panelly" },
      {
        name: "description",
        content:
          "Practise curated interview questions across IT, government, banking, teaching and healthcare, and get instant AI scoring on every answer.",
      },
      { property: "og:title", content: "Practice question bank · Panelly" },
      {
        property: "og:description",
        content: "Curated interview questions with instant AI scoring on every answer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Practice,
});

function Practice() {
  const fetchQuestions = useServerFn(listQuestions);
  const score = useServerFn(scoreAnswer);

  const [sector, setSector] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");

  const questionsQuery = useQuery({
    queryKey: ["questions", sector, difficulty],
    queryFn: () => fetchQuestions({ data: { sector, difficulty } }),
  });

  const scoreMutation = useMutation({
    mutationFn: (questionId: string) =>
      score({ data: { question_id: questionId, answer: answer.trim() } }),
    onError: (error: Error) => toast.error(error.message),
  });

  const questions = questionsQuery.data ?? [];

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="text-4xl">Question bank</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Answer in your own words and get scored on structure, substance and delivery.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sectors</SelectItem>
              {SECTORS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any level</SelectItem>
              {DIFFICULTIES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-8 space-y-4">
          {questionsQuery.isLoading &&
            [0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-24 w-full" />)}

          {!questionsQuery.isLoading && questions.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground">
                No questions match these filters yet.
              </CardContent>
            </Card>
          )}

          {questions.map((question) => {
            const open = activeId === question.id;
            return (
              <Card key={question.id} className="shadow-paper">
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{labelFor(SECTORS, question.sector)}</Badge>
                    <Badge variant="outline">{labelFor(DIFFICULTIES, question.difficulty)}</Badge>
                  </div>
                  <CardTitle className="font-sans text-lg leading-snug font-medium">
                    {question.prompt}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {question.tip && (
                    <p className="flex gap-2 text-sm text-muted-foreground">
                      <Lightbulb className="mt-0.5 size-4 shrink-0" />
                      {question.tip}
                    </p>
                  )}

                  {!open ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setActiveId(question.id);
                        setAnswer("");
                        scoreMutation.reset();
                      }}
                    >
                      Answer this
                    </Button>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <Textarea
                        rows={5}
                        maxLength={6000}
                        autoFocus
                        placeholder="Type your answer…"
                        value={answer}
                        onChange={(event) => setAnswer(event.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={scoreMutation.isPending || answer.trim().length < 10}
                          onClick={() => scoreMutation.mutate(question.id)}
                        >
                          <Sparkles className="size-4" />
                          {scoreMutation.isPending ? "Scoring…" : "Get feedback"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setActiveId(null)}>
                          Close
                        </Button>
                      </div>

                      {scoreMutation.data && (
                        <div className="rounded-lg border border-border bg-secondary/60 p-4">
                          <p className="font-display text-2xl">
                            {scoreMutation.data.score}
                            <span className="text-base text-muted-foreground">/100</span>
                          </p>
                          <div className="prose prose-sm mt-2 max-w-none">
                            <ReactMarkdown>{scoreMutation.data.feedback}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
