import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";
import { btnPrimary } from "@/components/ui/form";

export const metadata: Metadata = {
  title: "Choose a new password | AviaInventory",
  robots: { index: false },
};

// Reached from the reset email via /auth/callback, which signs the user in first.
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-aviation-light py-8 sm:py-16">
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        {user ? (
          <ResetPasswordForm />
        ) : (
          <div className="compact-form overflow-hidden rounded-xl border border-aviation-border bg-white shadow-sm">
            <div className="flex items-center gap-3 bg-aviation-dark px-5 py-4 text-white sm:px-7">
              <KeyRound size={20} aria-hidden="true" />
              <div>
                <h1 className="text-xl font-bold text-white">Reset link expired</h1>
                <p className="text-xs text-white/70">Request a new one to continue.</p>
              </div>
            </div>
            <div className="space-y-4 px-5 py-5 sm:px-7 sm:py-6">
              <p className="text-[13px] leading-6 text-aviation-dark">
                This password reset link is no longer valid. Request a new one to continue.
              </p>
              <div className="flex justify-end border-t border-aviation-border pt-4">
                <Link href="/forgot-password" className={`${btnPrimary} px-5`}>
                  Request a new link
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
