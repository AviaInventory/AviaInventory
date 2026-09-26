"use client";

import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  loginUser,
  getCurrentProfile,
} from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      /* ======================================================
         LOGIN
      ====================================================== */

      const result = await loginUser(
        email.trim(),
        password
      );

      console.log(
        "LOGIN RESULT:",
        result
      );

      if (!result.success || !result.user) {
        setError(
          result.error?.message ??
            "Unable to login. Please check your email and password."
        );

        return;
      }

      const user = result.user;

      console.log(
        "AUTHENTICATED USER:",
        user.id
      );

      console.log(
        "AUTHENTICATED EMAIL:",
        user.email
      );

      console.log(
        "USER METADATA:",
        user.user_metadata
      );

      /* ======================================================
         GET DATABASE PROFILE
      ====================================================== */

      const profile =
        await getCurrentProfile();

      console.log(
        "PROFILE FROM DATABASE:",
        profile
      );

      /* ======================================================
         DETERMINE ACCOUNT TYPE

         Database profile takes priority.

         Auth metadata is only used as a fallback.
      ====================================================== */

      const rawAccountType =
        profile?.account_type ??
        user.user_metadata?.account_type;

      const accountType =
        typeof rawAccountType === "string"
          ? rawAccountType
              .trim()
              .toLowerCase()
          : null;

      console.log(
        "ACCOUNT TYPE:",
        accountType
      );

      /* ======================================================
         NO ACCOUNT TYPE
      ====================================================== */

      if (!accountType) {
        console.error(
          "ACCOUNT TYPE NOT FOUND FOR USER:",
          user.id
        );

        setError(
          "Your account type could not be determined. Please contact support."
        );

        return;
      }

      /* ======================================================
         BUYER
      ====================================================== */

      if (accountType === "buyer") {
        console.log(
          "BUYER LOGIN SUCCESS:",
          user.id
        );

        router.replace(
          "/buyer/dashboard"
        );

        return;
      }

      /* ======================================================
         SUPPLIER
      ====================================================== */

      if (accountType === "supplier") {
        console.log(
          "SUPPLIER LOGIN SUCCESS:",
          user.id
        );

        router.replace(
          "/supplier/dashboard"
        );

        return;
      }

      /* ======================================================
         ADMIN
      ====================================================== */

      if (accountType === "admin") {
        console.log(
          "ADMIN LOGIN SUCCESS:",
          user.id
        );

        router.replace(
          "/admin/dashboard"
        );

        return;
      }

      /* ======================================================
         UNKNOWN ACCOUNT TYPE
      ====================================================== */

      console.error(
        "UNKNOWN ACCOUNT TYPE:",
        accountType,
        "USER:",
        user.id
      );

      setError(
        `Unknown account type: ${accountType}`
      );

    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      setError(
        "Something went wrong while signing in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="text-center">

        <h1 className="text-4xl font-bold text-aviation-primary">
          Welcome Back
        </h1>

        <p className="mt-3 text-aviation-muted">
          Sign in to your AviaInventory account.
        </p>

      </div>

      {/* ====================================================
          LOGIN FORM
      ==================================================== */}

      <form
        onSubmit={handleLogin}
        className="mt-10 space-y-6"
      >

        {/* ==================================================
            EMAIL
        ================================================== */}

        <div>

          <label
            htmlFor="email"
            className="mb-2 block font-medium"
          >
            Email Address
          </label>

          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            disabled={loading}
            className="w-full rounded-xl border border-aviation-border px-4 py-3 outline-none transition focus:border-aviation-border disabled:bg-aviation-light"
          />

        </div>

        {/* ==================================================
            PASSWORD
        ================================================== */}

        <div>

          <label
            htmlFor="password"
            className="mb-2 block font-medium"
          >
            Password
          </label>

          <div className="relative">

            <input
              id="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              disabled={loading}
              className="w-full rounded-xl border border-aviation-border px-4 py-3 pr-12 outline-none transition focus:border-aviation-border disabled:bg-aviation-light"
            />

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                setShowPassword(
                  (prev) => !prev
                )
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-aviation-muted hover:text-aviation-primary disabled:opacity-50"
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>

          </div>

        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div
            role="alert"
            className="rounded-xl bg-aviation-error-soft p-4 text-sm text-aviation-error"
          >
            {error}
          </div>
        )}

        {/* ==================================================
            SUBMIT
        ================================================== */}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-aviation-primary py-3 font-semibold text-white transition hover:bg-aviation-primary disabled:cursor-not-allowed disabled:opacity-50"
        >

          <LogIn size={18} />

          {loading
            ? "Signing In..."
            : "Login"}

        </button>

      </form>

      {/* ====================================================
          REGISTER
      ==================================================== */}

      <div className="mt-8 text-center text-sm text-aviation-muted">

        Don't have an account?{" "}

        <a
          href="/register"
          className="font-semibold text-aviation-primary hover:underline"
        >
          Create one
        </a>

      </div>

    </div>
  );
}