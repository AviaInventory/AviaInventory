import { BadgeCheck, FileCheck2, GitCompareArrows, SearchCheck, Plane } from "lucide-react";

const features = [
  { icon: SearchCheck, code: "01 / FIND", title: "Part-number precision", description: "Search by exact P/N, NSN, aircraft, ATA chapter or description without losing the procurement context.", size: "lg" },
  { icon: FileCheck2, code: "02 / VERIFY", title: "Certification visibility", description: "Surface traceability, certification and documentation signals before you request a quote.", size: "md" },
  { icon: GitCompareArrows, code: "03 / COMPARE", title: "RFQs side by side", description: "Turn multiple supplier responses into a clear commercial and technical comparison.", size: "md" },
  { icon: BadgeCheck, code: "04 / TRUST", title: "Verified supply network", description: "Buy with more confidence through supplier verification and aviation-specific marketplace signals.", size: "wide" },
];

export default function WhyChooseUs() {
  return (
    <section id="about" className="bg-aviation-light py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.7fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-aviation-border bg-white px-3 py-1.5 font-code text-xs font-semibold tracking-[0.16em] text-aviation-primary"><Plane size={14} /> PROCUREMENT CONTROL</div>
            <h2 className="max-w-xl text-4xl font-bold text-aviation-dark md:text-5xl">Built around how aircraft parts are actually sourced.</h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-aviation-muted">Every interaction is designed around the signals buyers care about: exact identification, paperwork, supplier confidence and comparable offers.</p>
            <div className="mt-8 flex items-center gap-3 font-code text-xs uppercase tracking-[0.12em] text-aviation-muted"><span className="h-px w-10 bg-aviation-accent" /> FIND → VERIFY → COMPARE → TRUST</div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              const sizeClass = feature.size === "lg" ? "md:row-span-2 min-h-[360px]" : feature.size === "wide" ? "md:col-span-2 min-h-[230px]" : "min-h-[250px]";
              return (
                <article key={feature.title} className={`group relative overflow-hidden rounded-[var(--aviation-radius-xl)] border border-aviation-border bg-white p-7 shadow-[var(--aviation-shadow-sm)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--aviation-shadow-lg)] ${sizeClass}`}>
                  <div className="absolute right-0 top-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full border border-aviation-accent/20 transition duration-500 group-hover:scale-150" />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-aviation-border bg-aviation-dark text-aviation-accent shadow-[var(--aviation-shadow-sm)]"><Icon size={26} strokeWidth={1.8} /></div>
                      <span className="font-code text-[11px] font-semibold tracking-[0.14em] text-aviation-muted">{feature.code}</span>
                    </div>
                    <div className="mt-auto pt-10"><h3 className="text-2xl font-bold text-aviation-dark">{feature.title}</h3><p className="mt-3 max-w-xl leading-7 text-aviation-muted">{feature.description}</p></div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
