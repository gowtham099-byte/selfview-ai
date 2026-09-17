import { createServerFn } from "@tanstack/react-start";
import { requireAdmin, requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth, requireAdmin])
  .handler(async ({ context }) => {
    const [
      { data: profiles, error: profilesError },
      { data: sessions, error: sessionsError },
      { data: attempts, error: attemptsError },
    ] = await Promise.all([
      context.supabase
        .from("profiles")
        .select(
          "id, full_name, target_role, target_sector, experience_level, created_at, updated_at",
        )
        .order("created_at", { ascending: false }),
      context.supabase
        .from("interview_sessions")
        .select(
          "id, user_id, role, sector, interview_type, difficulty, status, overall_score, updated_at",
        )
        .order("updated_at", { ascending: false })
        .limit(200),
      context.supabase
        .from("practice_attempts")
        .select("id, user_id, score, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    if (profilesError) throw new Error(profilesError.message);
    if (sessionsError) throw new Error(sessionsError.message);
    if (attemptsError) throw new Error(attemptsError.message);

    const profileRows = profiles ?? [];
    const sessionRows = sessions ?? [];
    const attemptRows = attempts ?? [];
    const profileById = new Map(profileRows.map((profile) => [profile.id, profile]));

    const members = profileRows.map((profile) => {
      const memberSessions = sessionRows.filter((session) => session.user_id === profile.id);
      const memberAttempts = attemptRows.filter((attempt) => attempt.user_id === profile.id);
      const scoredSessions = memberSessions.filter((session) => session.overall_score !== null);
      const scores = [
        ...scoredSessions.map((session) => session.overall_score),
        ...memberAttempts.map((attempt) => attempt.score),
      ].filter((score): score is number => score !== null);

      return {
        ...profile,
        interview_count: memberSessions.length,
        completed_interviews: memberSessions.filter((session) => session.status === "completed")
          .length,
        practice_count: memberAttempts.length,
        average_score: scores.length
          ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
          : null,
      };
    });

    return {
      stats: {
        members: profileRows.length,
        interviews: sessionRows.length,
        completed_interviews: sessionRows.filter((session) => session.status === "completed")
          .length,
        practice_attempts: attemptRows.length,
      },
      members,
      recent_sessions: sessionRows.slice(0, 40).map((session) => ({
        ...session,
        member_name: profileById.get(session.user_id)?.full_name ?? "Unnamed member",
      })),
    };
  });
