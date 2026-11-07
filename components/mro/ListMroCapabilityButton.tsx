"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Store } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useSessionProfile } from "@/components/layout/useSessionProfile";
import MroCapabilityDialog from "@/components/mro/MroCapabilityDialog";
import { EMPTY_MRO_PROFILE, readMroDraft, writeMroDraft, type MroProfile } from "@/lib/mro-form";
import { loadOwnMroProfile, saveOwnMroProfile } from "@/lib/mro-profiles";

/**
 * "List your MRO capability": opens the MRO form straight away.
 * - Signed-in suppliers save it to their listing.
 * - Visitors fill it in first, then create their account; the answers go with the sign-up.
 */
export default function ListMroCapabilityButton({ className }: { className?: string }) {
  const router = useRouter();
  const session = useSessionProfile();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState<MroProfile>(EMPTY_MRO_PROFILE);
  const [supplierId, setSupplierId] = useState<string | null>(null);

  async function openForm() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user && session?.roles.includes("supplier")) {
      setSupplierId(user.id);
      setInitial((await loadOwnMroProfile(supabase, user.id)) ?? EMPTY_MRO_PROFILE);
    } else {
      setSupplierId(user ? "" : null);
      setInitial(readMroDraft() ?? EMPTY_MRO_PROFILE);
    }
    setLoading(false);
    setOpen(true);
  }

  const close = useCallback(() => setOpen(false), []);

  async function submit(profile: MroProfile) {
    if (supplierId) {
      const error = await saveOwnMroProfile(supabase, profile);
      if (error) return error;
      toast.success("Your MRO capabilities are saved and listed on MRO Services.");
      setOpen(false);
      router.refresh();
      return;
    }
    if (supplierId === "") return "Only supplier accounts can list MRO capabilities. Add selling to your account in Account settings first.";
    // Visitor: keep the answers in this browser and carry on to create the account.
    writeMroDraft(profile);
    router.push("/register?type=supplier&mro=1");
  }

  const signedOut = supplierId === null;

  return (
    <>
      <button type="button" onClick={openForm} disabled={loading || session === undefined} className={className}>
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Store size={18} />} List your MRO capability
      </button>
      <MroCapabilityDialog
        open={open}
        initial={initial}
        onClose={close}
        onSubmit={submit}
        submitLabel={signedOut ? "Continue to create account" : "Save MRO capabilities"}
        intro={signedOut
          ? "Fill in your capabilities and approvals, then create your free account. Your answers are kept, so you won't enter them twice."
          : undefined}
      />
    </>
  );
}
