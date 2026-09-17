import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { buildEvaluationPrompt, buildScoringPrompt, runGatewayJson } from "./interview-ai.server";

const CreateSessionSchema = z.object({
  role: z.string().trim().min(1).max(80),
  sector: z.string().trim().min(1).max(40),
  interview_type: z.string().trim().min(1).max(40),
  difficulty: z.string().trim().min(1).max(20),
});

export const createSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => CreateSessionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("interview_sessions")
      .insert({
        user_id: context.userId,
        title: `${data.role} · ${data.interview_type}`,
        role: data.role,
        sector: data.sector,
        interview_type: data.interview_type,
        difficulty: data.difficulty,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("interview_sessions")
      .select(
        "id, title, role, sector, interview_type, difficulty, status, overall_score, updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: session, error } = await context.supabase
      .from("interview_sessions")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!session) throw new Error("Session not found");

    const { data: messages, error: messageError } = await context.supabase
      .from("session_messages")
      .select("id, role, content, created_at")
      .eq("session_id", data.id)
      .order("created_at", { ascending: true });
    if (messageError) throw new Error(messageError.message);

    return { session, messages: messages ?? [] };
  });

export const deleteSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("interview_sessions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const finishSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: session } = await context.supabase
      .from("interview_sessions")
      .select("role, sector, interview_type, difficulty")
      .eq("id", data.id)
      .maybeSingle();
    if (!session) throw new Error("Session not found");

    const { data: messages } = await context.supabase
      .from("session_messages")
      .select("role, content")
      .eq("session_id", data.id)
      .order("created_at", { ascending: true });

    const transcript = (messages ?? [])
      .map((m) => `${m.role === "user" ? "CANDIDATE" : "INTERVIEWER"}: ${m.content}`)
      .join("\n\n");

    if (!transcript.trim())
      throw new Error("Answer at least one question before ending the interview.");

    const result = await runGatewayJson(buildEvaluationPrompt(session, transcript));
    const score = Math.max(0, Math.min(100, Math.round(Number(result["score"]) || 0)));
    const summary = String(result["summary"] ?? "").slice(0, 4000);

    const { error } = await context.supabase
      .from("interview_sessions")
      .update({ status: "completed", overall_score: score, summary })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    return { score, summary };
  });

const ProfileSchema = z.object({
  full_name: z.string().trim().max(80).nullable(),
  target_role: z.string().trim().max(80).nullable(),
  target_sector: z.string().trim().max(40).nullable(),
  experience_level: z.string().trim().max(20).nullable(),
  goal: z.string().trim().max(500).nullable(),
});

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => ProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...data });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const AttemptSchema = z.object({
  question_id: z.string().uuid(),
  answer: z.string().trim().min(10).max(6000),
});

export const scoreAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => AttemptSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: question, error: questionError } = await context.supabase
      .from("questions")
      .select("prompt, sector, category, difficulty, tip")
      .eq("id", data.question_id)
      .maybeSingle();
    if (questionError) throw new Error(questionError.message);
    if (!question) throw new Error("Question not found");

    const result = await runGatewayJson(buildScoringPrompt(question, data.answer));
    const score = Math.max(0, Math.min(100, Math.round(Number(result["score"]) || 0)));
    const feedback = String(result["feedback"] ?? "").slice(0, 4000);

    const { error } = await context.supabase.from("practice_attempts").insert({
      user_id: context.userId,
      question_id: data.question_id,
      answer: data.answer,
      score,
      feedback,
    });
    if (error) throw new Error(error.message);

    return { score, feedback };
  });

export const listAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("practice_attempts")
      .select("id, score, created_at, question_id, questions(prompt, sector)")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
