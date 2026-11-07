/**
 * Shared form look, taken from the sign-in / sign-up forms: a card with a dark header,
 * labels beside the fields on desktop (above them on phones), slim inputs and small buttons.
 *
 * Use these everywhere a form is shown so every form on the site looks the same.
 * Server- and client-safe: no hooks, no "use client".
 *
 *   <FormCard icon={FileText} title="New RFQ" subtitle="Tell suppliers what you need.">
 *     <FormSection title="Part details" text="What you are looking for." />
 *     <FormRow label="Part number" htmlFor="pn" required error={errors.pn}>
 *       <input id="pn" className={fieldInput} />
 *     </FormRow>
 *     <FormFooter>
 *       <button type="button" className={btnSecondary}>Cancel</button>
 *       <button type="submit" className={btnPrimary}>Send RFQ</button>
 *     </FormFooter>
 *   </FormCard>
 */
import type { ElementType, ReactNode } from "react";
import RequiredMark from "@/components/ui/RequiredMark";

/* ---- Class names (use on native elements) ---------------------------------------- */

const control = "w-full rounded-md border border-aviation-border bg-white text-[15px] text-aviation-dark outline-none transition placeholder:text-[var(--aviation-muted)] focus:border-aviation-primary focus:ring-2 focus:ring-aviation-primary/20 disabled:cursor-not-allowed disabled:bg-aviation-light disabled:opacity-70 sm:text-[13px]";

/** Text, email, number, date, tel and similar inputs. */
export const fieldInput = `${control} h-10 px-2.5 sm:h-8`;
/** Same as fieldInput, red border for a field with an error. */
export const fieldInputError = `${fieldInput} !border-red-500 focus:!ring-red-500/20`;
export const fieldSelect = `${control} h-10 px-2 sm:h-8`;
export const fieldTextarea = `${control} px-2.5 py-1.5`;
/** File inputs: a small "Choose file" button and the file name. */
export const fieldFile = "block w-full text-[13px] text-aviation-dark file:mr-3 file:h-8 file:cursor-pointer file:rounded-md file:border file:border-aviation-border file:bg-white file:px-3 file:text-[13px] file:font-semibold file:text-aviation-dark hover:file:border-aviation-primary";
export const fieldCheckbox = "h-3.5 w-3.5 shrink-0 rounded border-aviation-border accent-[var(--aviation-primary)]";
/** Label text when a label sits above its field (inside grids). */
export const fieldLabel = "mb-1 block text-[13px] font-semibold text-aviation-dark";
export const fieldHint = "mt-1 text-xs italic text-[var(--aviation-muted)]";
export const fieldError = "mt-1 text-xs font-medium text-red-600";

const button = "inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-3.5 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:h-8";
export const btnPrimary = `${button} bg-aviation-primary text-white hover:opacity-90`;
export const btnSecondary = `${button} border border-aviation-border bg-white text-aviation-dark hover:border-aviation-primary`;
export const btnGhost = `${button} text-aviation-primary hover:bg-aviation-light`;
export const btnDanger = `${button} border border-red-200 bg-white text-red-600 hover:bg-red-50`;
export const btnAccent = `${button} bg-aviation-accent text-[#062a4a] hover:brightness-95`;

/* ---- Layout components -------------------------------------------------------------- */

/** The form card: dark header with icon, title and subtitle; white body. */
export function FormCard({ icon: Icon, title, subtitle, aside, children, className = "" }: { icon?: ElementType; title: ReactNode; subtitle?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`compact-form overflow-hidden rounded-xl border border-aviation-border bg-white shadow-sm ${className}`}>
      <div className="flex flex-col gap-1 bg-aviation-dark px-5 py-4 text-white sm:flex-row sm:items-end sm:justify-between sm:px-7">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={20} aria-hidden="true" className="shrink-0" />}
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
            {subtitle && <p className="text-xs text-white/70">{subtitle}</p>}
          </div>
        </div>
        {aside && <div className="text-xs text-white/70">{aside}</div>}
      </div>
      <div className="space-y-4 px-5 py-5 sm:px-7 sm:py-6">{children}</div>
    </div>
  );
}

/** Plain white card for forms that sit inside a page that already has its own heading. */
export function FormPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`compact-form space-y-4 rounded-xl border border-aviation-border bg-white px-5 py-5 shadow-sm sm:px-7 sm:py-6 ${className}`}>{children}</div>;
}

/** Section heading inside a form, with a thin rule under it. */
export function FormSection({ title, text, action }: { title: ReactNode; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 border-b border-aviation-border pb-2 pt-1">
      <div>
        <h3 className="text-base font-bold text-aviation-primary">{title}</h3>
        {text && <p className="mt-0.5 text-xs leading-5 text-[var(--aviation-muted)]">{text}</p>}
      </div>
      {action}
    </div>
  );
}

/** One field: label on the left (desktop) or on top (phone), the control, then hint or error. */
export function FormRow({ label, htmlFor, required = false, optional = false, hint, error, errorId, children, labelWidth = "160px" }: { label: ReactNode; htmlFor?: string; required?: boolean; optional?: boolean; hint?: ReactNode; error?: ReactNode; errorId?: string; children: ReactNode; labelWidth?: string }) {
  const LabelTag = htmlFor ? "label" : "p";
  return (
    <div className="grid gap-x-5 gap-y-1 sm:grid-cols-[var(--label-w)_minmax(0,1fr)] sm:items-start" style={{ ["--label-w" as string]: labelWidth }}>
      <LabelTag {...(htmlFor ? { htmlFor } : {})} className="text-[13px] font-semibold text-aviation-dark sm:pt-1.5">
        {label}{required && <RequiredMark />}{optional && <span className="ml-1 font-normal text-[var(--aviation-muted)]">(optional)</span>}
      </LabelTag>
      <div className="min-w-0">
        {children}
        {hint && !error && <p className={fieldHint}>{hint}</p>}
        {error && <p id={errorId} role="alert" className={fieldError}>{error}</p>}
      </div>
    </div>
  );
}

/** Two or three short fields side by side inside one FormRow (e.g. quantity + unit). */
export function FieldGroup({ children, columns = 2 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];
  return <div className={`grid gap-2 ${cols}`}>{children}</div>;
}

/** Inline checkboxes in columns, like the sample form. */
export function ChoiceGroup({ label, options, value, onChange, columns = "grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3" }: { label: string; options: readonly string[]; value: string[]; onChange: (next: string[]) => void; columns?: string }) {
  const toggle = (item: string) => onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);
  return (
    <div role="group" aria-label={label} className={`grid gap-x-4 gap-y-1 sm:pt-1.5 ${columns}`}>
      {options.map((item) => (
        <label key={item} className="flex cursor-pointer items-center gap-2 py-0.5 text-[13px] text-aviation-dark">
          <input type="checkbox" checked={value.includes(item)} onChange={() => toggle(item)} className={fieldCheckbox} />
          <span>{item}</span>
        </label>
      ))}
    </div>
  );
}

/** Button bar at the bottom of a form: secondary actions left, primary right. */
export function FormFooter({ children, start }: { children: ReactNode; start?: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-aviation-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">{start}</div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">{children}</div>
    </div>
  );
}

/** Info / success / error message inside a form. */
export function FormNotice({ tone = "info", children }: { tone?: "info" | "success" | "error" | "warning"; children: ReactNode }) {
  const styles = {
    info: "border-aviation-primary/25 bg-aviation-light text-aviation-dark",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
  }[tone];
  return <div role={tone === "error" ? "alert" : "status"} className={`rounded-md border px-3 py-2 text-[13px] leading-5 ${styles}`}>{children}</div>;
}
