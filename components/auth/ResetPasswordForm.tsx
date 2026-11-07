"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { logoutUser, updatePassword } from "@/lib/auth";
import { PASSWORD_MAX_LENGTH, PASSWORD_REQUIREMENTS_TEXT, isStrongPassword } from "@/lib/password-policy";
import { PasswordChecklist, PasswordInput } from "./PasswordInput";
import { btnPrimary } from "@/components/ui/form";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strong = isStrongPassword(password);
  const matches = confirmPassword.length > 0 && password === confirmPassword;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    if (!strong) {
      setError(PASSWORD_REQUIREMENTS_TEXT);
      return;
    }
    if (!matches) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);
    const result = await updatePassword(password);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // End the recovery session so the user proves the new password works.
    await logoutUser();
    router.replace("/login?message=password-updated");
  }

  return (
    <div className="compact-form overflow-hidden rounded-xl border border-aviation-border bg-white shadow-sm">
      <div className="flex items-center gap-3 bg-aviation-dark px-5 py-4 text-white sm:px-7">
        <KeyRound size={20} aria-hidden="true" />
        <div>
          <h1 className="text-xl font-bold text-white">Choose a new password</h1>
          <p className="text-xs text-white/70">{PASSWORD_REQUIREMENTS_TEXT}</p>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-7 sm:py-6">
        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          <PasswordInput
            id="password"
            label="New password"
            required
            maxLength={PASSWORD_MAX_LENGTH}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            aria-describedby="password-rules"
          >
            <div className="mt-2 rounded-md bg-aviation-light px-3 py-2 text-xs [&_ul]:text-xs">
              <PasswordChecklist id="password-rules" password={password} />
            </div>
          </PasswordInput>

          <PasswordInput
            id="confirmPassword"
            label="Confirm new password"
            required
            maxLength={PASSWORD_MAX_LENGTH}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          >
            {confirmPassword.length > 0 && (
              <p className={`mt-1 text-xs ${matches ? "text-aviation-success" : "text-aviation-error"}`}>
                {matches ? "Passwords match." : "Passwords do not match."}
              </p>
            )}
          </PasswordInput>

          {error && (
            <div role="alert" className="rounded-md bg-aviation-error-soft px-3 py-2 text-[13px] text-aviation-error">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-aviation-border pt-4 sm:flex-row sm:items-center sm:justify-end">
            <button type="submit" disabled={loading || !strong || !matches} className={`${btnPrimary} px-5`}>
              <KeyRound size={15} aria-hidden="true" />
              {loading ? "Saving..." : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
