import Link from "next/link";
import { Megaphone } from "lucide-react";
import PromotionsManager from "@/components/admin/PromotionsManager";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminPromotionsSnapshot } from "@/lib/admin-promotions";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  await requireAdminSession();
  const snapshot = await getAdminPromotionsSnapshot();

  return (
    <main className="min-h-screen bg-aviation-light p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-aviation-success-soft text-aviation-primary">
                <Megaphone size={25} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-aviation-primary">Homepage</p>
                <h1 className="mt-1 text-3xl font-bold text-aviation-dark">Promotions</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--aviation-muted)]">
                  Approve suppliers&apos; listing promotion requests, promote listings yourself, and choose the suppliers and MROs featured on the
                  homepage. Changes appear on the homepage and MRO Services page within a minute.
                </p>
              </div>
            </div>
            <Link href="/admin/dashboard" className="self-start rounded-xl border border-aviation-border px-4 py-2.5 text-sm font-semibold text-aviation-dark hover:bg-aviation-light lg:self-auto">
              Back to dashboard
            </Link>
          </div>
        </header>

        <PromotionsManager snapshot={snapshot} />
      </div>
    </main>
  );
}
