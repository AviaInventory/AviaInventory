"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import toast from "react-hot-toast";
import EmptyState from "@/components/dashboard/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";

import {
  deletePart,
  getListingLifecycleContext,
  getSupplierParts,
  transitionListingStatus,
  type ListingLifecycleContext,
  type ListingStatus,
  type Part,
} from "@/lib/parts";
import ListingLifecycleModal from "./ListingLifecycleModal";

type LifecycleAction = "delete" | "inactive" | "archive" | "publish" | "reserve" | "sold";

function actionFor(status: string): LifecycleAction[] {
  switch (status) {
    case "Draft": return ["publish", "delete"];
    case "Published": return ["inactive", "archive"];
    case "Reserved": return ["publish", "sold", "inactive"];
    case "Sold": return ["archive"];
    case "Inactive": return ["publish", "archive"];
    default: return [];
  }
}

const actionLabel: Record<LifecycleAction, string> = {
  delete: "Delete draft",
  inactive: "Deactivate",
  archive: "Archive",
  publish: "Publish",
  reserve: "Reserve",
  sold: "Mark sold",
};

export default function InventoryTable() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ part: Part; action: LifecycleAction; context: ListingLifecycleContext | null } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => { loadInventory(); }, []);

  async function loadInventory() {
    try { setLoading(true); setParts(await getSupplierParts()); }
    finally { setLoading(false); }
  }

  async function openLifecycle(part: Part, action: LifecycleAction) {
    try {
      const context = await getListingLifecycleContext(part.id);
      setModal({ part, action, context });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load listing history.");
    }
  }

  async function confirmLifecycle() {
    if (!modal) return;
    setModalLoading(true);
    try {
      if (modal.action === "delete") {
        const result = await deletePart(modal.part.id);
        if (!result.success) throw result.error;
        setParts((current) => current.filter((part) => part.id !== modal.part.id));
        toast.success("Draft listing permanently deleted.");
      } else {
        const target: ListingStatus = modal.action === "inactive" ? "Inactive" : modal.action === "archive" ? "Archived" : modal.action === "publish" ? "Published" : modal.action === "reserve" ? "Reserved" : "Sold";
        const result = await transitionListingStatus(modal.part.id, target);
        if (!result.success) throw result.error;
        setParts((current) => current.map((part) => part.id === modal.part.id ? { ...part, status: target } : part));
        toast.success(`Listing moved to ${target}.`);
      }
      setModal(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update listing lifecycle.");
    } finally {
      setModalLoading(false);
    }
  }

  const filteredParts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return parts;
    return parts.filter((part) => [part.part_number, part.manufacturer, part.description].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)));
  }, [parts, search]);

  if (loading) return <div aria-busy="true" aria-label="Loading inventory" className="rounded-2xl border border-aviation-border bg-white p-5 shadow-sm"><div className="skeleton h-11 w-full rounded-xl"/><div className="mt-5 overflow-hidden rounded-xl border border-aviation-border"><div className="skeleton h-12 w-full"/>{Array.from({ length: 6 }).map((_, index) => <div key={index} className="flex gap-4 border-t border-aviation-border p-4"><div className="skeleton h-16 w-16 rounded-lg"/><div className="skeleton h-5 flex-1 rounded"/><div className="skeleton h-5 w-24 rounded"/></div>)}</div></div>;

  return (
    <>
      <div className="overflow-hidden rounded-2xl bg-white shadow">
        <div className="flex flex-col gap-4 border-b p-6 md:flex-row md:items-center md:justify-between">
          <label htmlFor="supplier-inventory-search" className="sr-only">Search inventory</label>
          <input id="supplier-inventory-search" type="search" placeholder="Search by Part Number, Manufacturer or Description..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-aviation-border p-3 md:w-96 focus:outline-none focus:ring-2 focus:ring-aviation-primary/30" />
          <Link href="/supplier/inventory/new" className="rounded-xl bg-aviation-primary px-6 py-3 text-center font-semibold text-white">+ Add Part</Link>
        </div>

        {filteredParts.length === 0 ? (
          search ? <div className="p-10 text-center"><h2 className="text-xl font-semibold text-aviation-dark">No listings match your search</h2><p className="mt-2 text-sm text-aviation-muted">Try a different part number, manufacturer or description.</p></div> : <div className="p-6"><EmptyState icon={Package} eyebrow="NO LISTINGS YET" title="Publish your first aircraft part" description="Add accurate part numbers, quantities, pricing and certification details so buyers can find and evaluate your inventory." actionLabel="Add part" actionHref="/supplier/inventory/new" /></div>
        ) : (
          <div className="overflow-x-auto">
            <div className="aviation-table-wrap"><table className="min-w-full">
              <thead className="bg-aviation-light"><tr>{["Image","Part Number","Manufacturer","Quantity","Price","Status","Actions"].map((h) => <th key={h} className="p-4 text-left">{h}</th>)}</tr></thead>
              <tbody>
                {filteredParts.map((part) => (
                  <tr key={part.id} className="border-b transition hover:bg-aviation-light">
                    <td className="p-4">{part.image_urls?.[0] ? <Image src={part.image_urls[0]} alt={part.part_number} width={80} height={80} unoptimized className="h-20 w-20 rounded-lg object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-aviation-light text-xs text-aviation-muted">No Image</div>}</td>
                    <td className="p-4 font-medium">{part.part_number}</td>
                    <td className="p-4">{part.manufacturer ?? "-"}</td>
                    <td className="p-4">{part.quantity}</td>
                    <td className="p-4">{part.price_type === "request_quote" ? "Request a Quote" : `${part.currency} ${Number(part.unit_price || 0).toLocaleString()} ${part.price_basis === "lot" ? `per lot (${part.lot_size || "?"} units)` : "per unit"}`}</td>
                    <td className="p-4"><StatusBadge status={part.status} /></td>
                    <td className="p-4"><div className="flex min-w-[250px] flex-wrap gap-x-4 gap-y-3">
                      <Link href={`/supplier/inventory/${part.id}`} className="font-medium text-aviation-primary hover:underline">View</Link>
                      {!(["Sold", "Archived"].includes(part.status)) && <Link href={`/supplier/inventory/${part.id}/edit`} className="font-medium text-aviation-success hover:underline">Edit</Link>}
                      {actionFor(part.status).map((action) => <button key={action} type="button" onClick={() => openLifecycle(part, action)} className={`font-medium hover:underline ${action === "delete" ? "text-aviation-error" : action === "publish" ? "text-aviation-success" : "text-aviation-primary"}`}>{actionLabel[action]}</button>)}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}
      </div>

      {modal && <ListingLifecycleModal open partNumber={modal.part.part_number} action={modal.action} context={modal.context} loading={modalLoading} onCancel={() => !modalLoading && setModal(null)} onConfirm={confirmLifecycle} />}
    </>
  );
}
