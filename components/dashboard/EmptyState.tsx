import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

export default function EmptyState({ icon: Icon, eyebrow, title, description, actionLabel, actionHref }: {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[var(--aviation-radius-xl)] border border-dashed border-aviation-border bg-white px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-[var(--aviation-radius-lg)] bg-aviation-primary/10 text-aviation-primary">
        <Icon size={25} />
      </div>
      {eyebrow && <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-aviation-muted">{eyebrow}</p>}
      <h2 className="mt-2 text-xl font-semibold text-aviation-dark">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-aviation-muted">{description}</p>
      <Link href={actionHref} className="mt-6 inline-flex items-center gap-2 rounded-[var(--aviation-radius-md)] bg-aviation-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5">
        {actionLabel}<ArrowRight size={15} />
      </Link>
    </div>
  );
}
