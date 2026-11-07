import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeMroProfile, type MroProfile, type PublicMroApproval, type PublicMroProfile } from "@/lib/mro-form";

type Row = {
  supplier_id: string;
  capabilities: string[] | null;
  component_notes: string | null;
  aircraft_types: string | null;
  aog_response_hours: number | string | null;
  other_locations: string | null;
  approvals: PublicMroApproval[] | null;
};

/**
 * MRO profiles for the given suppliers, keyed by supplier id. Certificate details are only
 * included when the client is signed in (the database withholds them otherwise).
 * Returns an empty map on error so pages still render.
 */
export async function fetchMroProfiles(client: SupabaseClient, supplierIds: string[]): Promise<Map<string, PublicMroProfile>> {
  const result = new Map<string, PublicMroProfile>();
  if (!supplierIds.length) return result;
  const { data, error } = await client.rpc("get_mro_profiles", { p_supplier_ids: supplierIds.slice(0, 100) });
  if (error) {
    console.error("GET MRO PROFILES ERROR:", error.message);
    return result;
  }
  for (const row of (data ?? []) as Row[]) {
    result.set(row.supplier_id, {
      supplierId: row.supplier_id,
      capabilities: row.capabilities ?? [],
      componentNotes: row.component_notes,
      aircraftTypes: row.aircraft_types,
      aogResponseHours: row.aog_response_hours == null ? null : Number(row.aog_response_hours),
      otherLocations: row.other_locations,
      approvals: row.approvals ?? [],
    });
  }
  return result;
}

/** The signed-in supplier's own saved answers, ready for the form (null when none saved). */
export async function loadOwnMroProfile(client: SupabaseClient, supplierId: string): Promise<MroProfile | null> {
  const { data, error } = await client
    .from("mro_profiles")
    .select("capabilities, component_notes, aircraft_types, aog_response_hours, other_locations, approvals")
    .eq("supplier_id", supplierId)
    .maybeSingle();
  if (error) {
    console.error("LOAD MRO PROFILE ERROR:", error.message);
    return null;
  }
  if (!data) return null;
  return normalizeMroProfile({
    capabilities: data.capabilities,
    componentNotes: data.component_notes ?? "",
    aircraftTypes: data.aircraft_types ?? "",
    aogResponseHours: data.aog_response_hours == null ? "" : String(data.aog_response_hours),
    otherLocations: data.other_locations ?? "",
    approvals: data.approvals,
  });
}

/** Saves the signed-in supplier's answers and lists them on MRO Services. Returns an error message on failure. */
export async function saveOwnMroProfile(client: SupabaseClient, profile: MroProfile): Promise<string | null> {
  const { error } = await client.rpc("save_mro_profile", { p_profile: profile });
  if (!error) return null;
  console.error("SAVE MRO PROFILE ERROR:", error.message);
  if (/only supplier accounts/i.test(error.message)) return "Only supplier accounts can list MRO capabilities. Add selling to your account in Account settings first.";
  if (/sign in/i.test(error.message)) return "Your session has ended. Sign in again to save your MRO capabilities.";
  return "Your MRO capabilities could not be saved. Please try again.";
}
