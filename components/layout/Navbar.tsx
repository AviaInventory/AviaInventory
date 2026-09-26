"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Suppliers", href: "/suppliers" },
  { label: "RFQs", href: "/buyer/rfqs" },
  { label: "Account", href: "/account/profile" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] border-b border-[#dbe5ef] bg-white/95 shadow-[0_4px_20px_rgba(6,35,63,0.08)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 shrink-0 items-center" onClick={() => setMobileOpen(false)} aria-label="AviaInventory home">
          <Image
            src="/avia-wordmark.png"
            alt="AviaInventory"
            width={245}
            height={60}
            priority
            className="h-11 w-auto max-w-[205px] object-contain sm:h-12 sm:max-w-[245px]"
          />
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  active ? "text-[#0d5bd7]" : "text-[#16324f] hover:bg-[#f2f7fc] hover:text-[#0d5bd7]"
                }`}
              >
                {item.label}
                {active && <span className="absolute inset-x-4 -bottom-[1px] h-0.5 rounded-full bg-[#0d5bd7]" />}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-6">
          <Link
            href="/marketplace"
            aria-label="Search marketplace"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#16324f] hover:bg-[#f2f7fc] hover:text-[#0d5bd7]"
          >
            <Search size={20} strokeWidth={2} />
          </Link>
          <Link
            href="/login"
            className="hidden min-h-11 items-center rounded-lg border border-[#d5e0eb] bg-white px-5 py-2 text-sm font-semibold text-[#12304d] hover:border-[#0d5bd7] hover:text-[#0d5bd7] sm:inline-flex"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="hidden min-h-11 items-center rounded-lg bg-[#0d5bd7] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#084aa9] sm:inline-flex"
          >
            Get Started
          </Link>
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-site-navigation"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#d5e0eb] bg-white text-[#12304d] lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      <div className="aviation-mobile-nav border-t border-[#dbe5ef] bg-white lg:hidden">
        <div className="flex items-center gap-1 overflow-x-auto px-3 py-2">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${active ? "bg-[#eaf2ff] text-[#0d5bd7]" : "text-[#58708a] hover:bg-[#f2f7fc]"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-site-navigation" className="border-t border-[#dbe5ef] bg-white px-4 pb-4 pt-2 shadow-lg lg:hidden">
          <div className="grid gap-2 sm:grid-cols-2">
            <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-xl border border-[#d5e0eb] px-4 py-3 text-center text-sm font-semibold text-[#12304d]">Login</Link>
            <Link href="/register" onClick={() => setMobileOpen(false)} className="rounded-xl bg-[#0d5bd7] px-4 py-3 text-center text-sm font-semibold text-white">Get Started</Link>
          </div>
        </div>
      )}
    </header>
  );
}
