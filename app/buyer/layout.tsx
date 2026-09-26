import { requireRole } from "@/lib/auth-guard";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import Sidebar from "@/components/buyer/Sidebar";
import DashboardHeader from "@/components/buyer/DashboardHeader";
import MobileNav from "@/components/dashboard/MobileNav";
export default async function BuyerLayout({children}:{children:React.ReactNode}){
  await requireRole(["buyer","admin"]);
  await requireActiveSubscription("buyer_features");
  return <div className="flex min-h-screen bg-aviation-light"><Sidebar/><div className="min-w-0 flex-1"><DashboardHeader/><MobileNav role="buyer"/><main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main></div></div>;
}
