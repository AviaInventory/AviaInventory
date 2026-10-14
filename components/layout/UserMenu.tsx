"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  ShoppingCart,
  Store,
  UserRound,
} from "lucide-react";
import { logoutUser } from "@/lib/auth";
import type { SessionProfile } from "./useSessionProfile";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "A";
}

type MenuLink = { label: string; href: string; Icon: typeof UserRound };

function menuLinks(roles: SessionProfile["roles"]): MenuLink[][] {
  const isSupplier = roles.includes("supplier");
  const workspaces: MenuLink[] = roles.includes("admin")
    ? [{ label: "Admin dashboard", href: "/admin/dashboard", Icon: LayoutDashboard }]
    : [
        { label: "Buying dashboard", href: "/buyer/dashboard", Icon: ShoppingCart },
        ...(isSupplier ? [{ label: "Selling dashboard", href: "/supplier/dashboard", Icon: Store }] : []),
      ];
  return [
    workspaces,
    [
      { label: "Personal profile", href: "/account/profile", Icon: UserRound },
      { label: "Account settings", href: "/account/company", Icon: Settings },
      { label: "Subscription & billing", href: "/account/subscription", Icon: CreditCard },
      ...(isSupplier ? [{ label: "Supplier verification", href: "/supplier/verification", Icon: BadgeCheck }] : []),
    ],
  ];
}

/** Avatar button with the signed-in user's shortcuts and sign-out. */
export default function UserMenu({ profile, onNavigate }: { profile: SessionProfile; onNavigate?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function signOut() {
    setSigningOut(true);
    await logoutUser();
    setOpen(false);
    onNavigate?.();
    router.replace("/login");
    router.refresh();
  }

  const accountLabel = profile.roles.includes("supplier") ? "Buyer & Supplier" : profile.roles.includes("admin") ? "Administrator" : "Buyer";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#d5e0eb] bg-white py-1.5 pl-1.5 pr-3 text-sm font-semibold text-[#12304d] hover:border-[#0d5bd7]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0d5bd7] text-xs font-bold text-white">
          {initials(profile.name)}
        </span>
        <span className="hidden max-w-[140px] truncate md:inline">{profile.name}</span>
        <ChevronDown size={16} aria-hidden="true" className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-[120] mt-2 w-72 overflow-hidden rounded-xl border border-[#dbe5ef] bg-white shadow-xl">
          <div className="border-b border-[#dbe5ef] px-4 py-3">
            <p className="truncate text-sm font-bold text-[#12304d]">{profile.name}</p>
            <p className="truncate text-xs text-[#58708a]">{profile.email}</p>
            <p className="mt-1 text-xs text-[#58708a]">
              {profile.company ? `${profile.company} · ` : ""}
              {accountLabel}
            </p>
          </div>
          {menuLinks(profile.roles).map((group, index) => (
            <div key={index} className="border-b border-[#dbe5ef] py-1">
              {group.map(({ label, href, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#16324f] hover:bg-[#f2f7fc] hover:text-[#0d5bd7]"
                >
                  <Icon size={17} aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </div>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-[#b42318] hover:bg-[#fdecea] disabled:opacity-60"
          >
            <LogOut size={17} aria-hidden="true" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
