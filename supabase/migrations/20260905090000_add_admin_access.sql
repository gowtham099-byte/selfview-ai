ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE POLICY "admins can read profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "admins can read sessions"
  ON public.interview_sessions FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "admins can read messages"
  ON public.session_messages FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "admins can read attempts"
  ON public.practice_attempts FOR SELECT TO authenticated
  USING (public.is_admin());