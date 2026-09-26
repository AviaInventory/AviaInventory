"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

/**
 * The site navigation is mounted once at the root so it remains available
 * while users move between public, buyer and supplier pages.
 * The administrator console keeps its own restricted chrome.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const restrictedConsole = pathname.startsWith("/admin") || pathname.startsWith("/platform-console");

  return (
    <>
      {!restrictedConsole && <Navbar />}
      {children}
    </>
  );
}
