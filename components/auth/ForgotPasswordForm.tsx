"use client";

import Link from "next/link";
import { useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { requestPasswordReset } from "@/lib/auth";
import { btnPrimary, fieldInput } from "@/components/ui/form";

const row = "grid gap-x-5 gap-y-1 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-start";
const label = "text-[13px] font-semibold text-aviation-dark sm:pt-1.5";

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

  return (
    <div className="compact-form overflow-hidden rounded-xl border border-aviation-border bg-white shadow-sm">
      <div className="flex items-center gap-3 bg-aviation-dark px-5 py-4 text-white sm:px-7">
        {sent ? <Mail size={20} aria-hidden="true" /> : <KeyRound size={20} aria-hidden="true" />}
        <div>
          <h1 className="text-xl font-bold text-white">{sent ? "Check your email" : "Reset your password"}</h1>
          <p className="text-xs text-white/70">
            {sent ? "A reset link is on its way." : "Enter your account email and we'll send you a reset link."}
          </p>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-7 sm:py-6">
        {sent ? (
          <div className="space-y-4">
            <p className="text-[13px] leading-6 text-aviation-dark">
              We&apos;ve sent a link to reset your password to <strong className="break-all">{email}</strong>.
              The link expires in one hour. Open it in this browser.
            </p>
            <div className="border-t border-aviation-border pt-4">
              <Link href="/login" className="text-[13px] font-semibold text-aviation-primary hover:underline">
                Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
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
                className={fieldInput}
              />
            </div>

            {error && (
              <div role="alert" className="rounded-md bg-aviation-error-soft px-3 py-2 text-[13px] text-aviation-error">
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-aviation-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-center text-[13px] text-[var(--aviation-muted)] sm:text-left">
                Remembered it?{" "}
                <Link href="/login" className="font-semibold text-aviation-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
              <button type="submit" disabled={loading} className={`${btnPrimary} px-5`}>
                <Mail size={15} aria-hidden="true" />
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
