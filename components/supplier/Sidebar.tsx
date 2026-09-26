"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, Package, FileText, ShoppingCart, MessageSquare, Building2, Plus, Store, LogOut, ShieldCheck, Megaphone } from "lucide-react";
import RoleSwitcher from "@/components/account/RoleSwitcher";

const groups = [
  { label: "Workspace", items: [
    { name: "Overview", href: "/supplier/dashboard", icon: LayoutDashboard },
    { name: "Listings", href: "/supplier/inventory", icon: Package },
    { name: "RFQs", href: "/supplier/rfqs", icon: FileText },
    { name: "Quotations", href: "/supplier/quotes", icon: FileText },
    { name: "Orders", href: "/supplier/purchase-orders", icon: ShoppingCart },
    { name: "Shipments", href: "/supplier/shipments", icon: Package },
    { name: "Invoices", href: "/supplier/invoices", icon: FileText },
    { name: "Messages", href: "/supplier/messages", icon: MessageSquare },
    { name: "Marketing", href: "/supplier/marketing", icon: Megaphone },
  ]},
  { label: "Account", items: [{ name: "Company profile", href: "/supplier/profile", icon: Building2 }, { name: "Verification", href: "/supplier/verification", icon: ShieldCheck }] },
];
export default function Sidebar() {
  const pathname=usePathname(); const router=useRouter(); const [unread,setUnread]=useState(0);
  useEffect(()=>{let active=true; async function load(){const {data:{user}}=await supabase.auth.getUser(); if(!user)return; const {count}=await supabase.from("messages").select("id",{count:"exact",head:true}).eq("recipient_id",user.id).eq("is_read",false); if(active)setUnread(count??0);} load(); const id=window.setInterval(load,10000); return()=>{active=false;window.clearInterval(id)}},[]);
  async function logout(){await supabase.auth.signOut();router.push("/login");router.refresh();}
  return <aside className="sticky top-0 hidden h-screen w-[252px] shrink-0 border-r border-aviation-border bg-aviation-dark text-white lg:flex lg:flex-col">
    <div className="border-b border-white/10 px-6 py-6"><Link href="/supplier/dashboard" className="block"><div className="font-display text-xl font-semibold tracking-tight">AviaInventory</div><div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">Supplier workspace</div></Link></div>
    <div className="px-4 pt-4"><RoleSwitcher active="supplier" /></div>
    <nav aria-label="Supplier workspace navigation" className="flex-1 overflow-y-auto px-3 py-5">{groups.map(group=><div key={group.label} className="mb-6"><p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">{group.label}</p><div className="space-y-1">{group.items.map(item=>{const Icon=item.icon;const active=pathname===item.href||pathname.startsWith(item.href+"/");return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-[var(--aviation-radius-md)] px-3 py-2.5 text-sm transition ${active?"bg-white text-aviation-dark":"text-white/75 hover:bg-white/8 hover:text-white"}`}><Icon size={17} aria-hidden="true"/><span className="flex-1">{item.name}</span>{item.name==="Messages"&&unread>0&&<span className="rounded-full bg-aviation-error px-1.5 py-0.5 text-[10px] font-bold">{unread>99?"99+":unread}</span>}</Link>})}</div></div>)}</nav>
    <div className="space-y-1 border-t border-white/10 p-4"><Link href="/supplier/inventory/new" className="flex items-center gap-2 rounded-[var(--aviation-radius-md)] bg-aviation-accent px-3 py-2.5 text-sm font-semibold text-white hover:brightness-105"><Plus size={16} aria-hidden="true"/>Add listing</Link><Link href="/marketplace" className="flex items-center gap-2 rounded-[var(--aviation-radius-md)] px-3 py-2.5 text-xs text-white/65 hover:bg-white/5 hover:text-white"><Store size={15} aria-hidden="true"/>Marketplace</Link><button onClick={logout} className="flex w-full items-center gap-2 rounded-[var(--aviation-radius-md)] px-3 py-2.5 text-left text-xs text-white/55 hover:bg-aviation-error/20 hover:text-white"><LogOut size={15} aria-hidden="true"/>Log out</button></div>
  </aside>;
}
