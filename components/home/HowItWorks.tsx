"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, BadgeCheck, CheckCircle2, ClipboardList, FileSignature, Globe2, PackageCheck, PackageSearch,
  Repeat2, Scale, Send, ShoppingCart, Store, Truck, Wrench,
} from "lucide-react";

type Mode = "buy" | "sell";

const WORKFLOW: Record<Mode, { icon: typeof Send; title: string; detail: string }[]> = {
  buy: [
    { icon: PackageSearch, title: "Search", detail: "Find the part or MRO" },
    { icon: Send, title: "Send RFQ", detail: "Parts or repair / overhaul" },
    { icon: Scale, title: "Compare", detail: "Quotes side by side" },
    { icon: FileSignature, title: "Accept & PO", detail: "Purchase order issued" },
    { icon: PackageCheck, title: "Receive", detail: "Track to delivery" },
  ],
  sell: [
    { icon: ClipboardList, title: "List", detail: "Parts & MRO capability" },
    { icon: Send, title: "Get RFQs", detail: "From buyers worldwide" },
    { icon: Scale, title: "Quote", detail: "Price, lead time, certs" },
    { icon: FileSignature, title: "Win the PO", detail: "Buyer accepts your quote" },
    { icon: Truck, title: "Invoice & ship", detail: "Get paid, dispatch" },
  ],
};

const PATHS = [
  {
    mode: "buy" as const,
    icon: ShoppingCart,
    eyebrow: "For airlines, operators & MROs",
    title: "Buy & Source",
    points: [
      "Source parts globally from verified, trusted suppliers",
      "One RFQ for parts or for repair / overhaul of components",
      "Compare quotations and turn the best one into a purchase order",
    ],
    cta: { label: "Start buying", href: "/register?type=buyer" },
  },
  {
    mode: "sell" as const,
    icon: Store,
    eyebrow: "For suppliers, distributors & repair stations",
    title: "Sell & Service",
    points: [
      "List your inventory and reach buyers in every region",
      "MROs receive RFQs for repair and overhaul of components",
      "Promote listings and your company with Bronze and Platinum",
    ],
    cta: { label: "Start selling", href: "/register?type=supplier" },
  },
];

/** "The Procurement Path": both sides of the marketplace, the account switch and the workflow. */
export default function HowItWorks() {
  const [mode, setMode] = useState<Mode>("buy");

  return (
    <section className="relative overflow-hidden bg-aviation-dark py-20 text-white sm:py-24">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="font-mono text-xs font-semibold tracking-[0.18em] text-aviation-accent">THE PROCUREMENT PATH</p>
          <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl md:text-5xl">Buy parts. Sell inventory. Win repair work.</h2>
          <p className="mt-5 text-lg leading-8 text-white/75">One aviation marketplace for both sides of the deal, and one account that does both.</p>
        </div>

        {/* Two paths */}
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {PATHS.map((path) => {
            const Icon = path.icon;
            const active = mode === path.mode;
            const accent = path.mode === "buy" ? "text-[#78b7ff]" : "text-aviation-accent";
            return (
              <article
                key={path.mode}
                onMouseEnter={() => setMode(path.mode)}
                className={`flex flex-col rounded-3xl border p-6 transition sm:p-8 ${active ? "border-white/40 bg-white/[0.09]" : "border-white/10 bg-white/[0.04]"}`}
              >
                <div className="flex items-center gap-4">
                  <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${path.mode === "buy" ? "bg-[#0d5bd7]" : "bg-aviation-accent text-[#062a4a]"}`}><Icon size={26} /></span>
                  <div>
                    <p className={`font-mono text-[11px] font-semibold uppercase tracking-[0.16em] ${accent}`}>{path.eyebrow}</p>
                    <h3 className="mt-1 text-2xl font-bold text-white">{path.title}</h3>
                  </div>
                </div>
                <ul className="mt-6 space-y-3">
                  {path.points.map((point) => (
                    <li key={point} className="flex gap-3 text-white/85"><CheckCircle2 size={20} className={`mt-0.5 shrink-0 ${accent}`} />{point}</li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap gap-3 pt-8">
                  <Link href={path.cta.href} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-2.5 font-semibold ${path.mode === "buy" ? "bg-[#0d5bd7] text-white hover:bg-[#084aa9]" : "bg-aviation-accent text-[#062a4a] hover:brightness-95"}`}>
                    {path.cta.label} <ArrowRight size={17} />
                  </Link>
                  <Link href="/pricing" className="inline-flex min-h-11 items-center rounded-xl border border-white/25 px-5 py-2.5 font-semibold text-white hover:bg-white/10">See plans</Link>
                </div>
              </article>
            );
          })}
        </div>

        {/* Switch + workflow */}
        <div className="mt-6 grid gap-6 rounded-3xl border border-white/10 bg-[#041d33]/80 p-6 sm:p-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-center">
          <div>
            <p className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-aviation-accent"><Repeat2 size={15} />Switch anytime</p>
            <h3 className="mt-2 text-xl font-bold text-white">One Buyer &amp; Supplier account</h3>
            <p className="mt-2 text-sm leading-6 text-white/70">Move between your buying and selling dashboards from the account menu. No second login, no second company profile.</p>
            <div role="tablist" aria-label="Show workflow for" className="mt-5 inline-flex rounded-full border border-white/15 bg-white/5 p-1">
              {(["buy", "sell"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => setMode(value)}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${mode === value ? (value === "buy" ? "bg-[#0d5bd7] text-white" : "bg-aviation-accent text-[#062a4a]") : "text-white/70 hover:text-white"}`}
                >
                  {value === "buy" ? <ShoppingCart size={16} /> : <Store size={16} />}
                  {value === "buy" ? "Buying dashboard" : "Selling dashboard"}
                </button>
              ))}
            </div>
          </div>

          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-5" aria-live="polite">
            {WORKFLOW[mode].map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 sm:flex-col sm:text-center">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${mode === "buy" ? "bg-[#0d5bd7]/30 text-[#9ccaff]" : "bg-aviation-accent/20 text-aviation-accent"}`}><Icon size={21} /></span>
                  <div>
                    <p className="font-mono text-[10px] font-bold tracking-widest text-white/50">{String(index + 1).padStart(2, "0")}</p>
                    <p className="font-semibold text-white">{step.title}</p>
                    <p className="text-xs text-white/60">{step.detail}</p>
                  </div>
                  {index < WORKFLOW[mode].length - 1 && <ArrowRight size={16} aria-hidden="true" className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 text-white/40 sm:block" />}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/60">
          <span className="flex items-center gap-2"><BadgeCheck size={16} className="text-aviation-accent" />Verified suppliers</span>
          <span className="flex items-center gap-2"><Globe2 size={16} className="text-aviation-accent" />Global sourcing</span>
          <span className="flex items-center gap-2"><Wrench size={16} className="text-aviation-accent" />Repair &amp; overhaul RFQs</span>
        </div>
      </div>
    </section>
  );
}
