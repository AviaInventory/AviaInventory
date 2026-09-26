import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_COOKIE,
  isValidAdminSessionToken,
} from "@/lib/admin-auth";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(ADMIN_COOKIE)?.value;

  if (!isValidAdminSessionToken(token)) {
    redirect("/platform-console/login");
  }

  return <>{children}</>;
}