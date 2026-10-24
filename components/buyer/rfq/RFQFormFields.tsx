/* Shared building blocks for the RFQ forms. */

/* ==========================================================
   FORM FIELD
========================================================== */

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>

      <label className="mb-2 block font-medium text-aviation-dark">

        {label}

        {required && (
          <span className="ml-1 text-aviation-error">
            *
          </span>
        )}

      </label>

      {children}

      {hint && (
        <p className="mt-1.5 text-xs text-aviation-muted">
          {hint}
        </p>
      )}

    </div>
  );
}

/* ==========================================================
   INPUT STYLE
========================================================== */

export const inputClass =
  "w-full rounded-xl border border-aviation-border bg-white p-3 text-aviation-dark outline-none transition placeholder:text-aviation-muted focus:border-aviation-border focus:ring-2 focus:ring-aviation-primary disabled:cursor-not-allowed disabled:bg-aviation-light";
