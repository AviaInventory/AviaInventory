import Link from "next/link";
import { AlertTriangle, BadgeCheck, Clock3, FileText } from "lucide-react";
import VerificationStatusBadge from "@/components/supplier/verification/VerificationStatusBadge";
import { getSupplierVerificationQueue } from "@/lib/admin-supplier-verification";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "attention", label: "Needs review", statuses: ["Submitted", "Under Review"] },
  { key: "info", label: "Awaiting supplier", statuses: ["More Information Required"] },
  { key: "draft", label: "Not submitted", statuses: ["Draft"] },
  { key: "verified", label: "Verified", statuses: ["Verified"] },
  { key: "closed", label: "Suspended / rejected", statuses: ["Suspended", "Rejected"] },
  { key: "all", label: "All", statuses: [] as string[] },
] as const;

type Props = { searchParams: Promise<{ filter?: string }> };

export default async function SupplierVerificationQueuePage({ searchParams }: Props) {
  const { filter = "attention" } = await searchParams;
  const active = FILTERS.find((item) => item.key === filter) ?? FILTERS[0];
  const queue = await getSupplierVerificationQueue();
  const rows = active.statuses.length ? queue.filter((row) => (active.statuses as readonly string[]).includes(row.verification_status)) : queue;
  const count = (statuses: readonly string[]) =>
    statuses.length ? queue.filter((row) => statuses.includes(row.verification_status)).length : queue.length;

  return (
    <main className="min-h-screen bg-aviation-light p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-aviation-success-soft text-aviation-primary">
                <BadgeCheck size={25} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-aviation-primary">Platform compliance</p>
                <h1 className="mt-1 text-3xl font-bold text-aviation-dark">Supplier verification</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--aviation-muted)]">
                  Review supplier companies and their compliance documents, then decide their verification status. Buyers see the
                  status on the supplier profile; documents and your notes stay private.
                </p>
              </div>
            </div>
            <Link href="/admin/dashboard" className="self-start rounded-xl border border-aviation-border px-4 py-2.5 text-sm font-semibold text-aviation-dark hover:bg-aviation-light lg:self-auto">
              Back to dashboard
            </Link>
          </div>
        </header>

        <nav aria-label="Filter suppliers" className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <Link
              key={item.key}
              href={`/admin/dashboard/supplier-verifications?filter=${item.key}`}
              aria-current={item.key === active.key ? "page" : undefined}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                item.key === active.key ? "border-aviation-primary bg-aviation-primary text-white" : "border-aviation-border bg-white text-aviation-dark hover:border-aviation-primary"
              }`}
            >
              {item.label} <span className="tabular-nums opacity-80">({count(item.statuses)})</span>
            </Link>
          ))}
        </nav>

        <section className="overflow-hidden rounded-2xl border border-aviation-border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-aviation-light">
                <tr>
                  <th className="px-5 py-3 font-semibold">Supplier</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Readiness</th>
                  <th className="px-5 py-3 font-semibold">Documents</th>
                  <th className="px-5 py-3 font-semibold">Submitted</th>
                  <th className="px-5 py-3 font-semibold">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aviation-border">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[var(--aviation-muted)]">
                      No suppliers in this view.
                    </td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-aviation-dark">{row.company_name}</p>
                      <p className="text-xs text-[var(--aviation-muted)]">
                        {[row.contact_name, row.email, row.country].filter(Boolean).join(" · ") || "No contact details"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <VerificationStatusBadge status={row.verification_status} compact />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-aviation-light">
                          <div className="h-full rounded-full bg-aviation-primary" style={{ width: `${row.verification_completion}%` }} />
                        </div>
                        <span className="tabular-nums text-xs font-semibold">{row.verification_completion}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="flex items-center gap-1.5 tabular-nums">
                        <FileText size={14} aria-hidden="true" />
                        {row.documents_verified}/{row.documents_total} verified
                      </p>
                      {row.documents_awaiting > 0 && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-aviation-warning">
                          <Clock3 size={13} aria-hidden="true" /> {row.documents_awaiting} awaiting review
                        </p>
                      )}
                      {(row.documents_expired > 0 || row.documents_expiring > 0) && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-aviation-error">
                          <AlertTriangle size={13} aria-hidden="true" />
                          {row.documents_expired > 0 ? `${row.documents_expired} expired` : `${row.documents_expiring} expiring ≤30 days`}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 tabular-nums text-[var(--aviation-muted)]">
                      {row.verification_submitted_at ? new Date(row.verification_submitted_at).toLocaleDateString("en-GB") : "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/dashboard/supplier-verifications/${row.id}`}
                        className="inline-flex rounded-xl bg-aviation-primary px-4 py-2 text-sm font-semibold text-white"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
