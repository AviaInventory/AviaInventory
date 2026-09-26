import type { ReactNode } from "react";

export default function SectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-4 border-b border-aviation-border pb-5 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow && <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aviation-primary">{eyebrow}</p>}
      <h1 className="mt-1 text-2xl font-semibold text-aviation-dark sm:text-3xl">{title}</h1>
      {description && <p className="mt-1.5 max-w-2xl text-sm text-aviation-muted">{description}</p>}
    </div>
    <div className="w-full shrink-0 sm:w-auto">{action}</div>
  </div>;
}
