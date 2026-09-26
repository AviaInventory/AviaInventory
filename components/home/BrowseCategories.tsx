import Link from "next/link";
import {
  Plane, Cog, Radio, Boxes, CircleGauge, Droplets, Zap, ShieldCheck, ArrowUpRight,
} from "lucide-react";
import type { CategoryListingCount } from "@/lib/homepage-data";

const categories = [
  { title: "Airframes", icon: Plane, description: "Aircraft structures and assemblies", code: "ATA 51–57", tone: "primary", detail: "STRUCTURE" },
  { title: "Engines", icon: Cog, description: "Turbine & piston engine parts", code: "ATA 70–80", tone: "accent", detail: "PROPULSION" },
  { title: "Avionics", icon: Radio, description: "Navigation & communication", code: "ATA 22–34", tone: "dark", detail: "FLIGHT DECK" },
  { title: "Components", icon: Boxes, description: "Mechanical aircraft components", code: "COMPONENTS", tone: "success", detail: "ASSEMBLIES" },
  { title: "Landing Gear", icon: CircleGauge, description: "Wheels, brakes & actuators", code: "ATA 32", tone: "accent", detail: "GROUND SYSTEMS" },
  { title: "Consumables", icon: Droplets, description: "Lubricants, filters & supplies", code: "MRO STOCK", tone: "primary", detail: "MATERIALS" },
  { title: "Electrical", icon: Zap, description: "Electrical & lighting systems", code: "ATA 24–33", tone: "dark", detail: "POWER" },
  { title: "Safety Equipment", icon: ShieldCheck, description: "Emergency & safety products", code: "ATA 25", tone: "success", detail: "SAFETY" },
];

const toneClass: Record<string, string> = {
  primary: "bg-aviation-primary", accent: "bg-aviation-accent", dark: "bg-aviation-dark", success: "bg-aviation-success",
};

export default function BrowseCategories({ counts }: { counts: CategoryListingCount[] }) {
  const countMap = new Map(counts.map((item) => [item.category, item.count]));

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-3 sm:mb-12 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-aviation-accent">Aircraft systems / parts taxonomy</p>
            <h2 className="mt-2 text-3xl font-bold text-aviation-primary sm:text-4xl">Browse by Category</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-aviation-muted">Navigate the supply chain by aircraft system, then narrow down by part number, manufacturer, condition or certification.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const tone = toneClass[category.tone];
            const count = countMap.get(category.title) ?? 0;
            return (
              <Link
                key={category.title}
                href={`/marketplace?category=${encodeURIComponent(category.title)}`}
                className={`group relative min-h-[220px] overflow-hidden rounded-[var(--aviation-radius-xl)] border border-aviation-border bg-aviation-light p-5 text-left transition duration-300 hover:-translate-y-1.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-aviation-primary sm:min-h-[236px] sm:p-6 ${index === 0 || index === 5 ? "lg:row-span-1" : ""}`}
              >
                <div className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:linear-gradient(var(--aviation-primary)_1px,transparent_1px),linear-gradient(90deg,var(--aviation-primary)_1px,transparent_1px)] [background-size:22px_22px]" />
                <div className={`absolute -right-10 -top-10 h-44 w-44 rounded-full ${tone} opacity-10 transition duration-500 group-hover:scale-125 group-hover:opacity-15`} />
                <div className="absolute bottom-5 right-6 font-mono text-[9px] uppercase tracking-[0.18em] text-aviation-muted/60">{category.detail}</div>
                <div className="absolute right-5 top-5 font-mono text-[10px] font-semibold tracking-widest text-aviation-muted/70">{category.code}</div>
                <div className={`relative mb-10 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${tone} text-white shadow-md transition duration-300 group-hover:rotate-[-3deg] group-hover:scale-105`}>
                  <Icon size={30} strokeWidth={1.7} />
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-aviation-accent ring-2 ring-white" />
                </div>
                <div className="relative">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-aviation-muted">SYSTEM {String(index + 1).padStart(2, "0")}</p>
                  <h3 className="mt-1 text-xl font-bold text-aviation-dark">{category.title}</h3>
                  <p className="mt-2 max-w-[220px] text-sm leading-5 text-aviation-muted">{category.description}</p>
                  <p className="mt-3 text-xs font-semibold text-aviation-primary">{count.toLocaleString()} {count === 1 ? "part" : "parts"}</p>
                </div>
                <span className="absolute bottom-5 right-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-aviation-border bg-white text-aviation-primary transition group-hover:border-aviation-accent group-hover:bg-aviation-accent group-hover:text-white"><ArrowUpRight size={15} /></span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
