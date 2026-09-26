import { requireRole } from "@/lib/auth-guard";
import type { ReactNode } from "react";
export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireRole(["buyer", "supplier", "admin"]);
  return children;
}
