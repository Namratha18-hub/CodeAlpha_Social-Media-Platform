import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const searchSchema = z.object({
  mode: z.enum(["login", "register", "forgot"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Pulse" },
      { name: "description", content: "Sign in or create your Pulse account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { mode = "login" } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const parsed = z.object({
          email: z.string().email(),
          password: z.string().min(6, "At least 6 characters"),
          username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, _ only"),
          displayName: z.string().min(1).max(60),
        }).safeParse({ email, password, username, displayName });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
            data: { username, display_name: displayName },
          },
        });
        if (error) throw error;
        toast.success("Welcome to Pulse!");
        navigate({ to: "/home" });
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/home" });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Check your email for the reset link.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/home",
    });
    if (res.error) {
      toast.error("Google sign in failed");
      setLoading(false);
    } else if (!res.redirected) {
      navigate({ to: "/home" });
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-gradient-brand relative items-center justify-center p-12">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,white,transparent_40%)]" />
        <div className="relative z-10 max-w-md text-primary-foreground">
          <div className="mb-6 h-12 w-12 rounded-2xl bg-white/20 backdrop-blur" />
          <h2 className="font-display text-4xl font-bold">Welcome to Pulse</h2>
          <p className="mt-4 text-white/90">
            Where moments meet a community. Sign in to share your story.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-brand" />
            <span className="font-display text-lg font-bold">Pulse</span>
          </Link>
          <h1 className="text-2xl font-bold">
            {mode === "register" ? "Create your account" : mode === "forgot" ? "Reset password" : "Sign in"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "register"
              ? "Join thousands of creators on Pulse."
              : mode === "forgot"
              ? "We'll send you a reset link."
              : "Welcome back. Let's get you in."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            {mode === "register" && (
              <>
                <Field label="Display name" value={displayName} onChange={setDisplayName} placeholder="Jane Doe" />
                <Field label="Username" value={username} onChange={setUsername} placeholder="janedoe" />
              </>
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            {mode !== "forgot" && (
              <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-brand py-2.5 font-semibold text-primary-foreground shadow-soft hover:shadow-glow disabled:opacity-50"
            >
              {loading ? "Please wait..." : mode === "register" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
            </button>
          </form>

          {mode !== "forgot" && (
            <>
              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
              </div>
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full rounded-xl border border-border bg-card py-2.5 font-medium hover:bg-secondary"
              >
                Continue with Google
              </button>
            </>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" && (
              <>
                <Link to="/auth" search={{ mode: "forgot" }} className="text-primary hover:underline">
                  Forgot password?
                </Link>
                <div className="mt-2">
                  New here?{" "}
                  <Link to="/auth" search={{ mode: "register" }} className="font-medium text-primary hover:underline">
                    Create an account
                  </Link>
                </div>
              </>
            )}
            {mode === "register" && (
              <>
                Already on Pulse?{" "}
                <Link to="/auth" search={{ mode: "login" }} className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </>
            )}
            {mode === "forgot" && (
              <Link to="/auth" search={{ mode: "login" }} className="text-primary hover:underline">
                Back to sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground/80">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none ring-primary/40 transition focus:ring-2"
        required
      />
    </label>
  );
}
