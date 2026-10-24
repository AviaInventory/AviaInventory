"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2, Megaphone, Search, Star, Wrench } from "lucide-react";
import type { AdminPromotionsSnapshot, PromotableListingRow } from "@/lib/admin-promotions";

const PAGE_SIZE = 25;

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Default end date shown in the date pickers: 30 days from today (YYYY-MM-DD). */
function defaultEndDate() {
  return new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
}

async function patch(url: string, body: unknown) {
  const response = await fetch(url, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "Unable to save the change.");
}

/** Platform console: approve listing promotion requests, promote listings, feature suppliers / MROs. */
export default function PromotionsManager({ snapshot }: { snapshot: AdminPromotionsSnapshot }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function run(key: string, url: string, body: unknown, done: string) {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await patch(url, body);
      setNotice(done);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save the change.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {(error || notice) && (
        <p role="status" className={`rounded-xl border px-4 py-3 text-sm font-medium ${error ? "border-aviation-error/30 bg-aviation-error-soft text-aviation-error" : "border-aviation-success/30 bg-aviation-success-soft text-aviation-success"}`}>
          {error || notice}
        </p>
      )}
      <Requests snapshot={snapshot} busy={busy} run={run} />
      <Listings listings={snapshot.listings} busy={busy} run={run} />
      <Suppliers snapshot={snapshot} busy={busy} run={run} />
    </div>
  );
}

type Run = (key: string, url: string, body: unknown, done: string) => Promise<void>;

function SectionHeader({ icon: Icon, title, description }: { icon: typeof Star; title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-aviation-success-soft text-aviation-primary"><Icon size={20} /></span>
      <div>
        <h2 className="text-xl font-bold text-aviation-dark">{title}</h2>
        <p className="mt-1 text-sm text-[var(--aviation-muted)]">{description}</p>
      </div>
    </div>
  );
}

