"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  LogOut,
  Search,
  Settings,
  UserCircle,
} from "lucide-react";

import { logoutUser } from "@/lib/auth";
import RoleSwitcher from "@/components/account/RoleSwitcher";

export default function DashboardHeader() {
  const router = useRouter();

  async function handleLogout() {
    const result = await logoutUser();

    if (result.success) {
      router.push("/login");
    }
  }

  return (
    <header className="border-b bg-white shadow-sm">

      <div className="mx-auto flex min-w-0 max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:py-4">

        {/* Logo */}

        <Link
          href="/buyer/dashboard"
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-aviation-primary text-lg font-bold text-white">
            A
          </div>

          <div>

            <h1 className="text-xl font-bold text-aviation-primary">
              AviaInventory
            </h1>

            <p className="text-xs text-aviation-muted">
              Buyer Dashboard
            </p>

          </div>

        </Link>

        <div className="hidden xl:block">
          <RoleSwitcher active="buyer" />
        </div>

        {/* Search */}

        <div className="hidden min-w-0 flex-1 px-2 lg:block xl:max-w-xl xl:px-8">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-aviation-muted"
            />

            <input
              type="text"
              placeholder="Search by Part Number, NSN, Description..."
              className="w-full rounded-xl border border-aviation-border py-3 pl-11 pr-4 outline-none transition focus:border-aviation-border"
            />

          </div>

        </div>

        {/* Right Side */}

        <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-4 xl:gap-5">

          <button className="relative rounded-xl p-2 transition hover:bg-aviation-light">

            <Bell size={22} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-aviation-error" />

          </button>

          <button className="rounded-xl p-2 transition hover:bg-aviation-light">

            <Settings size={22} />

          </button>

          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-aviation-border px-2 py-2 sm:gap-3 sm:px-3">

            <UserCircle
              size={34}
              className="text-aviation-primary"
            />

            <div className="hidden text-left md:block">

              <p className="font-semibold">
                Welcome
              </p>

              <p className="text-sm text-aviation-muted">
                Buyer Account
              </p>

            </div>

          </div>

          <button
            onClick={handleLogout}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-aviation-error px-3 py-2 font-medium text-white transition hover:bg-aviation-error sm:px-4"
          >
            <LogOut size={18} />

            Logout
          </button>

        </div>

      </div>

    </header>
  );
}