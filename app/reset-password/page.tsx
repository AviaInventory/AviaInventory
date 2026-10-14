import type { Metadata } from "next";
import Link from "next/link";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

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
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        {user ? (
          <ResetPasswordForm />
        ) : (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-aviation-primary">Reset link expired</h1>
            <p className="mt-3 text-aviation-muted">
              This password reset link is no longer valid. Request a new one to continue.
            </p>
            <Link
              href="/forgot-password"
              className="mt-8 inline-block rounded-xl bg-aviation-primary px-6 py-3 font-semibold text-white"
            >
              Request a new link
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
