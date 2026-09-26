import { supabase } from "./supabase";
import type { AccountType, RegistrationData } from "@/types/auth";

/* ==========================================================
   REGISTER USER
========================================================== */

export async function registerUser(
  formData: RegistrationData,
  onboardingCompletion = 100
) {
  try {
    /* ========================================================
       CREATE SUPABASE AUTH USER
    ======================================================== */

    const { data, error } =
      await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,

        options: {
          data: {
            account_type: "buyer",
            account_roles: formData.accountType === "hybrid" ? ["buyer", "supplier"] : ["buyer"],
            full_name: formData.fullName,
            phone: formData.phone,
            country: formData.country,
            job_title: formData.jobTitle,
            company_name: formData.companyName,
            business_type: formData.businessType,
            website: formData.website,
            registration_number:
              formData.registrationNumber,
            address: formData.address,
            city: formData.city,
            supplier_categories:
              formData.supplierCategories,
            onboarding_status: "in_progress",
            onboarding_completion: Math.max(0, Math.min(100, onboardingCompletion)),
            onboarding_data: {
              procurementRole: formData.procurementRole,
              buyerCategories: formData.buyerCategories,
              procurementPriorities: formData.procurementPriorities,
              certificationRequirements: formData.certificationRequirements,
              preferredSupplierCriteria: formData.preferredSupplierCriteria,
              supplierType: formData.supplierType,
              supplierCategories: formData.supplierCategories,
              aircraftSpecialties: formData.aircraftSpecialties,
              geographicCoverage: formData.geographicCoverage,
              aviationCapabilities: formData.aviationCapabilities,
              certifications: formData.certifications,
              traceabilityCapabilities: formData.traceabilityCapabilities,
              qualityInformation: formData.qualityInformation,
              shippingCapabilities: formData.shippingCapabilities,
              commercialTerms: formData.commercialTerms,
              verificationNotes: formData.verificationNotes,
            },
          },
        },
      });

    if (error) {
      console.error(
        "SUPABASE SIGNUP ERROR:",
        error
      );

      return {
        success: false,
        error,
      };
    }

    const user = data.user;

    if (!user) {
      return {
        success: false,
        error: {
          message:
            "Registration failed. No user was returned.",
        },
      };
    }

    /* ========================================================
       CREATE / UPDATE PROFILE
    ======================================================== */

    const { error: profileError } =
      await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,

            account_type: "buyer",

            account_roles:
              formData.accountType === "hybrid"
                ? ["buyer", "supplier"]
                : ["buyer"],

            full_name:
              formData.fullName || null,

            email:
              formData.email || null,

            phone:
              formData.phone || null,

            country:
              formData.country || null,

            job_title:
              formData.jobTitle || null,

            company_name:
              formData.companyName || null,

            business_type:
              formData.businessType || null,

            website:
              formData.website || null,

            registration_number:
              formData.registrationNumber || null,

            address:
              formData.address || null,

            city:
              formData.city || null,

            supplier_categories:
              formData.supplierCategories || [],

            onboarding_status: "in_progress",
            onboarding_completion: Math.max(0, Math.min(100, onboardingCompletion)),
            onboarding_data: {
              procurementRole: formData.procurementRole,
              buyerCategories: formData.buyerCategories,
              procurementPriorities: formData.procurementPriorities,
              certificationRequirements: formData.certificationRequirements,
              preferredSupplierCriteria: formData.preferredSupplierCriteria,
              supplierType: formData.supplierType,
              supplierCategories: formData.supplierCategories,
              aircraftSpecialties: formData.aircraftSpecialties,
              geographicCoverage: formData.geographicCoverage,
              aviationCapabilities: formData.aviationCapabilities,
              certifications: formData.certifications,
              traceabilityCapabilities: formData.traceabilityCapabilities,
              qualityInformation: formData.qualityInformation,
              shippingCapabilities: formData.shippingCapabilities,
              commercialTerms: formData.commercialTerms,
              verificationNotes: formData.verificationNotes,
            },
          },
          {
            onConflict: "id",
          }
        );

    if (profileError) {
      console.error("PROFILE CREATION ERROR:",{message:profileError?.message,details:profileError?.details,hint:profileError?.hint,code:profileError?.code});

      return {
        success: false,
        error: profileError,
      };
    }

    /* ========================================================
       CREATE / UPDATE BUYER PROFILE
    ======================================================== */

    if (
      formData.accountType === "buyer" ||
      formData.accountType === "hybrid"
    ) {
      const { error: buyerError } =
        await supabase
          .from("buyers")
          .upsert(
            {
              id: user.id,

              company_name:
                formData.companyName || null,

              business_type:
                formData.businessType || null,

              website:
                formData.website || null,

              registration_number:
                formData.registrationNumber || null,

              job_title:
                formData.jobTitle || null,

              address:
                formData.address || null,

              city:
                formData.city || null,
            },
            {
              onConflict: "id",
            }
          );

      if (buyerError) {
        console.error(
          "BUYER CREATION ERROR:",
          buyerError
        );

        return {
          success: false,
          error: buyerError,
        };
      }
    }

    /* ========================================================
       CREATE / UPDATE SUPPLIER PROFILE
    ======================================================== */

    if (formData.accountType === "hybrid") {
      const { error: supplierError } =
        await supabase
          .from("suppliers")
          .upsert(
            {
              id: user.id,

              company_name:
                formData.companyName || null,

              business_type:
                formData.businessType || null,

              website:
                formData.website || null,

              registration_number:
                formData.registrationNumber || null,

              address:
                formData.address || null,

              city:
                formData.city || null,

              supplier_categories:
                formData.supplierCategories || [],
            },
            {
              onConflict: "id",
            }
          );

      if (supplierError) {
        console.error(
          "SUPPLIER CREATION ERROR:",
          supplierError
        );

        return {
          success: false,
          error: supplierError,
        };
      }
    }

    /* ========================================================
       SUCCESS
    ======================================================== */

    return {
      success: true,
      user,
      accountType: "buyer",
      accountRoles:
        formData.accountType === "hybrid"
          ? ["buyer", "supplier"]
          : ["buyer"],
    };

  } catch (error) {
    console.error(
      "REGISTER USER ERROR:",
      error
    );

    return {
      success: false,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Unable to register user.",
      },
    };
  }
}


