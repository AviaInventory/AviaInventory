"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, FileText, MessageSquare, Package, Settings, LayoutDashboard, Truck, Receipt } from "lucide-react";
import RoleSwitcher from "@/components/account/RoleSwitcher";

export default function MobileNav({ role }: { role: "buyer" | "supplier" }) {
  const pathname=usePathname();
  const items=role==="buyer" ? [
    ["Overview","/buyer/dashboard",LayoutDashboard],["Listings","/marketplace",Search],["RFQs","/buyer/rfqs",FileText],["Orders","/buyer/orders",Package],["Messages","/buyer/messages",MessageSquare],["Account","/buyer/settings",Settings]
  ] : [
    ["Overview","/supplier/dashboard",LayoutDashboard],["Listings","/supplier/inventory",Package],["RFQs","/supplier/rfqs",FileText],["Quotes","/supplier/quotes",FileText],["Orders","/supplier/purchase-orders",Package],["Shipments","/supplier/shipments",Truck],["Invoices","/supplier/invoices",Receipt],["Messages","/supplier/messages",MessageSquare],["Account","/supplier/profile",Settings]
  ];
  return <nav aria-label={`${role === "buyer" ? "Buyer" : "Supplier"} workspace navigation`} className="aviation-mobile-nav sticky top-[121px] z-30 border-b border-aviation-border bg-white lg:hidden"><div className="flex min-w-max px-3">{items.map(([name,href,Icon])=>{const I=Icon as typeof Search;const active=pathname===href || (href!=="/marketplace"&&pathname.startsWith(String(href)+"/"));return <Link key={String(href)} href={String(href)} className={`flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold ${active?"border-aviation-primary text-aviation-primary":"border-transparent text-aviation-muted"}`}><I size={15} aria-hidden="true"/>{String(name)}</Link>})}</div><div className="border-t border-aviation-border px-3 py-2"><RoleSwitcher active={role} /></div></nav>;
}
