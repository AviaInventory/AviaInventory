"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { resendConfirmationEmail, verifyEmailCode } from "@/lib/auth";
import { dashboardPathForRoles } from "@/lib/auth-redirect";

const RESEND_WAIT_SECONDS = 60;

/** After registering (or signing in unverified): enter the 6-digit code from the email. */
export default function CheckEmailNotice({ email, justSent = true }: { email: string; justSent?: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [wait, setWait] = useState(justSent ? RESEND_WAIT_SECONDS : 0);

  // The email was just sent, so resending is possible after a short wait.
  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (code.length !== 6) return setError("Enter the 6-digit code from the email.");
    setVerifying(true);
    const result = await verifyEmailCode(email, code);
    if (!result.success) {
      setVerifying(false);
      setError(result.error);
      return;
    }
    router.replace(dashboardPathForRoles(result.roles));
    router.refresh();
  }

  async function resend() {
    setError("");
    setResendStatus("sending");
    const result = await resendConfirmationEmail(email);
    if (!result.success) {
      setResendStatus("idle");
      setError(result.error);
      return;
    }
    setResendStatus("sent");
    setCode("");
    setWait(RESEND_WAIT_SECONDS);
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-aviation-border bg-white p-6 text-center shadow-sm sm:p-8">
        <MailCheck className="mx-auto text-aviation-primary" size={44} />
        <h1 className="mt-4 text-3xl font-bold text-aviation-primary">Verify your email</h1>
        <p className="mt-3 text-sm leading-6 text-aviation-muted">
          {justSent ? "We've sent a 6-digit code to " : "Enter the 6-digit code we emailed to "}<strong className="break-all text-aviation-dark">{email}</strong>{justSent ? ". Enter it below to confirm your email address." : ", or request a new one below."}
        </p>

        <form onSubmit={verify} noValidate className="mt-6 space-y-4">
          <label htmlFor="email-code" className="sr-only">Verification code</label>
          <input
            id="email-code"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="••••••"
            aria-invalid={Boolean(error)}
            className="mx-auto block min-h-14 w-full max-w-[260px] rounded-xl border border-aviation-border bg-white text-center font-mono text-2xl font-bold tracking-[0.5em] text-aviation-dark focus:border-aviation-primary focus:outline-none"
          />
          {error && <p role="alert" className="text-sm text-aviation-error">{error}</p>}
          {resendStatus === "sent" && !error && <p role="status" className="text-sm text-aviation-success">A new code is on its way.</p>}
          <button type="submit" disabled={verifying || code.length !== 6} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-aviation-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
            {verifying && <Loader2 size={16} className="animate-spin" />}
            {verifying ? "Verifying…" : "Verify email"}
          </button>
        </form>

        <p className="mt-5 text-xs text-aviation-muted">Can&apos;t find it? Check your spam or promotions folder. You can also confirm using the link in the email.</p>
        <div className="mt-4 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={resend}
            disabled={wait > 0 || resendStatus === "sending"}
            className="text-sm font-semibold text-aviation-primary hover:underline disabled:cursor-not-allowed disabled:text-aviation-muted disabled:no-underline"
          >
            {resendStatus === "sending" ? "Sending…" : wait > 0 ? `Resend code in ${wait}s` : "Resend code"}
          </button>
          <Link href="/login" className="text-sm font-semibold text-aviation-muted hover:underline">Back to sign in</Link>
        </div>
      </div>
    </main>
  );
}
