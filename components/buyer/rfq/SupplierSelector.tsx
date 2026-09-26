"use client";

import { useEffect, useMemo, useState } from "react";

import { getApprovedSuppliers } from "@/lib/suppliers";

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
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    try {
      const data = await getApprovedSuppliers();
      setSuppliers(data);
    } finally {
      setLoading(false);
    }
  }

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
      <div className="rounded-xl border p-6 text-center">
        Loading suppliers...
      </div>
    );
  }

  return (
    <div className="space-y-5">

      <input
        type="text"
        placeholder="Search supplier, country or category..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
      />

      <div className="max-h-96 overflow-y-auto rounded-xl border">

        {filteredSuppliers.length === 0 ? (

          <div className="p-8 text-center text-aviation-muted">
            No suppliers found.
          </div>

        ) : (

          filteredSuppliers.map((supplier) => {

            const checked =
              selectedSuppliers.includes(supplier.id);

            return (

              <label
                key={supplier.id}
                className="flex cursor-pointer items-start gap-4 border-b p-4 hover:bg-aviation-light"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    toggleSupplier(supplier.id)
                  }
                  className="mt-1 h-5 w-5"
                />

                <div className="flex-1">

                  <h3 className="font-semibold text-aviation-primary">
                    {supplier.company_name}
                  </h3>

                  <p className="mt-1 text-sm text-aviation-muted">
                    {supplier.country || "Location not provided"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">

                    {supplier.categories.map((category) => (

                      <span
                        key={category}
                        className="rounded-full bg-aviation-light px-3 py-1 text-xs"
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

      <p className="text-sm text-aviation-muted">
        Selected Suppliers:{" "}
        <strong>{selectedSuppliers.length}</strong>
      </p>

    </div>
  );
}