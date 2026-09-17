import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandMark } from "@/components/BrandMark";
import { AuthScene } from "@/components/AuthScene";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowRight, AudioLines, CheckCircle2, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Panelly interview prep" },
      {
        name: "description",
        content:
          "Sign in to Panelly to run AI mock interviews for IT, government, civil services and more, and track your progress.",
      },
      { property: "og:title", content: "Sign in · Panelly interview prep" },
      {
        property: "og:description",
        content: "Sign in to run AI mock interviews and track your interview progress.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim().slice(0, 80) },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    setSent(true);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setGoogleLoading(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    setGoogleLoading(false);
    navigate({ to: "/dashboard", replace: true });
  }

  const isBusy = loading || googleLoading;

  return (
    <main className="paper-grid grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden flex-col justify-between border-r border-border p-12 lg:flex">
        <AuthScene />
        <div className="relative z-10 flex h-full flex-col justify-between">
        <Link to="/">
          <BrandMark />
        </Link>
        <div className="max-w-xl">
          <p className="command-label text-primary">Your private interview room</p>
          <h1 className="mt-6 text-5xl leading-tight transition-all duration-500">
            {mode === "signin"
              ? "Prepare for the question behind the question."
              : "Build the answer you want to be known for."}
          </h1>
          <div className="mt-10 space-y-4">
            {[
              "Adaptive follow-up questions",
              "Structured scoring after every round",
              "Progress stored across sessions",
            ].map((item) => (
              <p key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-primary" />
                {item}
              </p>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
          <AudioLines className="size-5 text-primary" /> AI panel ready
        </div>
        </div>
      </section>
      <section className="flex items-center justify-center px-4 py-16 sm:px-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex justify-center lg:hidden">
            <BrandMark />
          </Link>

          <Card className="shadow-lift">
            <CardHeader>
              <p className="command-label mb-2">Secure workspace access</p>
              <CardTitle className="text-3xl">Take a seat</CardTitle>
              <CardDescription>
                {sent
                  ? "Check your inbox and confirm your email to finish signing up."
                  : "Your mock interviews, feedback and progress in one place."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="mb-6 w-full" onClick={handleGoogle} disabled={isBusy}>
                {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {googleLoading ? "Connecting…" : "Continue with Google"}
              </Button>

                  <Tabs
                    value={mode}
                    onValueChange={(value) => setMode(value as "signin" | "signup")}
                  >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form className="space-y-4 pt-4" onSubmit={handleSignIn}>
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        value={email}
                        maxLength={255}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        maxLength={72}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 bottom-1 size-8"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((visible) => !visible)}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                    </div>
                    <Button type="submit" className="group w-full" disabled={isBusy}>
                      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                      {loading ? "Checking access…" : "Sign in"}
                      {!loading && <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form className="space-y-4 pt-4" onSubmit={handleSignUp}>
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full name</Label>
                      <Input
                        id="signup-name"
                        value={fullName}
                        maxLength={80}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        maxLength={255}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        maxLength={72}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 bottom-1 size-8"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((visible) => !visible)}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                    </div>
                    <Button type="submit" className="group w-full" disabled={isBusy}>
                      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                      {loading ? "Creating your room…" : "Create account"}
                      {!loading && <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
