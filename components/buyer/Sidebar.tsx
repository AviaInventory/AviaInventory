"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Search, FileText, Package, MessageSquare, Settings, ArrowUpRight } from "lucide-react";

const groups = [
  { label: "Workspace", items: [
    { name: "Overview", href: "/buyer/dashboard", icon: LayoutDashboard },
    { name: "Listings", href: "/marketplace", icon: Search },
    { name: "RFQs", href: "/buyer/rfqs", icon: FileText },
    { name: "Orders", href: "/buyer/orders", icon: Package },
    { name: "Messages", href: "/buyer/messages", icon: MessageSquare },
  ]},
  { label: "Account", items: [{ name: "Account settings", href: "/buyer/settings", icon: Settings }] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase.from("messages").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).eq("is_read", false);
      if (active) setUnread(count ?? 0);
    }
    load(); const id = window.setInterval(load, 10000);
    return () => { active = false; window.clearInterval(id); };
  }, []);
  return <aside className="sticky top-0 hidden h-screen w-[252px] shrink-0 border-r border-aviation-border bg-aviation-dark text-white lg:flex lg:flex-col">
    <div className="border-b border-white/10 px-6 py-6">
      <Link href="/buyer/dashboard" className="block"><div className="font-display text-xl font-semibold tracking-tight">AviaInventory</div><div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">Buyer workspace</div></Link>
    </div>
    <nav className="flex-1 overflow-y-auto px-3 py-5">{groups.map(group => <div key={group.label} className="mb-6"><p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">{group.label}</p><div className="space-y-1">{group.items.map(item => { const Icon=item.icon; const active=pathname===item.href || (item.href!=="/marketplace" && pathname.startsWith(item.href+"/")); return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-[var(--aviation-radius-md)] px-3 py-2.5 text-sm transition ${active ? "bg-white text-aviation-dark" : "text-white/75 hover:bg-white/8 hover:text-white"}`}><Icon size={17}/><span className="flex-1">{item.name}</span>{item.name==="Messages" && unread>0 && <span className="rounded-full bg-aviation-error px-1.5 py-0.5 text-[10px] font-bold text-white">{unread>99?"99+":unread}</span>}</Link>})}</div></div>)}</nav>
    <div className="border-t border-white/10 p-4"><Link href="/marketplace" className="flex items-center justify-between rounded-[var(--aviation-radius-md)] bg-white/5 px-3 py-2.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"><span>Open marketplace</span><ArrowUpRight size={14}/></Link></div>
  </aside>;
}
