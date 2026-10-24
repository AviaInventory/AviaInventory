import Link from "next/link";
import { ArrowRight, Store, Wrench } from "lucide-react";
import SupplierDirectoryCard from "@/components/home/SupplierDirectoryCard";
import { getSupplierDirectory } from "@/lib/homepage-data";

export const revalidate = 60;

export const metadata = {
  title: "MRO Services | AviaInventory",
  description: "Find MRO and repair stations for repair and overhaul of aircraft components, and request repair quotes on AviaInventory.",
};

/** MRO Services: suppliers who ticked MRO (repair / overhaul) capability. */
export default async function MROServicesPage() {
  const suppliers = await getSupplierDirectory(48, true);

  return (
    <main className="min-h-screen bg-aviation-light py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-[#062a4a] p-7 text-white shadow-xl sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-aviation-accent">Repair &amp; overhaul network</p>
              <h1 className="mt-2 text-3xl font-bold text-white sm:text-5xl">MRO Services</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
                Repair stations and MROs that repair and overhaul aircraft components. Send one MRO services RFQ and receive quotes from capable shops.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/buyer/rfqs/new?type=mro" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-aviation-accent px-6 py-3 font-semibold text-[#062a4a] hover:brightness-95">
                <Wrench size={18} /> Request a repair / overhaul quote <ArrowRight size={17} />
              </Link>
              <Link href="/register?type=supplier" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3 font-semibold text-white hover:bg-white/15">
                <Store size={18} /> List your MRO capability
              </Link>
              <p className="text-center text-xs text-white/60">Already selling on AviaInventory? Turn on MRO services in Account settings → Company.</p>
            </div>
          </div>
        </section>

        {suppliers.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-aviation-border bg-white p-10 text-center">
            <Wrench className="mx-auto text-aviation-primary" size={32} />
            <h2 className="mt-4 text-lg font-bold text-aviation-dark">No MRO providers listed yet</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-aviation-muted">Suppliers with repair and overhaul capability will appear here. You can still send an MRO services RFQ and it will reach them as they join.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {suppliers.map((supplier) => <SupplierDirectoryCard key={supplier.id} supplier={supplier} />)}
          </div>
        )}
      </div>
    </main>
  );
}
