"use client";

import Link from "next/link";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { resendConfirmationEmail } from "@/lib/auth";

export default function CheckEmailNotice({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function resend() {
    setStatus("sending");
    const result = await resendConfirmationEmail(email);
    if (result.success) {
      setStatus("sent");
    } else {
      setError(result.error);
      setStatus("error");
    }
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-aviation-border bg-white p-8 text-center shadow-sm">
        <MailCheck className="mx-auto text-aviation-primary" size={44} />
        <h1 className="mt-4 text-3xl font-bold text-aviation-primary">Confirm your email</h1>
        <p className="mt-3 text-sm leading-6 text-aviation-muted">
          We&apos;ve sent a confirmation link to <strong className="text-aviation-dark">{email}</strong>.
          Open it to confirm your email address, then sign in with the password you just created.
        </p>
        <p className="mt-3 text-xs text-aviation-muted">Can&apos;t find it? Check your spam or promotions folder.</p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={resend}
            disabled={status === "sending" || status === "sent"}
            className="min-h-11 rounded-xl border border-aviation-border px-5 py-3 text-sm font-semibold text-aviation-dark disabled:opacity-60"
          >
            {status === "sending" ? "Sending..." : status === "sent" ? "Confirmation email sent" : "Resend confirmation email"}
          </button>
          <Link href="/login" className="text-sm font-semibold text-aviation-primary hover:underline">
            Already confirmed? Sign in
          </Link>
        </div>

        {status === "error" && (
          <p role="alert" className="mt-4 text-sm text-aviation-error">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