function Requests({ snapshot, busy, run }: { snapshot: AdminPromotionsSnapshot; busy: string | null; run: Run }) {
  const [endDates, setEndDates] = useState<Record<string, string>>({});
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <SectionHeader icon={Megaphone} title="Listing promotion requests" description="Suppliers on Bronze or Platinum ask to feature listings from their marketing workspace. Approved listings appear in the homepage promoted section." />
      {snapshot.requests.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-aviation-border p-6 text-center text-sm text-[var(--aviation-muted)]">No pending requests.</p>
      ) : (
        <div className="mt-6 aviation-table-wrap">
          <table className="w-full text-sm">
            <thead className="bg-aviation-light text-left">
              <tr>{["Listing", "Supplier", "Requested", "Promote until", ""].map((heading) => <th key={heading} className="px-4 py-3 font-semibold text-aviation-dark">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {snapshot.requests.map((request) => {
                const endDate = endDates[request.id] ?? defaultEndDate();
                return (
                  <tr key={request.id} className="border-t border-aviation-border align-top">
                    <td className="px-4 py-4"><p className="font-mono font-semibold text-aviation-primary">{request.part_number}</p><p className="mt-1 max-w-xs truncate text-[var(--aviation-muted)]">{request.description || "—"}</p></td>
                    <td className="px-4 py-4 text-aviation-dark">{request.supplier_name}</td>
                    <td className="px-4 py-4 text-aviation-dark">{formatDate(request.requested_at)}</td>
                    <td className="px-4 py-4">
                      <input type="date" value={endDate} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setEndDates((current) => ({ ...current, [request.id]: event.target.value }))} className="rounded-lg border border-aviation-border px-3 py-2 text-aviation-dark" aria-label={`Promote ${request.part_number} until`} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" disabled={busy !== null} onClick={() => run(`request-${request.id}`, `/api/admin/promotions/requests/${request.id}`, { decision: "decline" }, `Request for ${request.part_number} declined.`)} className="rounded-lg border border-aviation-border px-3 py-2 font-semibold text-aviation-dark hover:bg-aviation-light disabled:opacity-50">Decline</button>
                        <button type="button" disabled={busy !== null} onClick={() => run(`request-${request.id}`, `/api/admin/promotions/requests/${request.id}`, { decision: "approve", endDate }, `${request.part_number} is now promoted on the homepage.`)} className="inline-flex items-center gap-2 rounded-lg bg-aviation-primary px-3 py-2 font-semibold text-white disabled:opacity-50">
                          {busy === `request-${request.id}` && <Loader2 size={14} className="animate-spin" />}Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Listings({ listings, busy, run }: { listings: PromotableListingRow[]; busy: string | null; run: Run }) {
  const [query, setQuery] = useState("");
  const [onlyPromoted, setOnlyPromoted] = useState(false);
  const [page, setPage] = useState(1);
  const [endDate, setEndDate] = useState(defaultEndDate);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return listings.filter((listing) =>
      (!onlyPromoted || listing.promoted) &&
      (!text || [listing.part_number, listing.description, listing.manufacturer, listing.supplier_name].some((value) => value?.toLowerCase().includes(text))));
  }, [listings, query, onlyPromoted]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((Math.min(page, pages) - 1) * PAGE_SIZE, Math.min(page, pages) * PAGE_SIZE);
  const promotedCount = listings.filter((listing) => listing.promoted).length;

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <SectionHeader icon={Star} title="Promoted listings" description={`Choose published listings to feature in "Promoted Parts, Services & Products" on the homepage. ${promotedCount} currently promoted.`} />
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--aviation-muted)]" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search part number, description or supplier" className="w-full rounded-xl border border-aviation-border py-2.5 pl-9 pr-3 text-sm text-aviation-dark" />
        </label>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-aviation-dark"><input type="checkbox" checked={onlyPromoted} onChange={(event) => { setOnlyPromoted(event.target.checked); setPage(1); }} />Promoted only</label>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-aviation-dark">New promotions run until
          <input type="date" value={endDate} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setEndDate(event.target.value)} className="rounded-lg border border-aviation-border px-3 py-2" />
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-aviation-border p-6 text-center text-sm text-[var(--aviation-muted)]">No published listings match.</p>
      ) : (
        <div className="mt-6 aviation-table-wrap">
          <table className="w-full text-sm">
            <thead className="bg-aviation-light text-left">
              <tr>{["Listing", "Supplier", "Status", ""].map((heading) => <th key={heading} className="px-4 py-3 font-semibold text-aviation-dark">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {visible.map((listing) => (
                <tr key={listing.id} className="border-t border-aviation-border">
                  <td className="px-4 py-3"><p className="font-mono font-semibold text-aviation-primary">{listing.part_number}</p><p className="mt-0.5 max-w-sm truncate text-[var(--aviation-muted)]">{listing.description || listing.manufacturer || "—"}</p></td>
                  <td className="px-4 py-3 text-aviation-dark">{listing.supplier_name}</td>
                  <td className="px-4 py-3">
                    {listing.promoted
                      ? <span className="inline-flex rounded-full bg-aviation-success-soft px-2.5 py-1 text-xs font-bold text-aviation-success">Promoted until {formatDate(listing.promotion?.ends_at ?? null)}</span>
                      : <span className="text-xs text-[var(--aviation-muted)]">Not promoted</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => run(`listing-${listing.id}`, `/api/admin/promotions/listings/${listing.id}`, listing.promoted ? { promote: false } : { promote: true, endDate }, listing.promoted ? `Stopped promoting ${listing.part_number}.` : `${listing.part_number} is now promoted on the homepage.`)}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 font-semibold disabled:opacity-50 ${listing.promoted ? "border border-aviation-border text-aviation-dark hover:bg-aviation-light" : "bg-aviation-primary text-white"}`}
                    >
                      {busy === `listing-${listing.id}` && <Loader2 size={14} className="animate-spin" />}
                      {listing.promoted ? "Stop promoting" : "Promote"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-aviation-border px-3 py-1.5 disabled:opacity-40">Previous</button>
          <span className="text-[var(--aviation-muted)]">Page {Math.min(page, pages)} of {pages}</span>
          <button type="button" disabled={page >= pages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-aviation-border px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      )}
    </section>
  );
}

function Suppliers({ snapshot, busy, run }: { snapshot: AdminPromotionsSnapshot; busy: string | null; run: Run }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <SectionHeader icon={Wrench} title="Featured suppliers & MROs" description='"Featured on homepage" lists the company in "Promoted Suppliers & MROs" (suppliers whose plan includes featured listings appear there too). "MRO capable" lists it on the MRO Services page and sends it MRO service RFQs.' />
      {snapshot.suppliers.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-aviation-border p-6 text-center text-sm text-[var(--aviation-muted)]">No suppliers yet.</p>
      ) : (
        <div className="mt-6 aviation-table-wrap">
          <table className="w-full text-sm">
            <thead className="bg-aviation-light text-left">
              <tr>{["Supplier", "Business type", "Verification", "Listings", "Featured on homepage", "MRO capable"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold text-aviation-dark">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {snapshot.suppliers.map((supplier) => (
                <tr key={supplier.id} className="border-t border-aviation-border">
                  <td className="px-4 py-3 font-semibold text-aviation-dark">{supplier.company_name}</td>
                  <td className="px-4 py-3 text-aviation-dark">{supplier.business_type || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-aviation-dark">{supplier.verification_status === "Verified" && <BadgeCheck size={14} className="text-aviation-success" />}{supplier.verification_status}</span>
                  </td>
                  <td className="px-4 py-3 text-aviation-dark">{supplier.listing_count}</td>
                  <td className="px-4 py-3">
                    <Toggle label={`Feature ${supplier.company_name} on the homepage`} checked={supplier.featured} busy={busy === `featured-${supplier.id}`} disabled={busy !== null}
                      onChange={(value) => run(`featured-${supplier.id}`, `/api/admin/promotions/suppliers/${supplier.id}`, { flag: "featured", value }, value ? `${supplier.company_name} is featured on the homepage.` : `${supplier.company_name} is no longer featured.`)} />
                  </td>
                  <td className="px-4 py-3">
                    <Toggle label={`${supplier.company_name} offers MRO services`} checked={supplier.mro_capable} busy={busy === `mro_capable-${supplier.id}`} disabled={busy !== null}
                      onChange={(value) => run(`mro_capable-${supplier.id}`, `/api/admin/promotions/suppliers/${supplier.id}`, { flag: "mro_capable", value }, value ? `${supplier.company_name} is listed as an MRO.` : `${supplier.company_name} is no longer listed as an MRO.`)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Toggle({ label, checked, busy, disabled, onChange }: { label: string; checked: boolean; busy: boolean; disabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-60 ${checked ? "bg-aviation-primary" : "bg-aviation-border"}`}
    >
      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition ${checked ? "translate-x-6" : "translate-x-1"}`}>
        {busy && <Loader2 size={12} className="animate-spin text-aviation-primary" />}
      </span>
    </button>
  );
}
