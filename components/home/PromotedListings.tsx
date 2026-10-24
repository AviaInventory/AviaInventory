import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Megaphone, PackageSearch } from "lucide-react";
import { PartPrice, SupplierName } from "@/components/auth/Revealed";
import type { PromotedListing } from "@/lib/homepage-data";

/** Featured / promoted parts, services and products (replaces "Browse by Category"). */
export default function PromotedListings({ listings }: { listings: PromotedListing[] }) {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-aviation-accent">Featured on AviaInventory</p>
            <h2 className="mt-2 text-3xl font-bold text-aviation-primary sm:text-4xl">Promoted Parts, Services &amp; Products</h2>
            <p className="mt-4 text-aviation-muted">Inventory and services highlighted by suppliers and MROs across the network.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/marketplace" className="inline-flex items-center gap-2 rounded-xl border border-aviation-border px-5 py-3 font-semibold text-aviation-dark hover:bg-aviation-light">
              Browse marketplace <ArrowRight size={18} />
            </Link>
            <Link href="/supplier/marketing/featured" className="inline-flex items-center gap-2 rounded-xl bg-[#fff4df] px-5 py-3 font-semibold text-[#9a5b00] hover:bg-[#ffe9c2]">
              <Megaphone size={17} /> Promote your listings
            </Link>
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-[var(--aviation-radius-xl)] border border-dashed border-aviation-border p-10 text-center text-sm text-aviation-muted">Promoted parts and services will appear here as suppliers publish inventory.</div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {listings.map((part) => {
              const image = part.image_urls?.[0];
              return (
                <article key={part.id} className="group flex flex-col overflow-hidden rounded-[var(--aviation-radius-xl)] border border-aviation-border bg-white transition duration-300 hover:-translate-y-1 hover:border-aviation-primary/30 hover:shadow-lg">
                  <Link href={`/marketplace/${part.id}`} className="relative block aspect-[4/3] bg-aviation-light">
                    {image ? (
                      <Image src={image} alt={part.part_number} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" className="object-contain p-3 transition duration-500 group-hover:scale-105" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-aviation-muted"><PackageSearch size={40} strokeWidth={1.4} /></span>
                    )}
                    <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      {part.promoted && <span className="inline-flex items-center gap-1 rounded-full bg-[#f4a72c] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#062a4a]"><Megaphone size={11} />Promoted</span>}
                      {part.condition && <span className="rounded-full bg-aviation-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">{part.condition}</span>}
                    </span>
                  </Link>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="font-mono text-sm font-semibold text-aviation-primary">{part.part_number}</p>
                    <h3 className="mt-1 line-clamp-2 text-lg font-bold text-aviation-dark">{part.description || "Aircraft part"}</h3>
                    <p className="mt-1 text-sm text-aviation-muted">
                      {[part.manufacturer, part.category].filter(Boolean).join(" · ") || "Aviation inventory"}
                    </p>
                    <dl className="mt-4 space-y-2 border-t border-aviation-border pt-4 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-aviation-muted">Supplier</dt>
                        <dd className="min-w-0 truncate text-right font-semibold text-aviation-dark"><SupplierName supplierId={part.supplier_id} label="Sign in to view" className="text-xs" /></dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-aviation-muted">Price</dt>
                        <dd className="text-right font-bold text-aviation-primary">{part.price_type === "request_quote" ? "Request a quote" : <PartPrice partId={part.id} label="Sign in to view" className="text-xs" />}</dd>
                      </div>
                    </dl>
                    <Link href={`/marketplace/${part.id}`} className="mt-5 block rounded-xl bg-aviation-primary py-3 text-center font-semibold text-white transition hover:opacity-90">View details</Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
