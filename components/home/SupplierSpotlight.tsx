import Link from "next/link";
import { BadgeCheck, MapPin, Package, Star, ArrowUpRight } from "lucide-react";
import VerificationStatusBadge from "@/components/supplier/verification/VerificationStatusBadge";
import type { SupplierSummary } from "@/lib/homepage-data";

const fallbackTone: Record<string, string> = { primary: "bg-aviation-primary", accent: "bg-aviation-accent", dark: "bg-aviation-dark" };
function initials(name: string) { return name.split(" ").filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase(); }

export default function SupplierSpotlight({ suppliers }: { suppliers: SupplierSummary[] }) {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-14 text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-aviation-accent">Trusted supply network</p>
          <h2 className="mt-2 text-4xl font-bold text-aviation-primary">Verified Suppliers</h2>
          <p className="mx-auto mt-4 max-w-2xl text-aviation-muted">Aviation specialists with visible credentials, active inventory and a track record buyers can evaluate.</p>
        </div>

        {suppliers.length === 0 ? (
          <div className="rounded-[var(--aviation-radius-xl)] border border-dashed border-aviation-border p-10 text-center text-sm text-aviation-muted">Verified suppliers will appear here as published inventory becomes available.</div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {suppliers.map((supplier) => (
              <article key={supplier.id} className="group rounded-[var(--aviation-radius-xl)] border border-aviation-border bg-white p-7 transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-aviation-primary/30 hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/suppliers/${supplier.id}`} className="flex min-w-0 items-center gap-4">
                    {supplier.logo_url ? <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-aviation-border bg-white p-2"><img src={supplier.logo_url} alt={`${supplier.company_name} logo`} className="h-full w-full object-contain" /></div> : <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${fallbackTone[supplier.tone]} text-lg font-bold text-white shadow-sm`} aria-label={`${supplier.company_name} logo placeholder`}><span>{initials(supplier.company_name)}</span><span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-aviation-success text-white"><BadgeCheck size={12} /></span></div>}
                    <div className="min-w-0"><h3 className="truncate text-lg font-bold text-aviation-dark">{supplier.company_name}</h3><p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-aviation-muted">Supplier profile</p></div>
                  </Link>
                  <ArrowUpRight size={19} className="shrink-0 text-aviation-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-aviation-accent" />
                </div>

                <div className="mt-7 flex items-center justify-between border-y border-aviation-border py-4">
                  <Link href={`/suppliers/${supplier.id}#reviews`} className="flex items-center gap-1.5 rounded-md text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-aviation-primary" aria-label={`View ${supplier.company_name} reviews`}>
                    <Star size={17} className="fill-aviation-accent text-aviation-accent" />
                    <span className="font-mono font-semibold">{supplier.rating == null ? "New" : supplier.rating.toFixed(1)}</span>
                    <span className="text-aviation-muted">({supplier.review_count} {supplier.review_count === 1 ? "review" : "reviews"})</span>
                  </Link>
                  <VerificationStatusBadge status={supplier.verification_status} compact />
                </div>

                <div className="mt-5 space-y-3 text-sm text-aviation-muted">
                  <div className="flex items-center gap-3"><MapPin size={17} />{supplier.city ? `${supplier.city}, ${supplier.country ?? ""}` : supplier.country ?? "Location not provided"}</div>
                  <div className="flex items-center gap-3"><Package size={17} />{supplier.listings.toLocaleString()} active listings</div>
                </div>

                <Link href={`/suppliers/${supplier.id}`} className="mt-7 block w-full rounded-xl border border-aviation-primary py-3 text-center font-semibold text-aviation-primary transition hover:bg-aviation-primary hover:text-white">View Supplier</Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
