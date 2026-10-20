"use client";

import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatOrderAmount, issuePurchaseOrder, type Order } from "@/lib/orders";
import RequiredMark from "@/components/ui/RequiredMark";
import { ACCOUNT_REQUIRED_METHODS, SHIPPING_METHODS } from "./workflow";

const field = "min-h-11 w-full rounded-xl border border-aviation-border bg-white px-4 py-2.5 text-sm focus:border-aviation-primary focus:outline-none disabled:bg-aviation-light";
const label = "mb-1.5 block text-sm font-semibold text-aviation-dark";

/** The buyer's purchase order: quantity, delivery details and shipping method. */
export default function PurchaseOrderForm({ order, onIssued }: { order: Order; onIssued: (poNumber: string) => void }) {
  const [form, setForm] = useState({
    quantity: String(order.quantity),
    shipToName: order.ship_to_name ?? "",
    shipToCompany: order.ship_to_company ?? order.buyer_company_name ?? "",
    shipToAddress: order.ship_to_address ?? "",
    shipToCity: order.ship_to_city ?? "",
    shipToCountry: order.ship_to_country ?? "",
    shipToPhone: order.ship_to_phone ?? "",
    shippingMethod: order.shipping_method ?? "",
    shippingAccountNumber: order.shipping_account_number ?? "",
    requiredDate: order.required_date ?? "",
    notes: order.buyer_message ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // First PO: start from the buyer's own profile so they only confirm the details.
  useEffect(() => {
    if (order.po_number) return;
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: profile }, { data: buyer }] = await Promise.all([
        supabase.from("profiles").select("full_name,phone,country,company_name,address,city").eq("id", user.id).maybeSingle(),
        supabase.from("buyers").select("address,city").eq("id", user.id).maybeSingle(),
      ]);
      if (!active) return;
      setForm((current) => ({
        ...current,
        shipToName: current.shipToName || profile?.full_name || "",
        shipToCompany: current.shipToCompany || profile?.company_name || "",
        shipToAddress: current.shipToAddress || buyer?.address || profile?.address || "",
        shipToCity: current.shipToCity || buyer?.city || profile?.city || "",
        shipToCountry: current.shipToCountry || profile?.country || "",
        shipToPhone: current.shipToPhone || profile?.phone || "",
      }));
    })();
    return () => { active = false; };
  }, [order.po_number]);

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const quantity = Math.max(0, Math.floor(Number(form.quantity) || 0));
  const needsAccount = ACCOUNT_REQUIRED_METHODS.has(form.shippingMethod);
  const today = new Date().toISOString().slice(0, 10);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (quantity < 1) return setError("Enter a quantity of at least 1.");
    if (!form.shipToName.trim() || !form.shipToAddress.trim() || !form.shipToCity.trim() || !form.shipToCountry.trim()) return setError("Enter the delivery contact name, address, city and country.");
    if (!form.shippingMethod) return setError("Choose a shipping method.");
    if (needsAccount && !form.shippingAccountNumber.trim()) return setError(`Enter your ${form.shippingMethod} shipping account number.`);
    setSaving(true);
    const result = await issuePurchaseOrder(order.id, { ...form, quantity });
    setSaving(false);
    if (!result.success || !result.data) return setError(result.error ?? "The purchase order could not be sent.");
    onIssued(result.data);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="po-qty" className={label}>Quantity <RequiredMark /></label>
          <input id="po-qty" type="number" min={1} step={1} inputMode="numeric" value={form.quantity} onChange={set("quantity")} className={field} />
        </div>
        <div>
          <p className={label}>Unit price (quoted)</p>
          <p className="flex min-h-11 items-center rounded-xl bg-aviation-light px-4 text-sm font-semibold">{formatOrderAmount(Number(order.unit_price), order.currency)}</p>
        </div>
        <div>
          <p className={label}>Order total</p>
          <p className="flex min-h-11 items-center rounded-xl bg-aviation-light px-4 text-sm font-bold text-aviation-primary">{formatOrderAmount(quantity * Number(order.unit_price), order.currency)}</p>
        </div>
      </div>

      <fieldset className="space-y-4">
        <legend className="text-sm font-bold uppercase tracking-wider text-aviation-muted">Ship to</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="po-name" className={label}>Contact name <RequiredMark /></label><input id="po-name" value={form.shipToName} onChange={set("shipToName")} autoComplete="name" className={field} /></div>
          <div><label htmlFor="po-company" className={label}>Company</label><input id="po-company" value={form.shipToCompany} onChange={set("shipToCompany")} autoComplete="organization" className={field} /></div>
        </div>
        <div><label htmlFor="po-address" className={label}>Delivery address <RequiredMark /></label><textarea id="po-address" rows={2} value={form.shipToAddress} onChange={set("shipToAddress")} autoComplete="street-address" placeholder="Building, street, hangar or warehouse" className={field} /></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label htmlFor="po-city" className={label}>City <RequiredMark /></label><input id="po-city" value={form.shipToCity} onChange={set("shipToCity")} autoComplete="address-level2" className={field} /></div>
          <div><label htmlFor="po-country" className={label}>Country <RequiredMark /></label><input id="po-country" value={form.shipToCountry} onChange={set("shipToCountry")} autoComplete="country-name" className={field} /></div>
          <div><label htmlFor="po-phone" className={label}>Phone</label><input id="po-phone" type="tel" value={form.shipToPhone} onChange={set("shipToPhone")} autoComplete="tel" className={field} /></div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-bold uppercase tracking-wider text-aviation-muted">Shipping</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="po-method" className={label}>Shipping method <RequiredMark /></label>
            <select id="po-method" value={form.shippingMethod} onChange={set("shippingMethod")} className={field}>
              <option value="">Select method</option>
              {SHIPPING_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="po-account" className={label}>Shipping account no. {needsAccount && <RequiredMark />}</label>
            <input id="po-account" value={form.shippingAccountNumber} onChange={set("shippingAccountNumber")} placeholder={needsAccount ? `Your ${form.shippingMethod} account` : "If you have one"} className={field} />
          </div>
          <div><label htmlFor="po-date" className={label}>Required by</label><input id="po-date" type="date" min={today} value={form.requiredDate} onChange={set("requiredDate")} className={field} /></div>
        </div>
        <div><label htmlFor="po-notes" className={label}>Notes for the supplier</label><textarea id="po-notes" rows={3} value={form.notes} onChange={set("notes")} placeholder="Packing, documentation or delivery instructions" className={field} /></div>
      </fieldset>

      {error && <p role="alert" className="rounded-xl bg-aviation-error-soft p-3 text-sm text-aviation-error">{error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-aviation-primary px-6 py-3 text-sm font-bold text-white disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {saving ? "Sending…" : order.po_number ? "Update purchase order" : "Send purchase order"}
        </button>
      </div>
    </form>
  );
}
