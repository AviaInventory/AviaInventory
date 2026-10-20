"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CheckCircle2, Info, X } from "lucide-react";

export type NextStep = {
  /** "success" after an action; "info" to guide the user to their next step. */
  tone?: "success" | "info";
  title: string;
  message: string;
  action?: { label: string; href?: string; onClick?: () => void };
};

/**
 * The confirmation pop-up shown after each order step (instead of a small toast):
 * confirms what just happened and points to the next step.
 */
export default function NextStepDialog({ step, onClose }: { step: NextStep | null; onClose: () => void }) {
  const primaryRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!step) return;
    primaryRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = previousOverflow; };
  }, [step, onClose]);

  if (!step) return null;
  const success = step.tone !== "info";
  const Icon = success ? CheckCircle2 : Info;
  const actionClass = "inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-aviation-primary px-5 py-3 text-sm font-bold text-white hover:opacity-95 sm:w-auto";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#06233f]/55 p-4 print:hidden" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="next-step-title" className="relative w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl sm:p-8">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-aviation-muted hover:bg-aviation-light">
          <X size={18} />
        </button>
        <span className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full ${success ? "bg-aviation-success-soft text-aviation-success" : "bg-aviation-primary/10 text-aviation-primary"}`}>
          <Icon size={30} aria-hidden="true" />
        </span>
        <h2 id="next-step-title" className="mt-4 text-xl font-bold uppercase tracking-wide text-aviation-dark">{step.title}</h2>
        <p className="mt-2 text-sm leading-6 text-aviation-muted">{step.message}</p>
        <div className="mt-6 flex flex-col-reverse items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-aviation-border px-5 py-3 text-sm font-semibold text-aviation-dark">
            {step.action ? "Later" : "OK"}
          </button>
          {step.action?.href && (
            <Link ref={(node) => { primaryRef.current = node; }} href={step.action.href} onClick={onClose} className={actionClass}>{step.action.label}</Link>
          )}
          {step.action?.onClick && (
            <button ref={(node) => { primaryRef.current = node; }} type="button" onClick={() => { onClose(); step.action?.onClick?.(); }} className={actionClass}>{step.action.label}</button>
          )}
        </div>
      </div>
    </div>
  );
}
