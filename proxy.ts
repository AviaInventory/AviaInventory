import { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(
  request: NextRequest
) {
  console.log(
    "PROXY RUNNING:",
    request.nextUrl.pathname
  );

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};