"use client";

import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Whether a user is signed in, shared by every component on the page: one session read
 * and one auth listener, no network query per card. `undefined` until the session is known.
 */
type SignedInState = boolean | undefined;

let state: SignedInState = undefined;
let started = false;
const listeners = new Set<() => void>();

function set(next: SignedInState) {
  if (state === next) return;
  state = next;
  listeners.forEach((listener) => listener());
}

function start() {
  if (started) return;
  started = true;
  // getSession reads the stored session locally; it does not call the auth server.
  supabase.auth.getSession().then(({ data }) => set(Boolean(data.session)));
  supabase.auth.onAuthStateChange((_event, session) => set(Boolean(session)));
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSignedIn(): SignedInState {
  return useSyncExternalStore(subscribe, () => state, () => undefined);
}
