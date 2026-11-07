import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  // When Supabase does not accept an email link's redirect URL it falls back to the
  // Site URL, so password-reset and confirmation links can arrive as `/?code=…`.
  // Hand those to the callback, which works out what kind of link it was.
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/" && searchParams.has("code")) {
    const callback = new URL("/auth/callback", request.url);
    callback.searchParams.set("code", searchParams.get("code")!);
    return NextResponse.redirect(callback);
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
