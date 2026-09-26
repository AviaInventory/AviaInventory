import type { HTMLAttributes } from "react";

export default function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={`skeleton ${className}`} {...props} />;
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-[var(--aviation-radius-xl)] border border-aviation-border bg-white">
      <div className="border-b border-aviation-border bg-aviation-light px-5 py-4"><div className="flex items-center justify-between gap-4"><Skeleton className="h-4 w-28" /><Skeleton className="h-9 w-24" /></div></div>
      <div className="divide-y divide-aviation-border">
        {Array.from({ length: rows }).map((_, row) => <div key={row} className="grid gap-5 px-5 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{Array.from({ length: columns }).map((__, column) => <Skeleton key={column} className={`h-4 ${column === 0 ? "w-28" : column === columns - 1 ? "w-20" : "w-24"}`} />)}</div>)}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: count }).map((_, index) => <div key={index} className="overflow-hidden rounded-[var(--aviation-radius-xl)] border border-aviation-border bg-white"><Skeleton className="aspect-[4/3] w-full rounded-none" /><div className="space-y-4 p-5"><div className="flex items-center justify-between gap-3"><Skeleton className="h-3 w-24" /><Skeleton className="h-6 w-16 rounded-full" /></div><Skeleton className="h-5 w-36" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /><div className="flex items-center justify-between border-t border-aviation-border pt-4"><Skeleton className="h-5 w-20" /><Skeleton className="h-9 w-24" /></div></div></div>)}</div>;
}
