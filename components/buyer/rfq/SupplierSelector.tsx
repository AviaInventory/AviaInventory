"use client";

import { useEffect, useMemo, useState } from "react";

import { getApprovedSuppliers } from "@/lib/suppliers";
import { fieldInput } from "@/components/ui/form";
import { supabase } from "@/lib/supabase";

interface Supplier {
  id: string;
  company_name: string;
  country?: string | null;
  categories: string[];
}

interface Props {
  selectedSuppliers: string[];
  onChange: (supplierIds: string[]) => void;
}

export default function SupplierSelector({
  selectedSuppliers,
  onChange,
}: Props) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getApprovedSuppliers(), supabase.auth.getUser()])
      .then(([data, { data: { user } }]) => {
        // A Buyer & Supplier account must not send an RFQ to its own company.
        if (active) setSuppliers(data.filter((supplier) => supplier.id !== user?.id));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const query = search.toLowerCase();

      return (
        supplier.company_name
          .toLowerCase()
          .includes(query) ||
        (supplier.country ?? "")
          .toLowerCase()
          .includes(query) ||
        supplier.categories.some((category) =>
          category.toLowerCase().includes(query)
        )
      );
    });
  }, [suppliers, search]);

  function toggleSupplier(id: string) {
    if (selectedSuppliers.includes(id)) {
      onChange(
        selectedSuppliers.filter(
          (supplierId) => supplierId !== id
        )
      );
    } else {
      onChange([...selectedSuppliers, id]);
    }
  }

  if (loading) {
    return (
      <div className="rounded-md border border-aviation-border p-4 text-center text-[13px]">
        Loading suppliers...
      </div>
    );
  }

  return (
    <div className="space-y-3">

      <input
        type="text"
        placeholder="Search supplier, country or category..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        className={fieldInput}
      />

      <div className="max-h-80 overflow-y-auto rounded-md border border-aviation-border">

        {filteredSuppliers.length === 0 ? (

          <div className="p-5 text-center text-[13px] text-[var(--aviation-muted)]">
            No suppliers found.
          </div>

        ) : (

          filteredSuppliers.map((supplier) => {

            const checked =
              selectedSuppliers.includes(supplier.id);

            return (

              <label
                key={supplier.id}
                className="flex cursor-pointer items-start gap-3 border-b border-aviation-border px-3 py-2.5 last:border-b-0 hover:bg-aviation-light"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    toggleSupplier(supplier.id)
                  }
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--aviation-primary)]"
                />

                <div className="flex-1">

                  <h3 className="text-[13px] font-semibold text-aviation-primary">
                    {supplier.company_name}
                  </h3>

                  <p className="mt-0.5 text-xs text-[var(--aviation-muted)]">
                    {supplier.country || "Location not provided"}
                  </p>

                  <div className="mt-1.5 flex flex-wrap gap-1.5">

                    {supplier.categories.map((category) => (

                      <span
                        key={category}
                        className="rounded-full bg-aviation-light px-2 py-0.5 text-[11px]"
                      >
                        {category}
                      </span>

                    ))}

                  </div>

                </div>

              </label>

            );
          })

        )}

      </div>

      <p className="text-xs text-[var(--aviation-muted)]">
        Selected Suppliers:{" "}
        <strong>{selectedSuppliers.length}</strong>
      </p>

    </div>
  );
}