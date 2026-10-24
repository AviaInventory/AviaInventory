"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { useSignedIn } from "./useSignedIn";

/**
 * Supplier names and prices are for signed-in users only. Until the session is known to be
 * signed in, the locked prompt is shown, so the value never flashes for visitors.
 */
export default function Gated({
  children,
  label,
  className = "",
  compact = false,
}: {
  children: React.ReactNode;
  /** e.g. "Sign in to view supplier" */
  label: string;
  className?: string;
  /** Plain inline text instead of a link (for use inside another link or a heading). */
  compact?: boolean;
}) {
  const signedIn = useSignedIn();
  const pathname = usePathname();

  if (signedIn) return <>{children}</>;

  const content = (
    <>
      <Lock size={14} aria-hidden="true" className="shrink-0" />
      {label}
    </>
  );

  if (compact) return <span className={`inline-flex items-center gap-1.5 text-aviation-primary ${className}`}>{content}</span>;

  return (
    <Link
      href={`/login?next=${encodeURIComponent(pathname || "/")}`}
      className={`inline-flex items-center gap-1.5 font-semibold text-aviation-primary hover:underline ${className}`}
    >
      {content}
    </Link>
  );
}

/** Renders children for signed-in users only (nothing while the session loads). */
export function SignedInOnly({ children }: { children: React.ReactNode }) {
  return useSignedIn() ? <>{children}</> : null;
}

/** Renders children until the user is known to be signed in (e.g. masked placeholders). */
export function SignedOutOnly({ children }: { children: React.ReactNode }) {
  return useSignedIn() ? null : <>{children}</>;
}
