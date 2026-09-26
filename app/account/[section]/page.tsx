import AccountCenterShell from "@/components/account-center/AccountCenterShell";
import AccountSection from "@/components/account-center/AccountSection";

export default async function AccountSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <AccountCenterShell section={section}><AccountSection section={section}/></AccountCenterShell>;
}
