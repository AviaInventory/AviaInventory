"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterForm() {
  const [role, setRole] = useState<"buyer" | "hybrid">("buyer");

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-10 shadow-xl">

      <div className="text-center">

        <h1 className="text-4xl font-bold text-aviation-primary">
          Create Your AviaInventory Account
        </h1>

        <p className="mt-3 text-aviation-muted">
          Join the global aviation marketplace.
        </p>

      </div>

      <form className="mt-10 space-y-6">

        {/* Account Type */}

        <div>

          <label className="mb-3 block font-semibold">
            Account Type
          </label>

          <div className="grid gap-4 sm:grid-cols-2">

            <button
              type="button"
              onClick={() => setRole("buyer")}
              className={`rounded-xl border p-5 transition ${
                role === "buyer"
                  ? "border-aviation-border bg-aviation-success-soft"
                  : "border-aviation-border"
              }`}
            >
              <h2 className="font-bold">Buyer</h2>

              <p className="mt-2 text-sm text-aviation-muted">
                Search parts and request quotations.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRole("hybrid")}
              className={`rounded-xl border p-5 transition ${
                role === "hybrid"
                  ? "border-aviation-border bg-aviation-success-soft"
                  : "border-aviation-border"
              }`}
            >
              <h2 className="font-bold">Buyer & Supplier</h2>

              <p className="mt-2 text-sm text-aviation-muted">
                Buy aircraft parts and list your own inventory for sale.
              </p>
            </button>

          </div>

        </div>

        {/* Full Name */}

        <div>

          <label className="mb-2 block font-medium">
            Full Name
          </label>

          <input
            type="text"
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
          />

        </div>

        {/* Company */}

        <div>

          <label className="mb-2 block font-medium">
            Company Name
          </label>

          <input
            type="text"
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
          />

        </div>

        {/* Email */}

        <div>

          <label className="mb-2 block font-medium">
            Email Address
          </label>

          <input
            type="email"
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
          />

        </div>

        {/* Phone */}

        <div>

          <label className="mb-2 block font-medium">
            Phone Number
          </label>

          <input
            type="tel"
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
          />

        </div>

        {/* Country */}

        <div>

          <label className="mb-2 block font-medium">
            Country
          </label>

          <input
            type="text"
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
          />

        </div>

        {/* Password */}

        <div>

          <label className="mb-2 block font-medium">
            Password
          </label>

          <input
            type="password"
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
          />

        </div>

        {/* Confirm Password */}

        <div>

          <label className="mb-2 block font-medium">
            Confirm Password
          </label>

          <input
            type="password"
            className="w-full rounded-xl border p-3 focus:border-aviation-border focus:outline-none"
          />

        </div>

        <button
          className="w-full rounded-xl bg-aviation-primary py-4 text-lg font-semibold text-white hover:bg-aviation-primary"
        >
          Create Account
        </button>

      </form>

      <div className="mt-8 border-t pt-6 text-center">

        <p className="text-aviation-muted">
          Already have an account?
        </p>

        <Link
          href="/login"
          className="mt-3 inline-block font-semibold text-aviation-primary"
        >
          Login
        </Link>

      </div>

    </div>
  );
}