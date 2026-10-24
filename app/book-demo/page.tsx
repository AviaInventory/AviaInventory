import type { Metadata } from "next";
import { PlayCircle, ShoppingCart, Store, Wrench } from "lucide-react";
import BookDemoOptions from "@/components/common/BookDemo";
import Footer from "@/components/layout/Footer";
import { DEMO_EMAIL, SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Book a Demo | AviaInventory",
  description: "See how AviaInventory helps you buy aircraft parts, sell inventory and win MRO repair work. Book a free demo with our team.",
};

const TOPICS = [
  { icon: ShoppingCart, title: "Buying & sourcing", text: "Search global inventory, send RFQs and compare quotations side by side." },
  { icon: Store, title: "Selling parts", text: "List inventory, answer RFQs and turn accepted quotes into purchase orders." },
  { icon: Wrench, title: "MRO services", text: "Receive repair and overhaul RFQs from operators that need your capability." },
];

export default function BookDemoPage() {
  return (
    <>
      <main className="min-h-screen bg-aviation-light py-10 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <section className="overflow-hidden rounded-3xl bg-[#062a4a] p-7 text-white shadow-xl sm:p-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#78b7ff]">
              <PlayCircle size={26} aria-hidden="true" />
            </div>
            <p className="mt-6 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-[#78b7ff]">Book a demo</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-bold text-white sm:text-5xl">See {SITE.name} working for your business.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
              A short, free walkthrough with our team, tailored to how you buy parts, sell inventory or offer MRO services.
              Tell us a convenient time and we&apos;ll confirm.
            </p>
            <div className="mt-8 max-w-xl">
              <BookDemoOptions tone="dark" />
            </div>
            <p className="mt-4 text-sm text-white/60">
              Email {DEMO_EMAIL} · WhatsApp {SITE.phone}
            </p>
          </section>

          <section className="mt-6 grid gap-5 md:grid-cols-3">
            {TOPICS.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-aviation-border bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf2ff] text-aviation-primary">
                  <Icon size={21} aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-lg font-bold text-aviation-dark">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-aviation-muted">{text}</p>
              </article>
            ))}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
