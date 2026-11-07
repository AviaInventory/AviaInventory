"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { resendConfirmationEmail, verifyEmailCode } from "@/lib/auth";
import { dashboardPathForRoles } from "@/lib/auth-redirect";
import { btnPrimary, fieldInput, fieldInputError } from "@/components/ui/form";

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
    <main className="mx-auto w-full max-w-xl px-4 sm:px-6">
      <div className="compact-form overflow-hidden rounded-xl border border-aviation-border bg-white shadow-sm">
        <div className="flex items-center gap-3 bg-aviation-dark px-5 py-4 text-white sm:px-7">
          <MailCheck size={20} aria-hidden="true" />
          <div>
            <h1 className="text-xl font-bold text-white">Verify your email</h1>
            <p className="text-xs text-white/70">Confirm your email address to finish signing in.</p>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-7 sm:py-6">
          <p className="text-[13px] leading-6 text-aviation-dark">
            {justSent ? "We've sent a 6-digit code to " : "Enter the 6-digit code we emailed to "}<strong className="break-all">{email}</strong>{justSent ? ". Enter it below to confirm your email address." : ", or request a new one below."}
          </p>

          <form onSubmit={verify} noValidate className="mt-4 space-y-3.5">
            <div className="grid gap-x-5 gap-y-1 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-start">
              <label htmlFor="email-code" className="text-[13px] font-semibold text-aviation-dark sm:pt-1.5">Verification code</label>
              <div className="min-w-0">
                <input
                  id="email-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder="••••••"
                  aria-invalid={Boolean(error)}
                  className={`${error ? fieldInputError : fieldInput} max-w-[180px] font-mono font-bold tracking-[0.4em]`}
                />
                {error && <p role="alert" className="mt-1 text-xs font-medium text-aviation-error">{error}</p>}
                {resendStatus === "sent" && !error && <p role="status" className="mt-1 text-xs text-aviation-success">A new code is on its way.</p>}
                <p className="mt-1 text-xs italic text-[var(--aviation-muted)]">Can&apos;t find it? Check your spam or promotions folder. You can also confirm using the link in the email.</p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-aviation-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col items-center gap-2 text-[13px] sm:flex-row sm:gap-4">
                <button
                  type="button"
                  onClick={resend}
                  disabled={wait > 0 || resendStatus === "sending"}
                  className="font-semibold text-aviation-primary hover:underline disabled:cursor-not-allowed disabled:text-[var(--aviation-muted)] disabled:no-underline"
                >
                  {resendStatus === "sending" ? "Sending…" : wait > 0 ? `Resend code in ${wait}s` : "Resend code"}
                </button>
                <Link href="/login" className="font-semibold text-[var(--aviation-muted)] hover:underline">Back to sign in</Link>
              </div>
              <button type="submit" disabled={verifying || code.length !== 6} className={`${btnPrimary} px-5`}>
                {verifying && <Loader2 size={15} className="animate-spin" />}
                {verifying ? "Verifying…" : "Verify email"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
