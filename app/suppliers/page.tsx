import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, MapPin, Package, Star } from "lucide-react";
import { getHomepageSupplierSummaries } from "@/lib/homepage-data";

export const revalidate = 60;

export const metadata = {
  title: "Verified Suppliers | AviaInventory",
  description: "Browse verified aviation parts suppliers on AviaInventory.",
};

export default async function SuppliersPage() {
  const suppliers = await getHomepageSupplierSummaries(24);

  return (
    <main className="min-h-screen bg-[#f4f8fc] py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-[#f4a72c]">Trusted supply network</p>
          <h1 className="mt-2 text-3xl font-bold text-[#062a4a] sm:text-5xl">Verified Aviation Suppliers</h1>
          <p className="mt-4 text-base leading-7 text-[#61758b] sm:text-lg">Discover aviation specialists with active inventory, visible credentials and buyer feedback.</p>
        </div>

        {suppliers.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-[#dbe5ef] bg-white p-10 text-center text-sm text-[#61758b]">Supplier profiles will appear here as published inventory becomes available.</div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {suppliers.map((supplier) => (
              <article key={supplier.id} className="group rounded-2xl border border-[#dbe5ef] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#0d5bd7]/30 hover:shadow-lg">
                <Link href={`/suppliers/${supplier.id}`} className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#dbe5ef] bg-white p-2">
                    {supplier.logo_url ? <img src={supplier.logo_url} alt={`${supplier.company_name} logo`} className="h-full w-full object-contain" /> : <Building2 className="text-[#0d5bd7]" size={28} />}
                  </div>
                  <div className="min-w-0"><h2 className="truncate font-bold text-[#12304d]">{supplier.company_name}</h2><p className="mt-1 flex items-center gap-1 text-xs text-[#16805d]"><BadgeCheck size={13} /> Verified supplier</p></div>
                </Link>
                <div className="mt-5 flex items-center gap-1 text-sm"><Star size={16} className="fill-[#f4a72c] text-[#f4a72c]" /><strong>{supplier.rating == null ? "New" : supplier.rating.toFixed(1)}</strong><span className="text-[#61758b]">({supplier.review_count} {supplier.review_count === 1 ? "review" : "reviews"})</span></div>
                <div className="mt-4 space-y-2 text-xs text-[#61758b]">
                  <p className="flex items-center gap-2"><MapPin size={14} />{supplier.city ? `${supplier.city}, ${supplier.country ?? ""}` : supplier.country ?? "Global"}</p>
                  <p className="flex items-center gap-2"><Package size={14} />{supplier.listings.toLocaleString()} active listings</p>
                </div>
                <Link href={`/suppliers/${supplier.id}`} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#0d5bd7] px-4 py-2.5 text-sm font-semibold text-[#0d5bd7] hover:bg-[#0d5bd7] hover:text-white">View supplier <ArrowRight size={15} /></Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
