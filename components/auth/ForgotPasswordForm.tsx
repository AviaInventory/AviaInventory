"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail } from "lucide-react";
import { requestPasswordReset } from "@/lib/auth";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);
    const result = await requestPasswordReset(email);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center">
        <Mail className="mx-auto text-aviation-primary" size={40} />
        <h1 className="mt-4 text-3xl font-bold text-aviation-primary">Check your email</h1>
        <p className="mt-3 text-aviation-muted">
          We&apos;ve sent a link to reset your password to <strong className="text-aviation-dark">{email}</strong>.
          The link expires in one hour. Open it in this browser.
        </p>
        <Link href="/login" className="mt-8 inline-block font-semibold text-aviation-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-aviation-primary">Reset your password</h1>
        <p className="mt-3 text-aviation-muted">Enter your account email and we&apos;ll send you a reset link.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
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
            className="w-full rounded-xl border border-aviation-border px-4 py-3 outline-none transition disabled:bg-aviation-light"
          />
        </div>

        {error && (
          <div role="alert" className="rounded-xl bg-aviation-error-soft p-4 text-sm text-aviation-error">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-aviation-primary py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-aviation-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-aviation-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
