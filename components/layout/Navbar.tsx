"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, PlayCircle, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";
import { useSessionProfile } from "./useSessionProfile";

// RFQs live in the buying/selling dashboards; Account appears only once signed in.
const publicNavItems = [
  { label: "Home", href: "/" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "MRO Services", href: "/suppliers" },
];
const accountNavItem = { label: "Account", href: "/account/profile" };

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Menu links do not prefetch: each prefetch ran the auth checks on the server for every visible link.
export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  // undefined while the session loads: render nothing there rather than flash "Login".
  const profile = useSessionProfile();
  const navItems = profile ? [...publicNavItems, accountNavItem] : publicNavItems;

  return (
    <header className="sticky top-0 z-[100] border-b border-[#dbe5ef] bg-white/95 shadow-[0_4px_20px_rgba(6,35,63,0.08)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link prefetch={false} href="/" className="flex min-w-0 shrink-0 items-center" onClick={() => setMobileOpen(false)} aria-label="AviaInventory home">
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
              <Link prefetch={false}
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
          <Link prefetch={false}
            href="/book-demo"
            className="hidden min-h-11 items-center gap-2 rounded-lg bg-[#f4a72c] px-4 py-2 text-sm font-bold text-[#062a4a] shadow-sm hover:bg-[#e0951a] md:inline-flex"
          >
            <PlayCircle size={17} aria-hidden="true" />
            Book a Demo
          </Link>
          <Link prefetch={false}
            href="/marketplace"
            aria-label="Search marketplace"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#16324f] hover:bg-[#f2f7fc] hover:text-[#0d5bd7]"
          >
            <Search size={20} strokeWidth={2} />
          </Link>
          {profile ? (
            <>
              <NotificationBell />
              <UserMenu profile={profile} onNavigate={() => setMobileOpen(false)} />
            </>
          ) : profile === null ? (
            <>
              <Link prefetch={false}
                href="/login"
                className="hidden min-h-11 items-center rounded-lg border border-[#d5e0eb] bg-white px-5 py-2 text-sm font-semibold text-[#12304d] hover:border-[#0d5bd7] hover:text-[#0d5bd7] sm:inline-flex"
              >
                Login
              </Link>
              <Link prefetch={false}
                href="/register"
                className="hidden min-h-11 items-center rounded-lg bg-[#0d5bd7] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#084aa9] sm:inline-flex"
              >
                Get Started
              </Link>
            </>
          ) : (
            <span className="hidden h-11 w-40 sm:inline-block" aria-hidden="true" />
          )}
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
        <div className="flex items-center justify-between gap-1 overflow-x-auto px-3 py-2 sm:justify-start">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link prefetch={false}
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`shrink-0 rounded-full px-2 py-2 text-xs font-semibold min-[400px]:px-3 sm:px-4 ${active ? "bg-[#eaf2ff] text-[#0d5bd7]" : "text-[#58708a] hover:bg-[#f2f7fc]"}`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link prefetch={false}
            href="/book-demo"
            onClick={() => setMobileOpen(false)}
            className="shrink-0 rounded-full bg-[#f4a72c] px-3 py-2 text-xs font-bold text-[#062a4a] md:hidden"
          >
            Book a Demo
          </Link>
        </div>
      </div>

      {mobileOpen && profile === null && (
        <div id="mobile-site-navigation" className="border-t border-[#dbe5ef] bg-white px-4 pb-4 pt-2 shadow-lg lg:hidden">
          <div className="grid gap-2 sm:grid-cols-2">
            <Link prefetch={false} href="/book-demo" onClick={() => setMobileOpen(false)} className="rounded-xl bg-[#f4a72c] px-4 py-3 text-center text-sm font-bold text-[#062a4a] sm:col-span-2">Book a Demo</Link>
            <Link prefetch={false} href="/login" onClick={() => setMobileOpen(false)} className="rounded-xl border border-[#d5e0eb] px-4 py-3 text-center text-sm font-semibold text-[#12304d]">Login</Link>
            <Link prefetch={false} href="/register" onClick={() => setMobileOpen(false)} className="rounded-xl bg-[#0d5bd7] px-4 py-3 text-center text-sm font-semibold text-white">Get Started</Link>
          </div>
        </div>
      )}
    </header>
  );
}
