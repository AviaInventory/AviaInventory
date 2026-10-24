import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PlayCircle, ShoppingCart, Store } from "lucide-react";
import BookDemoOptions from "@/components/common/BookDemo";

export default function CallToAction() {
  return (
    <section className="bg-aviation-light py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative isolate overflow-hidden rounded-3xl bg-[#062a4a] text-white shadow-2xl">
          <Image src="/hero-aircraft.jpg" alt="" fill sizes="(max-width: 1280px) 100vw, 1280px" className="-z-10 object-cover object-right opacity-25" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,#062a4a_35%,rgba(6,42,74,.75)_70%,rgba(13,91,215,.55))]" />

          <div className="grid gap-10 p-7 sm:p-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-center lg:p-14">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-aviation-accent">Join the network</p>
              <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">Ready to Buy or Sell Aircraft Parts?</h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/80">
                Connect with verified suppliers, airlines, MROs, brokers and operators across the globe. Start free, upgrade when you are ready to sell more.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register?type=buyer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-[#062a4a] hover:bg-aviation-light">
                  <ShoppingCart size={18} /> Register as Buyer
                </Link>
                <Link href="/register?type=supplier" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-aviation-accent px-6 py-3 font-semibold text-[#062a4a] hover:brightness-95">
                  <Store size={18} /> Become a Supplier / MRO <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-sm sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#78b7ff]"><PlayCircle size={24} /></span>
                <div>
                  <h3 className="text-xl font-bold text-white">Book a Demo</h3>
                  <p className="text-sm text-white/70">See the platform with our team first.</p>
                </div>
              </div>
              <div className="mt-6">
                <BookDemoOptions tone="dark" />
              </div>
              <Link href="/book-demo" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#9ccaff] hover:underline">
                What the demo covers <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
