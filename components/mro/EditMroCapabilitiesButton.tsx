"use client";

import { useCallback, useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import MroCapabilityDialog from "@/components/mro/MroCapabilityDialog";
import { EMPTY_MRO_PROFILE, type MroProfile } from "@/lib/mro-form";
import { loadOwnMroProfile, saveOwnMroProfile } from "@/lib/mro-profiles";

/** Account settings: open and save the supplier's MRO Capabilities & Approvals form. */
export default function EditMroCapabilitiesButton({ supplierId, onSaved }: { supplierId: string; onSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState<MroProfile>(EMPTY_MRO_PROFILE);

  async function openForm() {
    setLoading(true);
    setInitial((await loadOwnMroProfile(supabase, supplierId)) ?? EMPTY_MRO_PROFILE);
    setLoading(false);
    setOpen(true);
  }

  const close = useCallback(() => setOpen(false), []);

  async function submit(profile: MroProfile) {
    const error = await saveOwnMroProfile(supabase, profile);
    if (error) return error;
    toast.success("MRO capabilities saved. You are listed on MRO Services.");
    setOpen(false);
    onSaved?.();
  }

  return (
    <>
      <button type="button" onClick={openForm} disabled={loading} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-aviation-primary px-4 py-2 text-sm font-semibold text-aviation-primary hover:bg-aviation-light disabled:opacity-60">
        {loading ? <Loader2 size={15} className="animate-spin" /> : <ClipboardList size={15} />} Edit MRO capabilities &amp; approvals
      </button>
      <MroCapabilityDialog open={open} initial={initial} onClose={close} onSubmit={submit} submitLabel="Save MRO capabilities" />
    </>
  );
}
