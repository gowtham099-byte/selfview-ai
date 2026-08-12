import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { finishSession, getSession } from "@/lib/interview.functions";
import { INTERVIEW_TYPES, SECTORS, labelFor } from "@/lib/taxonomy";
import { Send, Flag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/interview/$sessionId")({
  head: () => ({
    meta: [
      { title: "Mock interview room · Panelly" },
      {
        name: "description",
        content:
          "Live AI mock interview room with follow-up questions, a full transcript and an end-of-round score.",
      },
      { property: "og:title", content: "Mock interview room · Panelly" },
      {
        property: "og:description",
        content: "Live AI mock interview with follow-ups, transcript and an end-of-round score.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InterviewRoom,
});

function toUIMessages(rows: { id: string; role: string; content: string }[]): UIMessage[] {
  return rows.map((row) => ({
    id: row.id,
    role: row.role === "user" ? "user" : "assistant",
    parts: [{ type: "text", text: row.content }],
  }));
}

function InterviewRoom() {
  const { sessionId } = useParams({ from: "/_authenticated/interview/$sessionId" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchSession = useServerFn(getSession);
  const finish = useServerFn(finishSession);

  const sessionQuery = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => fetchSession({ data: { id: sessionId } }),
  });

  if (sessionQuery.isLoading) {
    return (
      <div className="min-h-screen">
        <AppNav />
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <div className="min-h-screen">
        <AppNav />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-3xl">Interview not found</h1>
          <Button className="mt-6" onClick={() => navigate({ to: "/dashboard" })}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const { session, messages } = sessionQuery.data;

  return (
    <div className="min-h-screen">
      <AppNav />
      <Room
        key={sessionId}
        sessionId={sessionId}
        session={session}
        initialMessages={toUIMessages(messages)}
        onFinish={async () => {
          const result = await finish({ data: { id: sessionId } });
          queryClient.invalidateQueries({ queryKey: ["sessions"] });
          queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
          return result;
        }}
      />
    </div>
  );
}

type SessionRow = {
  role: string;
  sector: string;
  interview_type: string;
  status: string;
  overall_score: number | null;
  summary: string | null;
};

function Room({
  sessionId,
  session,
  initialMessages,
  onFinish,
}: {
  sessionId: string;
  session: SessionRow;
  initialMessages: UIMessage[];
  onFinish: () => Promise<{ score: number; summary: string }>;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    id: sessionId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { sessionId },
      fetch: async (url, options) => {
        const { data } = await supabase.auth.getSession();
        const headers = new Headers(options?.headers);
        if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
        return fetch(url, { ...options, headers });
      },
    }),
    onError: (error) => toast.error(error.message || "The interviewer went quiet. Try again."),
  });

  const busy = status === "submitted" || status === "streaming";

  const finishMutation = useMutation({
    mutationFn: onFinish,
    onSuccess: () => toast.success("Interview evaluated"),
    onError: (error: Error) => toast.error(error.message),
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, [sessionId]);

  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function submit() {
    const value = input.trim();
    if (!value || busy) return;
    setInput("");
    await sendMessage({ text: value });
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col px-4 py-8">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-2 text-3xl">{session.role}</h1>
        <Badge variant="secondary">{labelFor(SECTORS, session.sector)}</Badge>
        <Badge variant="outline">{labelFor(INTERVIEW_TYPES, session.interview_type)}</Badge>
      </div>

      <div className="mt-6 space-y-4">
        {messages.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              Say hello, or ask the panel to begin. They&apos;ll take it from there.
            </CardContent>
          </Card>
        )}

        {messages.map((message) => {
          const text = message.parts
            .map((part) => (part.type === "text" ? part.text : ""))
            .join("");
          const isUser = message.role === "user";
          return (
            <div key={message.id} className={cn("flex", isUser && "justify-end")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed",
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card shadow-paper",
                )}
              >
                <div className="prose prose-sm max-w-none prose-p:my-2">
                  <ReactMarkdown>{text}</ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}

        {status === "submitted" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> The panel is thinking…
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {finishMutation.data && (
        <Card className="mt-6 shadow-lift">
          <CardHeader>
            <CardTitle className="text-2xl">Score: {finishMutation.data.score}/100</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ReactMarkdown>{finishMutation.data.summary}</ReactMarkdown>
          </CardContent>
        </Card>
      )}

      {!finishMutation.data && session.status === "completed" && session.summary && (
        <Card className="mt-6 shadow-lift">
          <CardHeader>
            <CardTitle className="text-2xl">Score: {session.overall_score}/100</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ReactMarkdown>{session.summary}</ReactMarkdown>
          </CardContent>
        </Card>
      )}

      <div className="sticky bottom-0 mt-6 bg-background/90 py-4 backdrop-blur">
        <Textarea
          ref={inputRef}
          value={input}
          maxLength={6000}
          rows={3}
          placeholder="Answer the interviewer…"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => finishMutation.mutate()}
            disabled={finishMutation.isPending || busy}
          >
            <Flag className="size-4" />
            {finishMutation.isPending ? "Evaluating…" : "End & evaluate"}
          </Button>
          <Button onClick={() => void submit()} disabled={busy || !input.trim()}>
            <Send className="size-4" /> Send
          </Button>
        </div>
      </div>
    </main>
  );
}
