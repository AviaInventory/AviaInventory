import Link from "next/link";
import { ArrowUpRight, Building2, MapPin, Megaphone, Package, Star, Wrench } from "lucide-react";
import { SupplierName } from "@/components/auth/Revealed";
import VerificationStatusBadge from "@/components/supplier/verification/VerificationStatusBadge";
import type { DirectorySupplier } from "@/lib/homepage-data";

/**
 * Supplier / MRO card. The page data never contains the company name for visitors (the
 * database withholds it), so the name is loaded for signed-in users by <SupplierName>.
 */
export default function SupplierDirectoryCard({ supplier }: { supplier: DirectorySupplier }) {
  const placeholder = (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-aviation-light text-aviation-primary" aria-hidden="true">
      {supplier.mro_capable ? <Wrench size={24} /> : <Building2 size={24} />}
    </div>
  );

  return (
    <article className="group flex flex-col rounded-[var(--aviation-radius-xl)] border border-aviation-border bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-aviation-primary/30 hover:shadow-md">
      <div className="flex flex-wrap gap-2">
        {supplier.promoted && <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4df] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#9a5b00]"><Megaphone size={12} aria-hidden="true" />Promoted</span>}
        {supplier.mro_capable && <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf2ff] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-aviation-primary"><Wrench size={12} aria-hidden="true" />MRO services</span>}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <Link href={`/suppliers/${supplier.id}`} className="flex min-w-0 items-center gap-4">
          {placeholder}
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-aviation-dark">
              <SupplierName supplierId={supplier.id} compact className="text-sm" fallback={supplier.mro_capable ? "Verified MRO" : "Verified Supplier"} />
            </h3>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-aviation-muted">{supplier.business_type || (supplier.mro_capable ? "MRO / repair station" : "Supplier profile")}</p>
          </div>
        </Link>
        <ArrowUpRight size={19} className="shrink-0 text-aviation-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-aviation-accent" />
      </div>

      <div className="mt-6 flex items-center justify-between border-y border-aviation-border py-4">
        <Link href={`/suppliers/${supplier.id}#reviews`} className="flex items-center gap-1.5 rounded-md text-sm hover:underline">
          <Star size={17} className="fill-aviation-accent text-aviation-accent" />
          <span className="font-mono font-semibold">{supplier.rating == null ? "New" : supplier.rating.toFixed(1)}</span>
          <span className="text-aviation-muted">({supplier.review_count} {supplier.review_count === 1 ? "review" : "reviews"})</span>
        </Link>
        <VerificationStatusBadge status={supplier.verification_status} compact />
      </div>

      <div className="mb-7 mt-5 space-y-3 text-sm text-aviation-muted">
        <div className="flex items-center gap-3"><MapPin size={17} />{supplier.city ? `${supplier.city}, ${supplier.country ?? ""}` : supplier.country ?? "Location not provided"}</div>
        <div className="flex items-center gap-3"><Package size={17} />{supplier.listings.toLocaleString()} active listings</div>
      </div>

      <Link href={`/suppliers/${supplier.id}`} className="mt-auto block w-full rounded-xl border border-aviation-primary py-3 text-center font-semibold text-aviation-primary transition hover:bg-aviation-primary hover:text-white">
        {supplier.mro_capable ? "View MRO profile" : "View supplier"}
      </Link>
    </article>
  );
}
