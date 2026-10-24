// Public company details used by the footer, contact page and legal pages.
// Keep these in one place so they never drift apart. Source: Upgear Aviation (Oct 2026).

export const SITE = {
  name: "AviaInventory",
  legalEntity: "Upgear Aviation Limited",
  /** Also the WhatsApp Business number. */
  phone: "+254 183 210970",
  location: "Nairobi, Kenya",
  address: {
    building: "Fairbank Arcade, Suite 3-204",
    street: "Mai Mahiu Road, off Langata Road",
    landmark: "Next to Wilson Airport",
    city: "Nairobi, Kenya",
  },
  /** General enquiries and office communication. */
  email: "info@aviainventory.com",
  emails: {
    general: "info@aviainventory.com",
    support: "support@aviainventory.com",
    sales: "sales@aviainventory.com",
    billing: "billing@aviainventory.com",
    /** Sender for sign-up and password-reset emails; not monitored. */
    noReply: "no-reply@aviainventory.com",
  },
  // Add the real profile URLs when the client supplies them; empty entries are not rendered.
  social: {
    linkedin: "",
    facebook: "",
    x: "",
  },
} as const;

/** One-line postal address, e.g. for footers and legal pages. */
export const SITE_ADDRESS = [SITE.address.building, SITE.address.street, SITE.address.landmark, SITE.address.city].join(", ");

/** "Book a demo" requests go to the sales team by email or WhatsApp. */
export const DEMO_EMAIL = SITE.emails.sales;

/** Details already known about the requester; signed-in users don't retype them. */
export type DemoRequester = { name?: string | null; company?: string | null; email?: string | null };

function demoMessage(requester?: DemoRequester | null) {
  const lines = [
    "Hello AviaInventory, I would like to book a demo of the platform.",
    "",
    `Name: ${requester?.name?.trim() ?? ""}`,
    `Company: ${requester?.company?.trim() ?? ""}`,
    ...(requester?.email ? [`Email: ${requester.email}`] : []),
    "I am interested in: buying parts / selling parts / MRO services",
    "Preferred date and time:",
  ];
  return lines.join("\n");
}

export function demoLinks(requester?: DemoRequester | null) {
  const message = demoMessage(requester);
  return {
    mailto: `mailto:${DEMO_EMAIL}?subject=${encodeURIComponent("Book a demo")}&body=${encodeURIComponent(message)}`,
    whatsapp: `https://wa.me/${SITE.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
  };
}
