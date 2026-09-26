"use client";

import { Check } from "lucide-react";
import type { RegistrationData } from "@/types/auth";

interface SupplierStep3Props {
  formData: RegistrationData;
  setFormData: React.Dispatch<
    React.SetStateAction<RegistrationData>
  >;
}

const categories = [
  {
    icon: "✈️",
    name: "Aircraft",
  },
  {
    icon: "🛩️",
    name: "Airframes",
  },
  {
    icon: "⚙️",
    name: "Engines",
  },
  {
    icon: "📡",
    name: "Avionics",
  },
  {
    icon: "🛞",
    name: "Landing Gear",
  },
  {
    icon: "📦",
    name: "Consumables",
  },
  {
    icon: "🔩",
    name: "Hardware",
  },
  {
    icon: "🚁",
    name: "Helicopter Parts",
  },
  {
    icon: "🛠️",
    name: "Ground Support Equipment",
  },
  {
    icon: "💺",
    name: "Aircraft Interiors",
  },
  {
    icon: "🔄",
    name: "Rotables",
  },
  {
    icon: "📋",
    name: "Other",
  },
];

export default function SupplierStep3({
  formData,
  setFormData,
}: SupplierStep3Props) {

  const toggleCategory = (category: string) => {

    const exists =
      formData.supplierCategories.includes(category);

    if (exists) {
      setFormData({
        ...formData,
        supplierCategories:
          formData.supplierCategories.filter(
            (item) => item !== category
          ),
      });
    } else {
      setFormData({
        ...formData,
        supplierCategories: [
          ...formData.supplierCategories,
          category,
        ],
      });
    }
  };

  return (
    <div>

      <div className="mb-10">

        <h2 className="text-3xl font-bold text-aviation-primary">
          What do you sell?
        </h2>

        <p className="mt-2 text-aviation-muted">
          Select every category that applies to your business.
        </p>

      </div>

      <div className="grid gap-5 md:grid-cols-3">

        {categories.map((category) => {

          const selected =
            formData.supplierCategories.includes(category.name);

          return (

            <button
              key={category.name}
              type="button"
              onClick={() => toggleCategory(category.name)}
              className={`relative rounded-2xl border p-6 text-left transition-all duration-200 hover:shadow-lg ${
                selected
                  ? "border-aviation-border bg-aviation-success-soft"
                  : "border-aviation-border bg-white"
              }`}
            >

              {selected && (
                <Check
                  className="absolute right-4 top-4 text-aviation-primary"
                  size={22}
                />
              )}

              <div className="text-5xl">
                {category.icon}
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                {category.name}
              </h3>

            </button>

          );

        })}

      </div>

    </div>
  );
}