import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck, Users } from "lucide-react";

export const metadata = {
  title: "RFQs | AviaInventory",
  description: "Request aviation parts quotations from verified suppliers.",
};

export default function RFQsLandingPage() {
  return (
    <main className="min-h-screen bg-[#f4f8fc] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-[#062a4a] p-7 text-white shadow-xl sm:p-12">
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-[#78b7ff]">Request for quotation</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-5xl">Move from part search to supplier quotes.</h1>
            <p className="mt-5 text-base leading-7 text-white/75 sm:text-lg">Create structured RFQs, receive supplier responses and compare offers in one aviation-specific workflow.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0d6efd] px-6 py-3 font-semibold text-white hover:bg-[#0758c8]">Sign in to manage RFQs <ArrowRight size={17} /></Link><Link href="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white hover:bg-white/15">Create an account</Link></div>
          </div>
        </section>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <Info icon={FileText} title="Structured requests" text="Specify part numbers, quantities, conditions and required certifications." />
          <Info icon={Users} title="Verified suppliers" text="Route sourcing through the AviaInventory supplier network." />
          <Info icon={ShieldCheck} title="Clear comparisons" text="Review commercial and technical quote details before accepting an offer." />
        </div>
      </div>
    </main>
  );
}

function Info({ icon: Icon, title, text }: { icon: typeof FileText; title: string; text: string }) {
  return <article className="rounded-2xl border border-[#dbe5ef] bg-white p-6 shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf2ff] text-[#0d5bd7]"><Icon size={21} /></div><h2 className="mt-5 text-lg font-bold text-[#12304d]">{title}</h2><p className="mt-2 text-sm leading-6 text-[#61758b]">{text}</p></article>;
}
