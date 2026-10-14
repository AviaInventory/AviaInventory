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
