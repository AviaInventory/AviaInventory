import { supabase } from "./supabase";
import { resolveRoles, type AccountRole } from "./auth-redirect";
import type { RegistrationData } from "@/types/auth";

// Browser-side auth actions. Every function resolves to an AuthResult instead of
// throwing, so forms can render `error` directly.

export type AuthResult<T = object> =
  | ({ success: true } & T)
  | { success: false; error: string };

function failure(error: unknown, fallback: string): { success: false; error: string } {
  const message =
    error && typeof error === "object" && "message" in error && typeof error.message === "string"
      ? error.message
      : fallback;
  return { success: false, error: message };
}

/**
 * Where Supabase email links land. `flow=signup` makes /auth/callback confirm the email
 * and then ask the user to sign in, which proves they own the address.
 */
function authCallbackUrl(params: { next?: string; flow?: "signup" } = {}): string {
  const url = new URL("/auth/callback", window.location.origin);
  if (params.next) url.searchParams.set("next", params.next);
  if (params.flow) url.searchParams.set("flow", params.flow);
  return url.toString();
}

/* ---------------------------------------------------------------------------
   Registration
   The profile, buyer and supplier rows are created by the database trigger
   `handle_new_auth_user` from the metadata below, so registration works whether
   or not email confirmation is enabled.
--------------------------------------------------------------------------- */

export async function registerUser(
  form: RegistrationData,
  onboardingCompletion = 100,
): Promise<AuthResult<{ needsEmailConfirmation: boolean; roles: AccountRole[] }>> {
  const roles: AccountRole[] = form.accountType === "hybrid" ? ["buyer", "supplier"] : ["buyer"];

  const { data, error } = await supabase.auth.signUp({
    email: form.email.trim(),
    password: form.password,
    options: {
      emailRedirectTo: authCallbackUrl({ flow: "signup" }),
      data: {
        account_roles: roles,
        full_name: form.fullName,
        phone: form.phone,
        country: form.country,
        job_title: form.jobTitle,
        company_name: form.companyName,
        business_type: form.businessType,
        website: form.website,
        registration_number: form.registrationNumber,
        address: form.address,
        city: form.city,
        supplier_categories: form.supplierCategories,
        onboarding_completion: Math.max(0, Math.min(100, Math.round(onboardingCompletion))),
        onboarding_data: {
          procurementRole: form.procurementRole,
          buyerCategories: form.buyerCategories,
          procurementPriorities: form.procurementPriorities,
          certificationRequirements: form.certificationRequirements,
          preferredSupplierCriteria: form.preferredSupplierCriteria,
          supplierType: form.supplierType,
          supplierCategories: form.supplierCategories,
          aircraftSpecialties: form.aircraftSpecialties,
          geographicCoverage: form.geographicCoverage,
          aviationCapabilities: form.aviationCapabilities,
          certifications: form.certifications,
          traceabilityCapabilities: form.traceabilityCapabilities,
          qualityInformation: form.qualityInformation,
          shippingCapabilities: form.shippingCapabilities,
          commercialTerms: form.commercialTerms,
          verificationNotes: form.verificationNotes,
          // Opt-in for promotions (Data Protection Act s.37); keep when it was given.
          marketingConsent: form.subscribeNewsletter,
          marketingConsentAt: form.subscribeNewsletter ? new Date().toISOString() : null,
        },
      },
    },
  });

  if (error) return failure(error, "Unable to create your account.");

  // With email confirmation on, Supabase returns a user with an empty `identities`
  // array (and no error) when the address is already registered.
  if (data.user && data.user.identities?.length === 0) {
    return { success: false, error: "An account with this email already exists. Try signing in or resetting your password." };
  }

  return { success: true, needsEmailConfirmation: !data.session, roles };
}

export async function resendConfirmationEmail(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: { emailRedirectTo: authCallbackUrl({ flow: "signup" }) },
  });
  return error ? failure(error, "Unable to resend the confirmation email.") : { success: true };
}

/* ---------------------------------------------------------------------------
   Sign in / out
--------------------------------------------------------------------------- */

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResult<{ roles: AccountRole[] }>> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { success: false, error: "Please confirm your email address first. Check your inbox for the confirmation link." };
    }
    return failure(error, "Unable to sign in. Please check your email and password.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("account_type, account_roles")
    .eq("id", data.user.id)
    .maybeSingle();

  const roles = resolveRoles(profile);

  if (profileError || roles.length === 0) {
    await supabase.auth.signOut();
    return { success: false, error: "We couldn't load your account profile. Please contact support." };
  }

  return { success: true, roles };
}

export async function logoutUser(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  return error ? failure(error, "Unable to sign out.") : { success: true };
}

/* ---------------------------------------------------------------------------
   Password reset
   1. requestPasswordReset asks /api/auth/password-reset, which checks the email is
      registered and emails a link to /auth/callback?next=/reset-password
   2. the callback exchanges it for a session
   3. updatePassword sets the new password for that session
--------------------------------------------------------------------------- */

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    const response = await fetch("/api/auth/password-reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    if (response.ok) return { success: true };
    const body = await response.json().catch(() => ({}));
    return { success: false, error: body.error ?? "Unable to send the reset email." };
  } catch {
    return { success: false, error: "Unable to reach the server. Check your connection and try again." };
  }
}

export async function updatePassword(password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password });
  return error ? failure(error, "Unable to update your password.") : { success: true };
}
