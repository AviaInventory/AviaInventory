"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { loginUser } from "@/lib/auth";
import CheckEmailNotice from "./CheckEmailNotice";
import { dashboardPathForRoles, safeNextPath } from "@/lib/auth-redirect";

const NOTICES: Record<string, { tone: "info" | "error"; text: string }> = {
  "email-confirmed": { tone: "info", text: "Your email address is confirmed. Sign in to start using AviaInventory." },
  "password-updated": { tone: "info", text: "Your password has been updated. Sign in with your new password." },
  "link-invalid": { tone: "info", text: "That link has expired or was already used. If you have confirmed your email, sign in below." },
  "reset-link-invalid": { tone: "error", text: "That password reset link has expired or was already used. Request a new one below." },
};

export default function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Signed up but never confirmed: finish with the emailed code instead of a dead end.
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);

  const banner = notice ? NOTICES[notice] : undefined;

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    const result = await loginUser(email, password);
    if (!result.success) {
      if (result.needsVerification) setVerifyEmail(email.trim());
      setError(result.error);
      setLoading(false);
      return;
    }

    // Keep `loading` on while the next page loads so the button can't be resubmitted.
    router.replace(safeNextPath(next) ?? dashboardPathForRoles(result.roles));
    router.refresh();
  }

  if (verifyEmail) return <CheckEmailNotice email={verifyEmail} justSent={false} />;

  const input = "h-10 w-full rounded-md border border-aviation-border bg-white px-2.5 text-[15px] text-aviation-dark outline-none transition focus:border-aviation-primary focus:ring-2 focus:ring-aviation-primary/20 disabled:bg-aviation-light sm:h-8 sm:text-[13px]";
  const label = "text-[13px] font-semibold text-aviation-dark sm:pt-1.5";
  const row = "grid gap-x-5 gap-y-1 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-start";

  return (
    <div className="compact-form overflow-hidden rounded-xl border border-aviation-border bg-white shadow-sm">
      <div className="flex items-center gap-3 bg-aviation-dark px-5 py-4 text-white sm:px-7">
        <LogIn size={20} aria-hidden="true" />
        <div>
          <h1 className="text-xl font-bold text-white">Welcome back</h1>
          <p className="text-xs text-white/70">Sign in to your AviaInventory account.</p>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-7 sm:py-6">
        {banner && (
          <div
            role={banner.tone === "error" ? "alert" : "status"}
            className={`mb-4 rounded-md px-3 py-2 text-[13px] ${
              banner.tone === "error"
                ? "bg-aviation-error-soft text-aviation-error"
                : "bg-aviation-success-soft text-aviation-primary"
            }`}
          >
            {banner.text}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5">
          <div className={row}>
            <label htmlFor="email" className={label}>Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={input}
            />
          </div>

          <div className={row}>
            <label htmlFor="password" className={label}>Password</label>
            <div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className={`${input} pr-9`}
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowPassword((shown) => !shown)}
                  className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-[var(--aviation-muted)] hover:text-aviation-primary disabled:opacity-50 sm:h-7 sm:w-7"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Link href="/forgot-password" className="mt-1 inline-block text-xs font-semibold text-aviation-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-md bg-aviation-error-soft px-3 py-2 text-[13px] text-aviation-error">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-aviation-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-[13px] text-[var(--aviation-muted)] sm:text-left">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-aviation-primary hover:underline">Create one</Link>
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-aviation-primary px-5 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-8"
            >
              <LogIn size={15} />
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
