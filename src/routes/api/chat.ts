import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import type { Database } from "@/integrations/supabase/types";
import { AI_MODEL, createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { buildInterviewSystemPrompt } from "@/lib/interview-ai.server";

type ChatBody = { messages?: UIMessage[]; sessionId?: string };

function textOf(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as ChatBody;
        if (!Array.isArray(body.messages) || !body.sessionId) {
          return new Response("Bad request", { status: 400 });
        }

        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const supabase = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { apikey: key, Authorization: `Bearer ${token}` } },
        });

        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!user) return new Response("Unauthorized", { status: 401 });

        const { data: session } = await supabase
          .from("interview_sessions")
          .select("id, role, sector, interview_type, difficulty")
          .eq("id", body.sessionId)
          .maybeSingle();
        if (!session) return new Response("Session not found", { status: 404 });

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, experience_level, goal")
          .eq("id", user.id)
          .maybeSingle();

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured", { status: 500 });

        const messages = body.messages;
        const last = messages[messages.length - 1];
        if (last && last.role === "user") {
          const content = textOf(last);
          if (content) {
            await supabase.from("session_messages").insert({
              session_id: session.id,
              user_id: user.id,
              role: "user",
              content,
            });
          }
        }

        const gateway = createLovableAiGatewayProvider(apiKey);
        const result = streamText({
          model: gateway(AI_MODEL),
          system: buildInterviewSystemPrompt(session, profile ?? null),
          messages: convertToModelMessages(messages),
          onFinish: async ({ text }) => {
            if (!text.trim()) return;
            await supabase.from("session_messages").insert({
              session_id: session.id,
              user_id: user.id,
              role: "assistant",
              content: text,
            });
            await supabase
              .from("interview_sessions")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", session.id);
          },
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
