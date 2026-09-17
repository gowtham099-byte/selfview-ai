import { generateText } from "ai";
import { AI_MODEL, createLovableAiGatewayProvider } from "./ai-gateway.server";

type SessionMeta = {
  role: string;
  sector: string;
  interview_type: string;
  difficulty: string;
};

type QuestionMeta = {
  prompt: string;
  sector: string;
  category: string;
  difficulty: string;
  tip: string | null;
};

export function buildInterviewSystemPrompt(
  session: SessionMeta,
  profile: {
    full_name: string | null;
    experience_level: string | null;
    goal: string | null;
  } | null,
) {
  return [
    "You are an experienced interview panellist running a realistic mock interview.",
    `Target role: ${session.role}. Sector: ${session.sector}. Round type: ${session.interview_type}. Difficulty: ${session.difficulty}.`,
    profile?.full_name ? `Candidate name: ${profile.full_name}.` : "",
    profile?.experience_level ? `Candidate experience: ${profile.experience_level}.` : "",
    profile?.goal ? `Candidate goal: ${profile.goal}.` : "",
    "",
    "Rules:",
    "1. Ask ONE question at a time and then wait for the candidate's answer.",
    "2. Adapt to the sector: government and civil-services rounds should feel like a formal board (situational, ethics, current affairs, service motivation); technical rounds should probe depth with follow-ups; HR rounds should probe motivation and fit.",
    "3. After each answer give 2-4 lines of crisp, specific feedback (what worked, what to sharpen), then ask the next question.",
    "4. Never invent facts about the candidate. If the answer is vague, ask a probing follow-up instead of moving on.",
    "5. Keep replies under 180 words. Use plain markdown, short paragraphs or bullets.",
    "6. Open the interview with a one-line greeting and your first question.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildEvaluationPrompt(session: SessionMeta, transcript: string) {
  return [
    `Evaluate this mock interview transcript for the role "${session.role}" (${session.sector}, ${session.interview_type} round, ${session.difficulty} difficulty).`,
    "",
    transcript,
    "",
    'Reply with ONLY a JSON object: {"score": <integer 0-100>, "summary": "<markdown feedback>"}.',
    "The summary must contain: a one-line verdict, a '**What went well**' bullet list, a '**What to improve**' bullet list, and a '**Next steps**' bullet list. Keep it under 300 words.",
  ].join("\n");
}

export function buildScoringPrompt(question: QuestionMeta, answer: string) {
  return [
    `You are grading a single interview answer for the ${question.sector} sector (${question.category}, ${question.difficulty}).`,
    `Question: ${question.prompt}`,
    question.tip ? `Interviewer note: ${question.tip}` : "",
    "",
    `Candidate answer: ${answer}`,
    "",
    'Reply with ONLY a JSON object: {"score": <integer 0-100>, "feedback": "<markdown feedback>"}.',
    "Feedback must include a strengths bullet list, an improvements bullet list, and one sample stronger opening line. Under 220 words.",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function runGatewayJson(prompt: string): Promise<Record<string, unknown>> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured.");

  const gateway = createLovableAiGatewayProvider(apiKey);
  const { text } = await generateText({
    model: gateway(AI_MODEL),
    prompt,
  });

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { score: 0, summary: text, feedback: text };
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return { score: 0, summary: text, feedback: text };
  }
}
