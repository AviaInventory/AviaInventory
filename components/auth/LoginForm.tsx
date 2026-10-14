"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { loginUser } from "@/lib/auth";
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

  const banner = notice ? NOTICES[notice] : undefined;

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    const result = await loginUser(email, password);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Keep `loading` on while the next page loads so the button can't be resubmitted.
    router.replace(safeNextPath(next) ?? dashboardPathForRoles(result.roles));
    router.refresh();
  }

  return (
    <div>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-aviation-primary">Welcome Back</h1>
        <p className="mt-3 text-aviation-muted">Sign in to your AviaInventory account.</p>
      </div>

      {banner && (
        <div
          role={banner.tone === "error" ? "alert" : "status"}
          className={`mt-8 rounded-xl p-4 text-sm ${
            banner.tone === "error"
              ? "bg-aviation-error-soft text-aviation-error"
              : "bg-aviation-success-soft text-aviation-primary"
          }`}
        >
          {banner.text}
        </div>
      )}

      <form onSubmit={handleLogin} className="mt-10 space-y-6">
        <div>
          <label htmlFor="email" className="mb-2 block font-medium">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full rounded-xl border border-aviation-border px-4 py-3 outline-none transition focus:border-aviation-border disabled:bg-aviation-light"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="block font-medium">
              Password
            </label>
            <Link href="/forgot-password" className="text-sm font-semibold text-aviation-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-aviation-border px-4 py-3 pr-12 outline-none transition focus:border-aviation-border disabled:bg-aviation-light"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => setShowPassword((shown) => !shown)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-aviation-muted hover:text-aviation-primary disabled:opacity-50"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-xl bg-aviation-error-soft p-4 text-sm text-aviation-error">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-aviation-primary py-3 font-semibold text-white transition hover:bg-aviation-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogIn size={18} />
          {loading ? "Signing In..." : "Login"}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-aviation-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-aviation-primary hover:underline">
          Create one
        </Link>
      </div>
    </div>
  );
}
