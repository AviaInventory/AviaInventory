import { Search, FileCheck2, MessageSquareQuote, Handshake } from "lucide-react";

const steps = [
  { number: "01", icon: Search, title: "Identify the part", description: "Start with a P/N, aircraft, NSN or description and narrow the search to the exact item." },
  { number: "02", icon: FileCheck2, title: "Check the evidence", description: "Review specifications, condition, certification signals and supplier documentation." },
  { number: "03", icon: MessageSquareQuote, title: "Open the RFQ", description: "Send one structured request to the suppliers that can actually satisfy the requirement." },
  { number: "04", icon: Handshake, title: "Compare & close", description: "Evaluate offers, align on commercial terms and move the selected part into procurement." },
];

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-aviation-dark py-24 text-white">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-16 max-w-2xl"><div className="mb-5 font-code text-xs font-semibold tracking-[0.18em] text-aviation-accent">THE PROCUREMENT PATH</div><h2 className="text-4xl font-bold md:text-5xl">From part number to purchase order.</h2><p className="mt-5 text-lg leading-8 text-white/65">A traceable workflow built for the decisions that happen between an aircraft on ground and the right part in hand.</p></div>
        <div className="relative">
          <div className="absolute left-[7%] right-[7%] top-[47px] hidden h-px bg-gradient-to-r from-aviation-accent/10 via-aviation-accent to-aviation-accent/10 lg:block" />
          <div className="grid gap-12 lg:grid-cols-4 lg:gap-8">
            {steps.map((step) => { const Icon = step.icon; return (
              <article key={step.number} className="relative">
                <div className="relative z-10 flex items-center gap-4"><div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-aviation-accent/70 bg-aviation-dark shadow-[0_0_0_10px_rgba(22,35,43,1)]"><div className="text-center"><div className="font-code text-xs font-bold tracking-widest text-aviation-accent">{step.number}</div><Icon className="mx-auto mt-1 text-white" size={25} strokeWidth={1.7} /></div></div><div className="h-px flex-1 bg-white/10 lg:hidden" /></div>
                <div className="mt-7 border-l border-white/10 pl-6 lg:border-l-0 lg:pl-0"><h3 className="text-2xl font-bold">{step.title}</h3><p className="mt-3 leading-7 text-white/60">{step.description}</p></div>
              </article>
            ); })}
          </div>
        </div>
      </div>
    </section>
  );
}
