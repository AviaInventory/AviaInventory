"use client";

import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatOrderAmount, issuePurchaseOrder, type Order } from "@/lib/orders";
import { FieldGroup, FormFooter, FormNotice, FormRow, FormSection, btnPrimary, fieldInput, fieldLabel, fieldSelect, fieldTextarea } from "@/components/ui/form";
import { ACCOUNT_REQUIRED_METHODS, SHIPPING_METHODS } from "./workflow";

/**
 * The buyer's purchase order: delivery details and shipping method. The accepted
 * quotation is final, so quantity, price, total and currency are shown, not edited.
 */
export default function PurchaseOrderForm({ order, onIssued }: { order: Order; onIssued: (poNumber: string) => void }) {
  const [form, setForm] = useState({
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

  const needsAccount = ACCOUNT_REQUIRED_METHODS.has(form.shippingMethod);
  const today = new Date().toISOString().slice(0, 10);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!form.shipToName.trim() || !form.shipToAddress.trim() || !form.shipToCity.trim() || !form.shipToCountry.trim()) return setError("Enter the delivery contact name, address, city and country.");
    if (!form.shippingMethod) return setError("Choose a shipping method.");
    if (needsAccount && !form.shippingAccountNumber.trim()) return setError(`Enter your ${form.shippingMethod} shipping account number.`);
    setSaving(true);
    const result = await issuePurchaseOrder(order.id, { ...form, quantity: order.quantity });
    setSaving(false);
    if (!result.success || !result.data) return setError(result.error ?? "The purchase order could not be sent.");
    onIssued(result.data);
  }

  const readOnly = "flex h-10 items-center rounded-md bg-aviation-light px-2.5 text-[13px] font-semibold sm:h-8";

  return (
    <form onSubmit={submit} noValidate className="compact-form space-y-4">
      <FormSection title="Quotation" text="These come from the quotation you accepted and are final. To change them, ask the supplier for a new quotation." />
      <FieldGroup columns={3}>
        <div>
          <p className={fieldLabel}>Quantity (quoted)</p>
          <p className={readOnly}>{order.quantity.toLocaleString()}</p>
        </div>
        <div>
          <p className={fieldLabel}>Unit price (quoted)</p>
          <p className={readOnly}>{formatOrderAmount(Number(order.unit_price), order.currency)}</p>
        </div>
        <div>
          <p className={fieldLabel}>Order total</p>
          <p className={`${readOnly} font-bold text-aviation-primary`}>{formatOrderAmount(Number(order.total_amount), order.currency)}</p>
        </div>
      </FieldGroup>

      <fieldset className="space-y-3">
        <legend className="mb-3 w-full"><FormSection title="Ship to" /></legend>
        <FormRow label="Contact name" htmlFor="po-name" required><input id="po-name" value={form.shipToName} onChange={set("shipToName")} autoComplete="name" className={fieldInput} /></FormRow>
        <FormRow label="Company" htmlFor="po-company"><input id="po-company" value={form.shipToCompany} onChange={set("shipToCompany")} autoComplete="organization" className={fieldInput} /></FormRow>
        <FormRow label="Delivery address" htmlFor="po-address" required><textarea id="po-address" rows={2} value={form.shipToAddress} onChange={set("shipToAddress")} autoComplete="street-address" placeholder="Building, street, hangar or warehouse" className={fieldTextarea} /></FormRow>
        <FormRow label="City" htmlFor="po-city" required><input id="po-city" value={form.shipToCity} onChange={set("shipToCity")} autoComplete="address-level2" className={fieldInput} /></FormRow>
        <FormRow label="Country" htmlFor="po-country" required><input id="po-country" value={form.shipToCountry} onChange={set("shipToCountry")} autoComplete="country-name" className={fieldInput} /></FormRow>
        <FormRow label="Phone" htmlFor="po-phone"><input id="po-phone" type="tel" value={form.shipToPhone} onChange={set("shipToPhone")} autoComplete="tel" className={fieldInput} /></FormRow>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-3 w-full"><FormSection title="Shipping" /></legend>
        <FormRow label="Shipping method" htmlFor="po-method" required>
          <select id="po-method" value={form.shippingMethod} onChange={set("shippingMethod")} className={fieldSelect}>
            <option value="">Select method</option>
            {SHIPPING_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
          </select>
        </FormRow>
        <FormRow label="Shipping account no." htmlFor="po-account" required={needsAccount}>
          <input id="po-account" value={form.shippingAccountNumber} onChange={set("shippingAccountNumber")} placeholder={needsAccount ? `Your ${form.shippingMethod} account` : "If you have one"} className={fieldInput} />
        </FormRow>
        <FormRow label="Required by" htmlFor="po-date"><input id="po-date" type="date" min={today} value={form.requiredDate} onChange={set("requiredDate")} className={fieldInput} /></FormRow>
        <FormRow label="Notes for the supplier" htmlFor="po-notes"><textarea id="po-notes" rows={3} value={form.notes} onChange={set("notes")} placeholder="Packing, documentation or delivery instructions" className={fieldTextarea} /></FormRow>
      </fieldset>

      {error && <FormNotice tone="error">{error}</FormNotice>}
      <FormFooter>
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {saving ? "Sending…" : order.po_number ? "Update purchase order" : "Send purchase order"}
        </button>
      </FormFooter>
    </form>
  );
}