/* ==========================================================
   LOGIN USER
========================================================== */

export async function loginUser(
  email: string,
  password: string
) {
  try {
    /* ========================================================
       SUPABASE LOGIN
    ======================================================== */

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      return {
        success: false,
        error,
      };
    }

    const user = data.user;

    if (!user) {
      return {
        success: false,
        error: {
          message:
            "Login failed. No user was returned.",
        },
      };
    }

    /* ========================================================
       GET PROFILE
    ======================================================== */

    // Keep login compatible with databases where the hybrid-account
    // migration has not been applied yet. account_type is the legacy
    // source of truth; account_roles is an optional enhancement.
    const {
      data: profileBase,
      error: profileBaseError,
    } = await supabase
      .from("profiles")
      .select(`
        id,
        account_type,
        full_name,
        email
      `)
      .eq("id", user.id)
      .maybeSingle();

    if (profileBaseError) {
      console.error(
        "LOGIN PROFILE ERROR:",
        {
          message: profileBaseError?.message,
          details: profileBaseError?.details,
          hint: profileBaseError?.hint,
          code: profileBaseError?.code,
        }
      );

      await supabase.auth.signOut();

      return {
        success: false,
        error: {
          message:
            "Unable to load your account profile.",
        },
      };
    }

    /* ========================================================
       PROFILE DOES NOT EXIST
    ======================================================== */

    const profile = profileBase ? { ...profileBase, account_roles: undefined as string[] | undefined } : null;

    // Read account_roles separately so an older database schema does not
    // prevent an otherwise valid user from logging in.
    if (profile) {
      const { data: roleData, error: roleError } = await supabase
        .from("profiles")
        .select("account_roles")
        .eq("id", user.id)
        .maybeSingle();

      if (!roleError && roleData && Array.isArray(roleData.account_roles)) {
        profile.account_roles = roleData.account_roles;
      }
    }

    if (!profile) {
      console.error(
        "PROFILE NOT FOUND FOR USER:",
        user.id
      );

      await supabase.auth.signOut();

      return {
        success: false,
        error: {
          message:
            "Your account profile could not be found. Please contact support.",
        },
      };
    }

    /* ========================================================
       VALIDATE ACCOUNT TYPE
    ======================================================== */

    const roles = Array.isArray(profile.account_roles) && profile.account_roles.length
      ? profile.account_roles
      : [profile.account_type];

    if (
      !roles.some((role) => ["buyer", "supplier", "admin"].includes(role))
    ) {
      console.error(
        "INVALID ACCOUNT TYPE:",
        profile.account_type
      );

      await supabase.auth.signOut();

      return {
        success: false,
        error: {
          message:
            "Your account type is invalid. Please contact support.",
        },
      };
    }

    /* ========================================================
       BUYER PROFILE VALIDATION
    ======================================================== */

    if (
      roles.includes("buyer")
    ) {
      const {
        data: buyer,
        error: buyerError,
      } = await supabase
        .from("buyers")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (buyerError) {
        console.error(
          "BUYER PROFILE CHECK ERROR:",
          buyerError
        );

        await supabase.auth.signOut();

        return {
          success: false,
          error: {
            message:
              "Unable to verify your buyer account.",
          },
        };
      }

      if (!buyer) {
        console.error(
          "BUYER PROFILE NOT FOUND FOR USER:",
          user.id
        );

        await supabase.auth.signOut();

        return {
          success: false,
          error: {
            message:
              "Your buyer profile could not be found. Please contact support.",
          },
        };
      }
    }

    /* ========================================================
       SUPPLIER PROFILE VALIDATION
    ======================================================== */

    if (
      roles.includes("supplier")
    ) {
      const {
        data: supplier,
        error: supplierError,
      } = await supabase
        .from("suppliers")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (supplierError) {
        console.error(
          "SUPPLIER PROFILE CHECK ERROR:",
          supplierError
        );

        await supabase.auth.signOut();

        return {
          success: false,
          error: {
            message:
              "Unable to verify your supplier account.",
          },
        };
      }

      if (!supplier) {
        console.error(
          "SUPPLIER PROFILE NOT FOUND FOR USER:",
          user.id
        );

        await supabase.auth.signOut();

        return {
          success: false,
          error: {
            message:
              "Your supplier profile could not be found. Please contact support.",
          },
        };
      }
    }

    /* ========================================================
       LOGIN SUCCESS
    ======================================================== */

    return {
      success: true,
      user,
      profile,
      accountType:
        profile.account_type,
      accountRoles: roles,
    };

  } catch (error) {
    console.error(
      "LOGIN USER ERROR:",
      error
    );

    return {
      success: false,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Unable to login.",
      },
    };
  }
}


