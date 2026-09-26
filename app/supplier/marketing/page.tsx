import Link from "next/link";
import { Megaphone, Search, Sparkles, Target, Newspaper, MessageCircle } from "lucide-react";
import { requireRole } from "@/lib/auth-guard";
import { requireActiveSubscription } from "@/lib/billing/subscription";

export default async function SupplierMarketingPage() {
  await requireRole(["supplier"]);
  const subscription = await requireActiveSubscription();
  const canBronze = subscription.entitlements.includes("featured_listings");
  const canPlatinum = subscription.entitlements.includes("external_advertising");
  const items = [
    { title: "Featured listings", description: "Submit eligible inventory for designated AviaInventory promotional placements.", icon: Sparkles, href: "/supplier/marketing/featured", enabled: canBronze, required: "Bronze" },
    { title: "Promotions", description: "Create discounts and promotional messages for approved inventory.", icon: Megaphone, href: "/supplier/marketing/promotions", enabled: canBronze, required: "Bronze" },
    { title: "Priority search", description: "Eligible Bronze and Platinum inventory receives a bounded relevance boost for matching searches.", icon: Search, href: "/supplier/marketing", enabled: canBronze, required: "Bronze" },
    { title: "Aviation Market Intelligence", description: "Dashboard architecture for future aviation intelligence datasets and reports.", icon: Target, href: "/supplier/marketing/intelligence", enabled: canPlatinum, required: "Platinum" },
    { title: "Newsletter promotion", description: "Submit promotional content for AviaInventory editorial review.", icon: Newspaper, href: "/supplier/marketing/campaigns?type=newsletter", enabled: subscription.entitlements.includes("newsletter_promotion"), required: "Platinum" },
    { title: "WhatsApp promotion", description: "Submit a campaign request for review. No automatic unsolicited messaging is performed.", icon: MessageCircle, href: "/supplier/marketing/campaigns?type=whatsapp", enabled: subscription.entitlements.includes("whatsapp_promotion"), required: "Platinum" },
    { title: "External advertising", description: "Request campaign support with objective, audience, content and schedule fields.", icon: Target, href: "/supplier/marketing/campaigns?type=external_advertising", enabled: canPlatinum, required: "Platinum" },
  ];
  return <main className="space-y-6"><header><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-aviation-accent">SUPPLIER GROWTH SERVICES</p><h1 className="mt-1 text-3xl font-bold text-aviation-dark">Marketing & marketplace visibility</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-aviation-muted">Premium visibility is layered on top of organic relevance. Marketing submissions are subject to platform review and are never presented as completed unless the service actually runs.</p></header><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(({title,description,icon:Icon,href,enabled,required})=><article key={title} className={`rounded-2xl border p-5 ${enabled?"border-aviation-border bg-white":"border-aviation-border bg-aviation-light"}`}><Icon size={21} className={enabled?"text-aviation-primary":"text-aviation-muted"}/><h2 className="mt-4 font-bold text-aviation-dark">{title}</h2><p className="mt-1 text-sm leading-6 text-aviation-muted">{description}</p>{enabled?<Link href={href} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-aviation-primary px-4 py-2.5 text-sm font-semibold text-white">Open service</Link>:<div className="mt-5 rounded-xl border border-aviation-border bg-white px-4 py-3 text-xs font-semibold text-aviation-muted">Available with {required}</div>}</article>)}</div></main>;
}
