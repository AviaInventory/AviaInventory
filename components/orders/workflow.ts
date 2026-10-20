// The order workflow agreed with Upgear Aviation (Oct 2026):
// quote accepted -> purchase order -> invoice -> payment -> dispatch -> received -> closed.
// Statuses match orders.status (migration 20261020000100).

export type OrderRole = "buyer" | "supplier";

export const ORDER_STEPS = [
  { key: "po", label: "Purchase order" },
  { key: "invoice", label: "Invoice" },
  { key: "payment", label: "Payment" },
  { key: "dispatch", label: "Dispatch" },
  { key: "received", label: "Received" },
] as const;

/** Index of the step currently in progress (ORDER_STEPS.length when the order is closed). */
export function currentStepIndex(status: string): number {
  switch (status) {
    case "Awaiting PO": return 0;
    case "PO Issued": return 1;
    case "Invoiced":
    case "Payment Sent": return 2;
    case "Paid": return 3;
    case "Dispatched": return 4;
    case "Closed": return ORDER_STEPS.length;
    default: return 0;
  }
}

export const SHIPPING_METHODS = ["DHL", "FedEx", "UPS", "Aramex", "Own pick-up", "Supplier arranges freight", "Other"] as const;

/** Carriers where the buyer ships on their own account (account number required). */
export const ACCOUNT_REQUIRED_METHODS = new Set(["DHL", "FedEx"]);

export type NextAction = {
  /** Short label for buttons and the orders list, e.g. "Create purchase order". */
  label: string;
  /** One sentence telling the user what happens now. */
  hint: string;
  /** Whether this party has something to do (otherwise they are waiting). */
  yourTurn: boolean;
};

/** What the given party should do next for an order in this status. */
export function nextAction(status: string, role: OrderRole): NextAction {
  const buyer = role === "buyer";
  switch (status) {
    case "Awaiting PO":
      return buyer
        ? { label: "Create purchase order", hint: "Confirm the delivery address and shipping method so the supplier can invoice you.", yourTurn: true }
        : { label: "Waiting for purchase order", hint: "The buyer accepted your quotation. You'll be notified when their purchase order arrives.", yourTurn: false };
    case "PO Issued":
      return buyer
        ? { label: "Waiting for invoice", hint: "The supplier is preparing the invoice. You can still edit the purchase order until then.", yourTurn: false }
        : { label: "Create invoice", hint: "Review the purchase order and send the buyer your invoice with payment details.", yourTurn: true };
    case "Invoiced":
      return buyer
        ? { label: "Pay and mark as paid", hint: "Pay the supplier using the details on the invoice, then mark it as paid.", yourTurn: true }
        : { label: "Waiting for payment", hint: "The buyer has your invoice. Confirm the payment once you receive it.", yourTurn: true };
    case "Payment Sent":
      return buyer
        ? { label: "Waiting for confirmation", hint: "The supplier will confirm once your payment arrives.", yourTurn: false }
        : { label: "Confirm payment", hint: "The buyer marked the invoice as paid. Confirm when the money is in your account.", yourTurn: true };
    case "Paid":
      return buyer
        ? { label: "Waiting for dispatch", hint: "Payment confirmed. The supplier will dispatch your order next.", yourTurn: false }
        : { label: "Mark as dispatched", hint: "Payment received. Dispatch the order and add the tracking details.", yourTurn: true };
    case "Dispatched":
      return buyer
        ? { label: "Confirm received", hint: "Your order is on its way. Confirm once you receive it to close the order.", yourTurn: true }
        : { label: "Waiting for delivery", hint: "The buyer will confirm when the order arrives.", yourTurn: false };
    case "Closed":
      return { label: "Order closed", hint: "This order is complete.", yourTurn: false };
    case "Cancelled":
      return { label: "Cancelled", hint: "This order was cancelled.", yourTurn: false };
    default:
      return { label: status, hint: "", yourTurn: false };
  }
}
