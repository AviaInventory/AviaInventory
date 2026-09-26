"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Globe2, ShieldCheck, Wrench, Headphones } from "lucide-react";
import PartSearchAutocomplete from "@/components/search/PartSearchAutocomplete";

const searchExamples = [
  "BACB30LN3K3",
  "Dash 8 brake assembly",
  "Honeywell actuator",
  "AeroShell W100",
];

export default function Hero() {
  const [exampleIndex, setExampleIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setExampleIndex((current) => (current + 1) % searchExamples.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-[#062a4a] text-white">
      <Image src="/hero-aircraft.jpg" alt="Commercial aircraft on the runway" fill priority className="object-cover object-center lg:object-right" sizes="100vw" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,32,57,.98)_0%,rgba(3,38,68,.94)_42%,rgba(3,38,68,.52)_72%,rgba(3,38,68,.2)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,32,57,.1),rgba(3,32,57,.35))]" />

      <div className="relative mx-auto max-w-[1440px] px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20 xl:py-24">
        <div className="max-w-[760px]">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-[#78b7ff] sm:text-sm">Global Aviation Parts Marketplace</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl xl:text-[68px]">
            Find the Right Aircraft Parts, <span className="text-[#62a6ff]">Faster.</span>
          </h1>
          <p className="mt-5 text-base leading-7 text-white/85 sm:text-lg">
            Trusted suppliers <span className="mx-2 text-[#f4a72c]">•</span> Genuine parts <span className="mx-2 text-[#f4a72c]">•</span> Global reach
          </p>

          <div className="mt-8 max-w-[690px] rounded-2xl bg-white p-2 shadow-[0_20px_60px_rgba(0,0,0,.25)]">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="min-w-0 flex-1 rounded-xl border border-[#d8e3ee] bg-[#f7fafc]">
                <PartSearchAutocomplete
                  placeholder={`Search by part number, manufacturer or NSN...`}
                  className="w-full"
                  inputClassName="border-0 bg-transparent py-4 text-sm shadow-none focus:ring-0 sm:text-base"
                />
              </div>
              <Link href="/marketplace" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0d6efd] px-7 py-3 font-semibold text-white shadow-sm hover:bg-[#0758c8]">
                Search
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
            <span>Try:</span>
            {searchExamples.slice(0, 3).map((item) => <span key={item} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-mono">{item}</span>)}
          </div>

          <div className="mt-10 grid gap-5 border-t border-white/15 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <Feature icon={ShieldCheck} title="Verified Suppliers" detail="Trusted & vetted" />
            <Feature icon={Globe2} title="Global Inventory" detail="Worldwide access" />
            <Feature icon={Wrench} title="Secure Transactions" detail="Protected & compliant" />
            <Feature icon={Headphones} title="24/7 Support" detail="Always here" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon: Icon, title, detail }: { icon: typeof ShieldCheck; title: string; detail: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#64a9ff]/40 bg-[#0b5bb7]/35 text-[#70b4ff]"><Icon size={22} /></span>
      <div className="min-w-0"><p className="text-sm font-semibold text-white">{title}</p><p className="mt-0.5 text-xs text-white/60">{detail}</p></div>
    </div>
  );
}
