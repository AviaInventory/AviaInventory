"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { btnPrimary, fieldInput } from "@/components/ui/form";

const row = "grid gap-x-5 gap-y-1 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-start";
const label = "text-[13px] font-semibold text-aviation-dark sm:pt-1.5";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Invalid administrator credentials.");
        return;
      }

      router.replace("/admin/dashboard");
      router.refresh();
    } catch (error) {
      console.error("ADMIN LOGIN ERROR:", error);
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-aviation-light py-8 sm:py-16">
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <div className="compact-form overflow-hidden rounded-xl border border-aviation-border bg-white shadow-sm">
          <div className="flex items-center gap-3 bg-aviation-dark px-5 py-4 text-white sm:px-7">
            <ShieldCheck size={20} aria-hidden="true" />
            <div>
              <h1 className="text-xl font-bold text-white">Administrator Login</h1>
              <p className="text-xs text-white/70">AviaInventory platform monitoring</p>
            </div>
          </div>

          <div className="space-y-4 px-5 py-5 sm:px-7 sm:py-6">
            <p className="text-[13px] leading-5 text-[var(--aviation-muted)]">
              Restricted administrator access. This page is not linked from public navigation.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className={row}>
                <label htmlFor="admin-username" className={label}>Username</label>
                <input
                  id="admin-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  autoComplete="username"
                  className={fieldInput}
                />
              </div>

              <div className={row}>
                <label htmlFor="admin-password" className={label}>Password</label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--aviation-muted)]" size={15} aria-hidden="true" />
                  <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    className={`${fieldInput} pl-8`}
                  />
                </div>
              </div>

              {error && (
                <div role="alert" className="rounded-md bg-aviation-error-soft px-3 py-2 text-[13px] text-aviation-error">
                  {error}
                </div>
              )}

              <div className="flex justify-end border-t border-aviation-border pt-4">
                <button type="submit" disabled={loading} className={`${btnPrimary} w-full px-5 sm:w-auto`}>
                  {loading ? "Signing in..." : "Admin Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
