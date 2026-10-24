import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SupplierDirectoryCard from "@/components/home/SupplierDirectoryCard";
import type { DirectorySupplier } from "@/lib/homepage-data";

/** Featured / promoted suppliers and MROs (promoted first, then verified, then most listings). */
export default function SupplierSpotlight({ suppliers }: { suppliers: DirectorySupplier[] }) {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-aviation-accent">Featured suppliers &amp; MROs</p>
            <h2 className="mt-2 text-3xl font-bold text-aviation-primary sm:text-4xl">Promoted Suppliers &amp; MROs</h2>
            <p className="mt-4 text-aviation-muted">Parts suppliers and repair stations with visible credentials, active inventory and a track record buyers can evaluate.</p>
          </div>
          <Link href="/suppliers" className="inline-flex items-center gap-2 self-start rounded-xl border border-aviation-border px-5 py-3 font-semibold text-aviation-dark hover:bg-aviation-light md:self-auto">
            Browse MRO services <ArrowRight size={18} />
          </Link>
        </div>

        {suppliers.length === 0 ? (
          <div className="rounded-[var(--aviation-radius-xl)] border border-dashed border-aviation-border p-10 text-center text-sm text-aviation-muted">Featured suppliers and MROs will appear here as published inventory becomes available.</div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {suppliers.map((supplier) => <SupplierDirectoryCard key={supplier.id} supplier={supplier} />)}
          </div>
        )}
      </div>
    </section>
  );
}
