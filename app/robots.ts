import type { MetadataRoute } from "next";
import { SITE_URL } from "./sitemap";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Signed-in workspaces, the admin console and APIs are not useful search results.
      disallow: ["/api/", "/admin/", "/platform-console/", "/account/", "/buyer/", "/supplier/", "/auth/", "/reset-password"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
