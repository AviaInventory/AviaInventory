"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import HybridAccountCard from "@/components/account/HybridAccountCard";
import Link from "next/link";
import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  FileText,
  Tags,
} from "lucide-react";

interface Profile {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;

  company_name?: string | null;
  business_type?: string | null;
  website?: string | null;
  registration_number?: string | null;

  job_title?: string | null;
  address?: string | null;
  city?: string | null;

  supplier_categories?: string[] | null;
}

export default function SupplierProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log("========== PROFILE DEBUG ==========");
      console.log("USER:", user);
      console.log("USER ID:", user?.id);
      console.log("USER ERROR:", userError);

      if (userError) {
        console.error("USER ERROR:", userError);
        return;
      }

      if (!user) {
        console.error("NO LOGGED IN USER");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log(
		"PROFILE DATA FULL:",
  		JSON.stringify(data, null, 2)
		);
      console.log("PROFILE ERROR:", error);
      console.log("==================================");

      if (error) {
        console.error("GET PROFILE ERROR:", error);
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("PROFILE LOAD ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-aviation-light p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl bg-white p-4 sm:p-8 text-center shadow-sm">
            <p className="text-aviation-muted">
              Loading company profile...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-aviation-light p-4 sm:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl bg-white p-4 sm:p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-aviation-primary">
              Company Profile
            </h1>

            <p className="mt-4 text-aviation-muted">
              We could not find your supplier profile.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-aviation-light p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div>
          <h1 className="text-4xl font-bold text-aviation-primary">
            Company Profile
          </h1>

          <p className="mt-2 text-aviation-muted">
            Manage and view your supplier company information.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3"><HybridAccountCard activeRole="supplier" /><Link href="/account/company" className="inline-flex min-h-11 items-center rounded-xl bg-aviation-primary px-4 py-2.5 text-sm font-semibold text-white">Edit company account</Link></div>

        {/* =====================================================
            COMPANY OVERVIEW
        ===================================================== */}

        <section className="mt-8 rounded-2xl bg-white p-4 sm:p-8 shadow-sm">

          <div className="flex flex-col gap-5 md:flex-row md:items-center">

            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-aviation-primary text-white">
              <Building2 size={36} />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-aviation-dark">
                {profile.company_name || "Company Name Not Provided"}
              </h2>

              <p className="mt-1 text-aviation-muted">
                {profile.business_type || "Supplier"}
              </p>

              {profile.country && (
                <div className="mt-2 flex items-center gap-2 text-sm text-aviation-muted">
                  <MapPin size={16} />
                  {profile.city
                    ? `${profile.city}, ${profile.country}`
                    : profile.country}
                </div>
              )}
            </div>

          </div>

        </section>

        {/* =====================================================
            COMPANY INFORMATION
        ===================================================== */}

        <section className="mt-8 rounded-2xl bg-white p-4 sm:p-8 shadow-sm">

          <div className="flex items-center gap-3">

            <Building2
              size={22}
              className="text-aviation-primary"
            />

            <h2 className="text-2xl font-bold text-aviation-primary">
              Company Information
            </h2>

          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">

            <ProfileField
              icon={<Building2 size={18} />}
              label="Company Name"
              value={profile.company_name}
            />

            <ProfileField
              icon={<Briefcase size={18} />}
              label="Business Type"
              value={profile.business_type}
            />

            <ProfileField
              icon={<FileText size={18} />}
              label="Registration Number"
              value={profile.registration_number}
            />

            <ProfileField
              icon={<Globe size={18} />}
              label="Website"
              value={profile.website}
              isLink
            />

          </div>

        </section>

        {/* =====================================================
            CONTACT PERSON
        ===================================================== */}

        <section className="mt-8 rounded-2xl bg-white p-4 sm:p-8 shadow-sm">

          <div className="flex items-center gap-3">

            <User
              size={22}
              className="text-aviation-primary"
            />

            <h2 className="text-2xl font-bold text-aviation-primary">
              Contact Person
            </h2>

          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">

            <ProfileField
              icon={<User size={18} />}
              label="Full Name"
              value={profile.full_name}
            />

            <ProfileField
              icon={<Briefcase size={18} />}
              label="Job Title"
              value={profile.job_title}
            />

            <ProfileField
              icon={<Mail size={18} />}
              label="Email"
              value={profile.email}
            />

            <ProfileField
              icon={<Phone size={18} />}
              label="Phone"
              value={profile.phone}
            />

          </div>

        </section>

        {/* =====================================================
            LOCATION
        ===================================================== */}

        <section className="mt-8 rounded-2xl bg-white p-4 sm:p-8 shadow-sm">

          <div className="flex items-center gap-3">

            <MapPin
              size={22}
              className="text-aviation-primary"
            />

            <h2 className="text-2xl font-bold text-aviation-primary">
              Business Location
            </h2>

          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">

            <ProfileField
              icon={<MapPin size={18} />}
              label="Address"
              value={profile.address}
            />

            <ProfileField
              icon={<MapPin size={18} />}
              label="City"
              value={profile.city}
            />

            <ProfileField
              icon={<MapPin size={18} />}
              label="Country"
              value={profile.country}
            />

          </div>

        </section>

        {/* =====================================================
            SUPPLIER CATEGORIES
        ===================================================== */}

        <section className="mt-8 rounded-2xl bg-white p-4 sm:p-8 shadow-sm">

          <div className="flex items-center gap-3">

            <Tags
              size={22}
              className="text-aviation-primary"
            />

            <h2 className="text-2xl font-bold text-aviation-primary">
              Supplier Categories
            </h2>

          </div>

          {profile.supplier_categories &&
          profile.supplier_categories.length > 0 ? (

            <div className="mt-6 flex flex-wrap gap-3">

              {profile.supplier_categories.map(
                (category, index) => (
                  <span
                    key={`${category}-${index}`}
                    className="rounded-full bg-aviation-success-soft px-4 py-2 text-sm font-medium text-aviation-primary"
                  >
                    {category}
                  </span>
                )
              )}

            </div>

          ) : (

            <p className="mt-6 text-aviation-muted">
              No supplier categories provided.
            </p>

          )}

        </section>

      </div>
    </main>
  );
}

/* ==========================================================
   PROFILE FIELD
========================================================== */

function ProfileField({
  icon,
  label,
  value,
  isLink = false,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  isLink?: boolean;
}) {
  return (
    <div>

      <div className="flex items-center gap-2 text-sm font-medium text-aviation-muted">
        <span className="text-aviation-primary">
          {icon}
        </span>

        {label}
      </div>

      <div className="mt-2 rounded-xl border bg-aviation-light p-4">

        {value ? (

          isLink ? (
            <a
              href={
                value.startsWith("http")
                  ? value
                  : `https://${value}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-aviation-primary hover:underline"
            >
              {value}
            </a>
          ) : (
            <span className="font-medium text-aviation-dark">
              {value}
            </span>
          )

        ) : (

          <span className="text-aviation-muted">
            Not provided
          </span>

        )}

      </div>

    </div>
  );
}