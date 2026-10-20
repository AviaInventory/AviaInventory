// Shipments are a view of orders from payment onwards (no separate table):
//   Paid -> Pending Dispatch, Dispatched -> In Transit, Closed -> Delivered.
import type { Order } from "@/lib/orders";

export type ShipmentStatus = "Pending Dispatch" | "In Transit" | "Delivered";

export const SHIPMENT_STATUSES: ShipmentStatus[] = ["Pending Dispatch", "In Transit", "Delivered"];

const STATUS_BY_ORDER: Record<string, ShipmentStatus> = {
  Paid: "Pending Dispatch",
  Dispatched: "In Transit",
  Closed: "Delivered",
};

/** The shipment status for an order, or null if the order is not ready to ship yet. */
export function shipmentStatus(orderStatus: string): ShipmentStatus | null {
  return STATUS_BY_ORDER[orderStatus] ?? null;
}

/** Collection orders are not "in transit": label them for what is happening. */
export function shipmentStatusLabel(status: ShipmentStatus, shippingMethod: string | null): string {
  if (shippingMethod === "Own pick-up") {
    if (status === "Pending Dispatch") return "Pending Collection";
    if (status === "In Transit") return "Awaiting Collection";
    return "Collected";
  }
  return status;
}

/** PO-2026-00001 -> SHP-2026-00001; one shipment per order. */
export function shipmentNumber(order: Pick<Order, "po_number" | "id">): string {
  return order.po_number ? order.po_number.replace(/^PO-/, "SHP-") : `SHP-${order.id.slice(0, 8).toUpperCase()}`;
}

/** The courier's public tracking page for a tracking number (null for other methods). */
export function trackingUrl(courier: string | null, trackingNumber: string | null): string | null {
  if (!courier || !trackingNumber) return null;
  const number = encodeURIComponent(trackingNumber.trim());
  switch (courier) {
    case "DHL": return `https://www.dhl.com/ke-en/home/tracking.html?tracking-id=${number}`;
    case "FedEx": return `https://www.fedex.com/fedextrack/?trknbr=${number}`;
    case "UPS": return `https://www.ups.com/track?tracknum=${number}`;
    case "Aramex": return `https://www.aramex.com/track/results?ShipmentNumber=${number}`;
    default: return null;
  }
}