/* ==========================================================
   LOGOUT USER
========================================================== */

export async function logoutUser() {
  try {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "LOGOUT ERROR:",
        error
      );

      return {
        success: false,
        error,
      };
    }

    return {
      success: true,
    };

  } catch (error) {
    console.error(
      "LOGOUT USER ERROR:",
      error
    );

    return {
      success: false,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Unable to logout.",
      },
    };
  }
}


/* ==========================================================
   CURRENT USER
========================================================== */

export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error(
        "GET CURRENT USER ERROR:",
        error
      );

      return null;
    }

    if (!user) {
      return null;
    }

    return user;

  } catch (error) {
    console.error(
      "GET CURRENT USER ERROR:",
      error
    );

    return null;
  }
}


/* ==========================================================
   CURRENT PROFILE
========================================================== */

export async function getCurrentProfile() {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        "GET CURRENT PROFILE USER ERROR:",
        userError
      );

      return null;
    }

    if (!user) {
      return null;
    }

    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "GET CURRENT PROFILE ERROR:",
        error
      );

      return null;
    }

    return data;

  } catch (error) {
    console.error(
      "GET CURRENT PROFILE ERROR:",
      error
    );

    return null;
  }
}


/* ==========================================================
   GET CURRENT ACCOUNT TYPE
========================================================== */

export async function getCurrentAccountType(): Promise<AccountType | null> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "GET ACCOUNT TYPE ERROR:",
        profileError
      );

      return null;
    }

    if (
      profile?.account_type !== "buyer" &&
      profile?.account_type !== "supplier" &&
      profile?.account_type !== "admin"
    ) {
      return null;
    }

    return profile.account_type;

  } catch (error) {
    console.error(
      "GET ACCOUNT TYPE ERROR:",
      error
    );

    return null;
  }
}