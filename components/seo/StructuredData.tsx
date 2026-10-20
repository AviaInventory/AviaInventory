import { SITE } from "@/lib/site-config";

const ORIGIN = "https://www.aviainventory.com";

/**
 * Schema.org data for search engines: the official site name and its spelling variants
 * (Google uses WebSite.alternateName for "site names"), the organisation behind it, and
 * the marketplace search box.
 */
export default function StructuredData() {
  const sameAs = Object.values(SITE.social).filter(Boolean);
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${ORIGIN}/#website`,
        url: `${ORIGIN}/`,
        name: SITE.name,
        alternateName: ["Avia Inventory", "AviaInventory Aircraft Parts Marketplace"],
        publisher: { "@id": `${ORIGIN}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${ORIGIN}/marketplace?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${ORIGIN}/#organization`,
        name: SITE.name,
        alternateName: "Avia Inventory",
        legalName: SITE.legalEntity,
        url: `${ORIGIN}/`,
        logo: { "@type": "ImageObject", url: `${ORIGIN}/avia-icon-512-white.png`, width: 512, height: 512 },
        email: SITE.email,
        telephone: SITE.phone.replace(/\s+/g, ""),
        address: {
          "@type": "PostalAddress",
          streetAddress: `${SITE.address.building}, ${SITE.address.street}`,
          addressLocality: "Nairobi",
          addressCountry: "KE",
        },
        ...(sameAs.length ? { sameAs } : {}),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // JSON-LD must be inline; "<" is escaped so the content can never close the tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
