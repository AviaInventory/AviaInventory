"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Clock, MapPin, Plane, Wrench } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { MRO_APPROVAL_GROUP_TITLES, approvalShortName, selectedGroups, type MroApprovalGroup, type PublicMroProfile } from "@/lib/mro-form";
import { fetchMroProfiles } from "@/lib/mro-profiles";

const formatDate = (iso?: string) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

/**
 * MRO capabilities and approvals on a supplier's public page. The page is rendered for
 * everyone, so it arrives without certificate details; signed-in users load them here.
 */
export default function MroProfileDetails({ profile: initial }: { profile: PublicMroProfile }) {
  const [profile, setProfile] = useState(initial);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!active) return;
      setSignedIn(Boolean(user));
      if (!user) return;
      const full = (await fetchMroProfiles(supabase, [initial.supplierId])).get(initial.supplierId);
      if (active && full) setProfile(full);
    });
    return () => { active = false; };
  }, [initial.supplierId]);

  const groups = selectedGroups(profile.capabilities);
  const approvalGroups = (["regulatory", "quality", "oem"] as MroApprovalGroup[])
    .map((group) => ({ group, items: profile.approvals.filter((a) => a.group === group) }))
    .filter((entry) => entry.items.length > 0);
  const showDetails = profile.approvals.some((a) => a.certificateNo !== undefined);

  return (
    <section id="mro" className="mt-6 scroll-mt-6 rounded-[var(--aviation-radius-xl)] bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3"><Wrench size={20} className="text-aviation-primary" /><h2 className="text-xl font-bold text-aviation-primary">MRO capabilities &amp; approvals</h2></div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-aviation-dark">
        {profile.aogResponseHours != null && <span className="inline-flex items-center gap-2"><Clock size={15} className="text-aviation-primary" />AOG response within {profile.aogResponseHours.toLocaleString()} hours</span>}
        {profile.aircraftTypes && <span className="inline-flex items-start gap-2"><Plane size={15} className="mt-0.5 shrink-0 text-aviation-primary" />{profile.aircraftTypes}</span>}
        {profile.otherLocations && <span className="inline-flex items-start gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-aviation-primary" />{profile.otherLocations}</span>}
      </div>

      {groups.length > 0 && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {groups.map(({ group, items }) => (
            <div key={group.key} className="rounded-xl border border-aviation-border p-4">
              <h3 className="text-sm font-bold text-aviation-dark">{group.title}</h3>
              <ul className="mt-2 space-y-1 text-sm text-[var(--aviation-muted)]">
                {items.map((item) => <li key={item.key} className="flex gap-2"><span aria-hidden="true" className="text-aviation-primary">•</span>{item.label}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
      {profile.componentNotes && <p className="mt-4 rounded-lg bg-aviation-light p-3 text-sm text-aviation-dark"><span className="font-semibold">Notes and limitations: </span>{profile.componentNotes}</p>}

      {approvalGroups.length > 0 && (
        <div className="mt-6 space-y-5">
          {approvalGroups.map(({ group, items }) => (
            <div key={group}>
              <h3 className="text-sm font-bold text-aviation-dark">{MRO_APPROVAL_GROUP_TITLES[group]}</h3>
              {showDetails ? (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead><tr className="border-b border-aviation-border text-xs uppercase tracking-wide text-[var(--aviation-muted)]"><th className="py-2 pr-3 font-semibold">Approval</th><th className="py-2 pr-3 font-semibold">Certificate no.</th><th className="py-2 pr-3 font-semibold">Expiry</th><th className="py-2 font-semibold">Ratings and scope</th></tr></thead>
                    <tbody className="divide-y divide-aviation-border">
                      {items.map((a) => (
                        <tr key={`${a.group}-${a.key}`}>
                          <td className="py-2 pr-3 font-medium text-aviation-dark">{a.name}</td>
                          <td className="py-2 pr-3 font-mono text-xs">{a.certificateNo || "—"}</td>
                          <td className="py-2 pr-3">{formatDate(a.expiry)}{a.expired && <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700">Expired</span>}</td>
                          <td className="py-2 text-[var(--aviation-muted)]">{a.scope || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {items.map((a) => (
                    <span key={`${a.group}-${a.key}`} className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${a.expired ? "border-red-200 bg-red-50 text-red-700" : "border-[#0f5b6b]/25 bg-[#e8f3f4] text-[#0f5b6b]"}`}>
                      <BadgeCheck size={13} aria-hidden="true" />{approvalShortName(a)}{a.expired && " (expired)"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {signedIn === false && <p className="text-xs text-[var(--aviation-muted)]"><Link href="/login" className="font-semibold text-aviation-primary hover:underline">Sign in</Link> to see certificate numbers, expiry dates and scope.</p>}
        </div>
      )}
    </section>
  );
}
