"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSafeRedirectPath } from "@/lib/safeRedirect";
import { logMonitoring } from "@/lib/monitoring";
import { createBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

export default function AuthForm({ mode }: AuthFormProps) {
  const searchParams = useSearchParams();
  const postAuthPath = getSafeRedirectPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLogin = mode === "login";
  const title = isLogin ? "Welcome back" : "Create your studio";
  const subtitle = isLogin
    ? "Sign in to continue your carousel stories"
    : "Start building cinematic food carousels";

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Add env keys to enable auth.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createBrowserClient();

      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        window.location.href = postAuthPath;
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;
      setMessage("Check your email to confirm your account, then sign in.");
    } catch (err) {
      logMonitoring("auth_failed", "warn", { mode });
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createBrowserClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(postAuthPath)}`
          : undefined;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-[32px] bg-[#0b0f1a] p-8 ring-1 ring-white/10">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f7c600]">
        Table Tales Studio
      </p>
      <h1 className="mt-2 text-3xl font-bold text-white">{title}</h1>
      <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="mt-8 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-black/50 py-3 text-sm font-semibold text-white transition-colors hover:border-[#f7c600]/40 disabled:opacity-50"
      >
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-zinc-500">
        <span className="h-px flex-1 bg-zinc-800" />
        or email
        <span className="h-px flex-1 bg-zinc-800" />
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full min-h-[48px] rounded-xl bg-black px-4 text-white ring-1 ring-zinc-800 focus:outline-none focus:ring-[#f7c600]/40"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full min-h-[48px] rounded-xl bg-black px-4 text-white ring-1 ring-zinc-800 focus:outline-none focus:ring-[#f7c600]/40"
        />

        {error && (
          <p className="rounded-lg bg-red-950/80 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-lg bg-[#f7c600]/10 px-3 py-2 text-sm text-[#f7c600]">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] rounded-xl bg-[#f7c600] py-3 text-sm font-bold text-black transition-colors hover:bg-[#ffe033] disabled:opacity-50"
        >
          {loading
            ? "Please wait…"
            : isLogin
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        {isLogin ? (
          <>
            New here?{" "}
            <Link href="/signup" className="font-semibold text-[#f7c600]">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#f7c600]">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
