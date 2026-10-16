"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

type State =
  | { kind: "idle" }
  | { kind: "checking"; message: string }
  | { kind: "success"; message: string }
  | { kind: "problem"; message: string };

const POLL_MS = 4000;
const MAX_POLLS = 30; // ~2 minutes: M-Pesa confirmations can take a little while.

/**
 * Paystack returns the customer to /account/subscription?reference=…. This confirms
 * the payment with the server (which checks it with Paystack) and refreshes the plan.
 */
export default function PaymentConfirmation() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") ?? params.get("trxref");
    if (!reference) return;

    let cancelled = false;
    let polls = 0;
    let timer: number | undefined;

    const clearQuery = () => {
      const url = new URL(window.location.href);
      ["reference", "trxref", "checkout"].forEach((key) => url.searchParams.delete(key));
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    };

    async function check() {
      try {
        const response = await fetch(`/api/billing/verify?reference=${encodeURIComponent(reference!)}`, { cache: "no-store" });
        const body = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok) {
          setState({ kind: "problem", message: body.error ?? "We couldn't confirm the payment yet." });
          return;
        }
        if (body.status === "success") {
          setState({ kind: "success", message: body.message });
          clearQuery();
          router.refresh();
        } else if ((body.status === "ongoing" || body.status === "pending" || body.status === "processing" || body.status === "queued") && polls < MAX_POLLS) {
          polls += 1;
          setState({ kind: "checking", message: "Waiting for the payment to be confirmed. If you paid with M-Pesa, approve the prompt on your phone." });
          timer = window.setTimeout(check, POLL_MS);
        } else {
          setState({ kind: "problem", message: body.message ?? "The payment was not completed." });
          clearQuery();
        }
      } catch {
        if (!cancelled) setState({ kind: "problem", message: "We couldn't confirm the payment. Refresh this page in a moment." });
      }
    }

    // Deferred so the first state update happens outside the effect body.
    timer = window.setTimeout(() => {
      setState({ kind: "checking", message: "Confirming your payment…" });
      check();
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [router]);

  if (state.kind === "idle") return null;

  const styles = {
    checking: "border-aviation-border bg-white text-aviation-dark",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    problem: "border-amber-200 bg-amber-50 text-amber-950",
  }[state.kind];

  return (
    <div role="status" aria-live="polite" className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${styles}`}>
      {state.kind === "checking" && <Loader2 size={18} className="mt-0.5 shrink-0 animate-spin" />}
      {state.kind === "success" && <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-700" />}
      {state.kind === "problem" && <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />}
      <p className="leading-6">{state.message}</p>
    </div>
  );
}
