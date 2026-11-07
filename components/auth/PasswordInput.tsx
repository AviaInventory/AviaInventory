"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/password-policy";
import { fieldInput } from "@/components/ui/form";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string; children?: React.ReactNode };

/** Password field with a show/hide toggle. Label sits beside the field on desktop, above it on phones. */
export function PasswordInput({ label, id, className, children, ...inputProps }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`grid gap-x-5 gap-y-1 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-start ${className ?? ""}`}>
      <label htmlFor={id} className="text-[13px] font-semibold text-aviation-dark sm:pt-1.5">
        {label}
      </label>
      <div className="min-w-0">
        <div className="relative">
          <input
            id={id}
            type={visible ? "text" : "password"}
            className={`${fieldInput} pr-9`}
            {...inputProps}
          />
          <button
            type="button"
            onClick={() => setVisible((shown) => !shown)}
            className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-[var(--aviation-muted)] hover:text-aviation-primary sm:h-7 sm:w-7"
            aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={visible}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Live checklist of the password rules, ticking each one as it is met. */
export function PasswordChecklist({ password, id }: { password: string; id?: string }) {
  return (
    <ul id={id} className="space-y-1 text-sm" aria-live="polite">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li key={rule.id} className={`flex items-center gap-2 ${met ? "text-aviation-success" : "text-[var(--aviation-muted)]"}`}>
            {met ? <Check size={15} aria-hidden="true" /> : <X size={15} aria-hidden="true" />}
            <span>
              {rule.label}
              <span className="sr-only">{met ? " (met)" : " (not met)"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
