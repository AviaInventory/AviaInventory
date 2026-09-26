"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FileText,
  ClipboardList,
  Store,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const navigation = [
  {
    name: "Dashboard",
    href: "/supplier/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Inventory",
    href: "/supplier/inventory",
    icon: Package,
  },
  {
    name: "RFQs",
    href: "/supplier/rfqs",
    icon: ClipboardList,
  },
  {
    name: "Quotations",
    href: "/supplier/quotes",
    icon: FileText,
  },
];

export default function SupplierHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("LOGOUT ERROR:", error);
      setLoggingOut(false);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* ==========================================================
          TOP HEADER
      ========================================================== */}

      <header className="sticky top-0 z-50 border-b border-aviation-border bg-white shadow-sm">

        <div className="mx-auto max-w-7xl px-6">

          <div className="flex h-20 items-center justify-between">

            {/* ======================================================
                LOGO
            ====================================================== */}

            <Link
              href="/supplier/dashboard"
              className="flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-aviation-primary text-xl font-bold text-white">
                A
              </div>

              <div className="hidden sm:block">
                <div className="text-xl font-bold tracking-tight text-aviation-primary">
                  AviaInventory
                </div>

                <div className="text-xs font-medium text-aviation-muted">
                  Global Aviation Marketplace
                </div>
              </div>
            </Link>

            {/* ======================================================
                DESKTOP NAVIGATION
            ====================================================== */}

            <nav className="hidden items-center gap-1 lg:flex">

              {navigation.map((item) => {

                const Icon = item.icon;

                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-aviation-primary text-white"
                        : "text-aviation-muted hover:bg-aviation-light hover:text-aviation-primary"
                    }`}
                  >
                    <Icon size={17} />

                    {item.name}
                  </Link>
                );
              })}

            </nav>

            {/* ======================================================
                RIGHT SIDE
            ====================================================== */}

            <div className="hidden items-center gap-3 lg:flex">

              {/* Marketplace */}

              <Link
                href="/marketplace"
                className="flex items-center gap-2 rounded-xl border border-aviation-border px-4 py-2.5 text-sm font-medium text-aviation-dark transition hover:border-aviation-border hover:text-aviation-primary"
              >
                <Store size={17} />

                Marketplace
              </Link>

              {/* Logout */}

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 rounded-xl border border-aviation-border px-4 py-2.5 text-sm font-medium text-aviation-error transition hover:bg-aviation-error-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut size={17} />

                {loggingOut ? "Logging out..." : "Logout"}
              </button>

            </div>

            {/* ======================================================
                MOBILE MENU BUTTON
            ====================================================== */}

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-xl border border-aviation-border p-2.5 text-aviation-dark lg:hidden"
            >
              {mobileOpen ? (
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}
            </button>

          </div>

        </div>

        {/* ==========================================================
            MOBILE NAVIGATION
        ========================================================== */}

        {mobileOpen && (

          <div className="border-t border-aviation-border bg-white lg:hidden">

            <div className="mx-auto max-w-7xl px-6 py-4">

              <nav className="space-y-1">

                {navigation.map((item) => {

                  const Icon = item.icon;

                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                        active
                          ? "bg-aviation-primary text-white"
                          : "text-aviation-dark hover:bg-aviation-light"
                      }`}
                    >
                      <Icon size={18} />

                      {item.name}
                    </Link>
                  );
                })}

              </nav>

              <div className="mt-4 border-t border-aviation-border pt-4">

                <Link
                  href="/marketplace"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-aviation-dark hover:bg-aviation-light"
                >
                  <Store size={18} />

                  Back to Marketplace
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-aviation-error hover:bg-aviation-error-soft disabled:opacity-50"
                >
                  <LogOut size={18} />

                  {loggingOut
                    ? "Logging out..."
                    : "Logout"}
                </button>

              </div>

            </div>

          </div>

        )}

      </header>
    </>
  );
}