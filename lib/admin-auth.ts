import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "aviainventory_admin";
const MAX_AGE_SECONDS = 60 * 60 * 8;

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured.");
  }

  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSecret())
    .update(value)
    .digest("hex");
}

export function createAdminSessionToken() {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  return `${timestamp}.${sign(timestamp)}`;
}

export function isValidAdminSessionToken(token?: string) {
  if (!token) return false;

  const [timestamp, signature] = token.split(".");
  if (!timestamp || !signature) return false;

  const issuedAt = Number(timestamp);
  if (!Number.isFinite(issuedAt)) return false;

  const age = Math.floor(Date.now() / 1000) - issuedAt;
  if (age < 0 || age > MAX_AGE_SECONDS) return false;

  const expected = sign(timestamp);

  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

export function validateAdminCredentials(
  username: string,
  password: string
) {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    throw new Error(
      "ADMIN_USERNAME and ADMIN_PASSWORD are not configured."
    );
  }

  return (
    username.trim() === expectedUsername &&
    password === expectedPassword
  );
}

export async function requireAdminSession() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isValidAdminSessionToken(token)) {
    const { redirect } = await import("next/navigation");
    redirect("/platform-console/login");
  }
}
