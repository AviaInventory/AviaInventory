"use client";

import Link from "next/link";

import {
  ClipboardList,
  FileText,
  Package,
  ShoppingCart,
  Building2,
  PlusCircle,
  ArrowRight,
} from "lucide-react";

interface Action {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const actions: Action[] = [
  {
    title: "Add Part",
    description: "Add a new aircraft part to your inventory.",
    href: "/supplier/inventory/new",
    icon: PlusCircle,
  },
  {
    title: "Browse RFQs",
    description: "View buyer requests and submit quotations.",
    href: "/supplier/rfqs",
    icon: ClipboardList,
  },
  {
    title: "My Quotations",
    description: "Manage submitted quotations.",
    href: "/supplier/quotes",
    icon: FileText,
  },
  {
    title: "Inventory",
    description: "Manage aircraft parts and stock.",
    href: "/supplier/inventory",
    icon: Package,
  },
  {
    title: "Orders",
    description: "View accepted quotations and orders.",
    href: "/supplier/purchase-orders",
    icon: ShoppingCart,
  },
  {
    title: "Company Profile",
    description:
      "Update company information and certifications.",
    href: "/account/company",
    icon: Building2,
  },
];

export default function QuickActions() {
  return (
    <section className="mb-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-aviation-primary">
          Quick Actions
        </h2>

        <p className="mt-1 text-sm text-aviation-muted">
          Frequently used supplier tools
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.title}
              href={action.href}
              className="group rounded-xl border border-aviation-border p-5 transition hover:border-aviation-border hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-aviation-light p-3 transition group-hover:bg-aviation-primary">
                  <Icon className="h-6 w-6 text-aviation-primary transition group-hover:text-white" />
                </div>

                <ArrowRight className="h-5 w-5 text-aviation-muted transition group-hover:translate-x-1 group-hover:text-aviation-primary" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-aviation-dark">
                {action.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-aviation-muted">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}