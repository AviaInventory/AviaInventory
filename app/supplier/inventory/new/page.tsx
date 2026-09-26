"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AddPartForm from "@/components/supplier/AddPartForm";

export default function AddPartPage() {
  return (
    <main className="min-h-screen bg-aviation-light px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/supplier/inventory" className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-aviation-primary hover:underline">
          <ArrowLeft size={16} aria-hidden="true" /> Back to Inventory
        </Link>
        <AddPartForm mode="create" />
      </div>
    </main>
  );
}
