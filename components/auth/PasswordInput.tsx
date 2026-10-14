"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/password-policy";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string };

/** Password field with a show/hide toggle. */
export function PasswordInput({ label, id, className, ...inputProps }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className="w-full rounded-xl border border-aviation-border px-4 py-3 pr-12 outline-none transition disabled:bg-aviation-light"
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((shown) => !shown)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-aviation-muted hover:text-aviation-primary"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
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
          <li key={rule.id} className={`flex items-center gap-2 ${met ? "text-aviation-success" : "text-aviation-muted"}`}>
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
