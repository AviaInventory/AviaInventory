import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset password | AviaInventory",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-aviation-light py-8 sm:py-16">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
