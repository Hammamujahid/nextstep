"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import AuthShell, { AuthFooter } from "../../components/AuthShell";
import GoogleButton from "../../components/GoogleButton";
import { loginApi, setToken } from "../../lib/auth";

const OAUTH_ERRORS: Record<string, string> = {
  oauth_failed: "Google login failed, please try again.",
  oauth_state: "Security check failed, please try again.",
  email_not_verified: "Your Google email is not verified.",
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const justRegistered = params.get("registered") === "1";
  const oauthError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDetails([]);

    if (!email.trim() || !password) {
      setError("Please fill in email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginApi({ email: email.trim(), password });
      setToken(res.access_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const m = err as { message?: string; details?: string[] };
      setError(m.message ?? "Login failed, please try again.");
      if (m.details) setDetails(m.details);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back 👋"
      subtitle="Log in to continue your career journey."
    >
      {justRegistered && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Account created! Please log in with your new credentials.</p>
        </div>
      )}
      {oauthError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
          <p className="flex items-start gap-2 font-medium">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {OAUTH_ERRORS[oauthError] ?? "Google login failed, please try again."}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
          <p className="flex items-start gap-2 font-medium">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
          {details.length > 0 && (
            <ul className="mt-1.5 list-disc space-y-0.5 pl-8 text-[13px]">
              {details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="andi@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <GoogleButton label="Continue with Google" />

      <AuthFooter text="Don't have an account?" linkText="Create one" href="/register" />
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
