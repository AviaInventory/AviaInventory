// lib/supabase.ts

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
);

/*
 * Speed: in the browser, "who is signed in?" is answered from the stored session instead
 * of a network round trip. Many components ask on every page load; each network call
 * waited for the previous one (supabase-js serialises auth calls), which delayed page data
 * by several seconds. This is safe for the browser: the database still verifies the JWT on
 * every request (RLS). Server code uses lib/supabase/server and keeps verifying with Auth.
 */
const verifyWithAuthServer = supabase.auth.getUser.bind(supabase.auth);
supabase.auth.getUser = (async (jwt?: string) => {
  if (jwt) return verifyWithAuthServer(jwt);
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) return { data: { user: data.session.user }, error: null };
  return verifyWithAuthServer();
}) as typeof supabase.auth.getUser;
