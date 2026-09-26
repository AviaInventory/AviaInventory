import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  createAdminSessionToken,
  validateAdminCredentials,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = typeof body.username === "string" ? body.username : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!validateAdminCredentials(username, password)) {
      return NextResponse.json(
        { success: false, error: "Invalid administrator credentials." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set(ADMIN_COOKIE, createAdminSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Unable to sign in as administrator." },
      { status: 500 }
    );
  }
}
