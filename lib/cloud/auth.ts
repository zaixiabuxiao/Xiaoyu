"use client";

// Minimal Supabase Auth wrapper for the cloud-identity card under /us.
//
// Notes
// -----
// - Only browser auth methods (signInWithPassword, getSession, signOut,
//   onAuthStateChange). No service-role API.
// - Returns the same CloudResult shape as the other lib/cloud/* modules so
//   the UI can branch on `result.ok`.
// - The card never sees raw access tokens or password fields after submit
//   — Supabase manages the session itself in its own localStorage key.

import type { User } from "@supabase/supabase-js";
import {
  ensureCloudClient,
  err,
  normalizeError,
  ok,
  type CloudResult,
} from "./errors";

export type CloudSession = {
  userId: string;
  email: string | null;
};

function toCloudSession(user: User | null | undefined): CloudSession | null {
  if (!user) return null;
  return {
    userId: user.id,
    email: user.email ?? null,
  };
}

/**
 * Email + password sign in. The session is persisted by Supabase itself.
 * Wrong credentials return ok:false; the UI renders a warm message.
 */
export async function signInCloud(params: {
  email: string;
  password: string;
}): Promise<CloudResult<CloudSession>> {
  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const { data, error } = await guard.data.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });
    if (error) return normalizeError(error);
    const session = toCloudSession(data.user);
    if (!session) {
      return err("UNKNOWN", "登录返回为空，请稍后再试。");
    }
    return ok(session);
  } catch (cause) {
    return normalizeError(cause);
  }
}

/**
 * Sign out the current Supabase session and clear Supabase's own auth
 * storage. Diary localStorage is untouched.
 */
export async function signOutCloud(): Promise<CloudResult<void>> {
  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const { error } = await guard.data.auth.signOut();
    if (error) return normalizeError(error);
    return ok(undefined);
  } catch (cause) {
    return normalizeError(cause);
  }
}

/**
 * Returns the current cloud session if any, or `null` when signed out.
 * Never throws on missing config; returns `CLOUD_DISABLED` etc. instead.
 */
export async function getCurrentCloudSession(): Promise<
  CloudResult<CloudSession | null>
> {
  const guard = ensureCloudClient();
  if (!guard.ok) return guard;

  try {
    const { data, error } = await guard.data.auth.getSession();
    if (error) return normalizeError(error);
    return ok(toCloudSession(data.session?.user ?? null));
  } catch (cause) {
    return normalizeError(cause);
  }
}

/**
 * Subscribe to auth changes (sign in, sign out, token refresh). The handler
 * receives the post-event session (or null). Returns an unsubscribe fn that
 * is safe to call from a useEffect cleanup.
 */
export function subscribeCloudAuthChanges(
  handler: (session: CloudSession | null) => void,
): () => void {
  const guard = ensureCloudClient();
  if (!guard.ok) return () => {};

  const { data } = guard.data.auth.onAuthStateChange((_event, session) => {
    handler(toCloudSession(session?.user ?? null));
  });

  return () => {
    data.subscription.unsubscribe();
  };
}
