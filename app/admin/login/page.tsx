"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

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
    <main className="flex min-h-screen items-center justify-center bg-aviation-success-soft px-6 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-aviation-success-soft text-aviation-primary">
            <ShieldCheck size={34} />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-aviation-primary">
            Administrator Login
          </h1>
          <p className="mt-2 text-sm text-aviation-muted">
            AviaInventory platform monitoring
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-aviation-dark">
              Username
            </label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-xl border border-aviation-border px-4 py-3 outline-none focus:border-aviation-border focus:ring-2 focus:ring-aviation-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-aviation-dark">
              Password
            </label>
            <div className="relative">
              <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-aviation-muted" size={18} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-aviation-border py-3 pl-11 pr-4 outline-none focus:border-aviation-border focus:ring-2 focus:ring-aviation-primary"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-aviation-error-soft p-4 text-sm text-aviation-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-aviation-primary py-3 font-semibold text-white transition hover:bg-aviation-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Admin Login"}
          </button>
        </form>
      </div>
    </main>
  );
}
