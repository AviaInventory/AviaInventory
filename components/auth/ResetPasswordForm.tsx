"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logoutUser, updatePassword } from "@/lib/auth";
import { PASSWORD_MAX_LENGTH, PASSWORD_REQUIREMENTS_TEXT, isStrongPassword } from "@/lib/password-policy";
import { PasswordChecklist, PasswordInput } from "./PasswordInput";

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
    <div>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-aviation-primary">Choose a new password</h1>
        <p className="mt-3 text-aviation-muted">{PASSWORD_REQUIREMENTS_TEXT}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
        <div>
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
          />
          <div className="mt-3 rounded-xl bg-aviation-light p-4">
            <PasswordChecklist id="password-rules" password={password} />
          </div>
        </div>

        <div>
          <PasswordInput
            id="confirmPassword"
            label="Confirm new password"
            required
            maxLength={PASSWORD_MAX_LENGTH}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
          {confirmPassword.length > 0 && (
            <p className={`mt-2 text-sm ${matches ? "text-aviation-success" : "text-aviation-error"}`}>
              {matches ? "Passwords match." : "Passwords do not match."}
            </p>
          )}
        </div>

        {error && (
          <div role="alert" className="rounded-xl bg-aviation-error-soft p-4 text-sm text-aviation-error">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !strong || !matches}
          className="w-full rounded-xl bg-aviation-primary py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Saving..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
