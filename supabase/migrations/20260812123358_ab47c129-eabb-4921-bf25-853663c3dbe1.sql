CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  target_role TEXT,
  target_sector TEXT,
  experience_level TEXT,
  goal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New mock interview',
  role TEXT NOT NULL DEFAULT 'General',
  sector TEXT NOT NULL DEFAULT 'general',
  interview_type TEXT NOT NULL DEFAULT 'mixed',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  overall_score INTEGER,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_sessions TO authenticated;
GRANT ALL ON public.interview_sessions TO service_role;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions" ON public.interview_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER interview_sessions_updated_at BEFORE UPDATE ON public.interview_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_sessions_user ON public.interview_sessions(user_id, updated_at DESC);

CREATE TABLE public.session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_messages TO authenticated;
GRANT ALL ON public.session_messages TO service_role;
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages" ON public.session_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_messages_session ON public.session_messages(session_id, created_at);

CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  prompt TEXT NOT NULL,
  tip TEXT,
  ideal_answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.questions TO anon;
GRANT SELECT ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions are public" ON public.questions FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  score INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_attempts TO authenticated;
GRANT ALL ON public.practice_attempts TO service_role;
ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts" ON public.practice_attempts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_attempts_user ON public.practice_attempts(user_id, created_at DESC);

INSERT INTO public.questions (sector, category, difficulty, prompt, tip) VALUES
('it','technical','easy','Explain the difference between an array and a linked list, and when you would choose each.','Compare memory layout, insertion cost and cache behaviour.'),
('it','technical','medium','How would you design a URL shortening service that handles 10,000 requests per second?','Cover hashing, storage, caching and redirects.'),
('it','technical','hard','Describe how you would debug a production API whose latency suddenly tripled.','Talk metrics, tracing, recent deploys, then hypotheses.'),
('it','behavioral','easy','Tell me about a time you disagreed with a teammate about a technical decision.','Use STAR: situation, task, action, result.'),
('it','hr','easy','Why do you want to work at our company specifically?','Tie their product/mission to your own trajectory.'),
('software','technical','medium','What happens, step by step, when you type a URL into a browser and press Enter?','Go DNS to TCP/TLS to HTTP to render pipeline.'),
('software','technical','medium','How do you keep a large codebase maintainable as the team grows?','Mention boundaries, tests, review culture, docs.'),
('software','system-design','hard','Design a real-time chat application supporting one million concurrent users.','Discuss websockets, fan-out, presence, storage.'),
('civil-services','interview','medium','What, in your view, is the biggest governance challenge facing the country today?','Be balanced, evidence-based and solution oriented.'),
('civil-services','interview','hard','How would you handle pressure from a political superior to bend a rule?','Anchor in integrity, law, and practical diplomacy.'),
('civil-services','interview','medium','As a district officer, how would you improve primary education outcomes in your district?','Show data-driven, community-inclusive planning.'),
('civil-services','interview','easy','Why do you want to join the civil services rather than the private sector?','Speak to service motivation with concrete examples.'),
('government','interview','easy','Describe your understanding of the role you have applied for in this department.','Show you read the job notification carefully.'),
('government','interview','medium','How would you ensure transparency while handling public funds?','Mention audits, records, delegation and citizen access.'),
('government','interview','medium','A citizen is angry about a delayed service at your counter. What do you do?','Acknowledge, explain the process, give a clear timeline.'),
('government','hr','easy','Are you willing to be posted to a remote location? Why?','Be honest and show adaptability.'),
('banking','technical','medium','Explain the difference between the repo rate and the reverse repo rate.','Define both and give the policy purpose of each.'),
('banking','interview','easy','Why do you want a career in banking?','Connect stability, service and numeracy to your story.'),
('banking','technical','medium','What is a non-performing asset and why does it matter to a bank?','Definition, classification, impact on lending.'),
('teaching','interview','easy','How would you handle a classroom where students have very different learning speeds.','Differentiated instruction and peer learning.'),
('teaching','interview','medium','A parent disagrees with the grade you gave their child. How do you respond?','Evidence, empathy, clear rubric, follow-up plan.'),
('teaching','interview','medium','How do you keep students engaged in a subject they find boring?','Real-world links, activity, storytelling.'),
('sales','behavioral','easy','Tell me about the toughest deal you ever closed.','Quantify the outcome.'),
('sales','behavioral','medium','How do you handle a prospect who says your product is too expensive?','Reframe on value, not discount.'),
('sales','hr','easy','How do you stay motivated after a month of missed targets?','Show process focus and resilience.'),
('healthcare','interview','medium','How do you prioritise when several patients need attention at once?','Triage logic plus communication.'),
('healthcare','interview','medium','Describe a time you made a mistake at work. What did you do next?','Ownership, correction, prevention.'),
('general','behavioral','easy','Tell me about yourself.','Present, past, future in ninety seconds.'),
('general','hr','easy','What are your greatest strengths and weaknesses?','Pick a real weakness plus the fix in progress.'),
('general','hr','medium','Where do you see yourself in five years?','Ambitious but plausible for this role.');