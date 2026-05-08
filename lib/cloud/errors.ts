// Normalized error model + cloud precondition guard.
//
// Every public function in lib/cloud/* returns a CloudResult<T>. The UI
// (when it eventually wires up) discriminates on `ok`. Codes are stable —
// adding new ones is OK, renaming existing ones is not.

import type { SupabaseClient } from "@supabase/supabase-js";
import { isCloudEnabled } from "../cloud-config";
import { getSupabaseClient } from "../supabase-client";

export type CloudErrorCode =
  | "CLOUD_DISABLED"
  | "SUPABASE_NOT_CONFIGURED"
  | "NOT_AUTHENTICATED"
  | "NOT_ALLOWED"
  | "DAILY_RECORD_EXISTS"
  | "PHOTO_REQUIRED"
  | "NOT_FOUND"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export type CloudResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: CloudErrorCode; message: string; cause?: unknown };

export function ok<T>(data: T): CloudResult<T> {
  return { ok: true, data };
}

export function err<T = never>(
  code: CloudErrorCode,
  message: string,
  cause?: unknown,
): CloudResult<T> {
  return { ok: false, code, message, cause };
}

type ErrorLike = {
  code?: string | number;
  message?: string;
  name?: string;
  status?: number;
};

function asErrorLike(value: unknown): ErrorLike {
  if (value && typeof value === "object") return value as ErrorLike;
  return {};
}

/**
 * Translate Supabase / Postgrest / generic errors into our CloudResult shape.
 * Always returns an `ok: false` result.
 */
export function normalizeError<T = never>(error: unknown): CloudResult<T> {
  const e = asErrorLike(error);
  const message = typeof e.message === "string" ? e.message : "未知错误";
  const code = typeof e.code === "string" ? e.code : "";

  // Postgres unique_violation
  if (code === "23505" || code === "PGRST409") {
    return err(
      "DAILY_RECORD_EXISTS",
      "今天已经写过一页了，剩下的明天再来。",
      error,
    );
  }
  // RPC photo-required (raised as 23514) / message-based fallback
  if (code === "23514" || /photo[_ ]?required/i.test(message)) {
    return err("PHOTO_REQUIRED", "这一页还缺一张今天的照片。", error);
  }
  // Permission denied (RPC explicit 42501, RLS rejection patterns)
  if (
    code === "42501" ||
    /not[_ ]?allowed/i.test(message) ||
    /permission denied/i.test(message)
  ) {
    return err("NOT_ALLOWED", "权限不足。", error);
  }
  // No active session
  if (
    e.status === 401 ||
    code === "401" ||
    code === "PGRST301" ||
    /jwt|unauthorized/i.test(message)
  ) {
    return err("NOT_AUTHENTICATED", "请先登录后再试。", error);
  }
  // Postgrest "no rows returned" when a single() query found nothing
  if (code === "PGRST116") {
    return err("NOT_FOUND", "找不到对应的内容。", error);
  }
  // Browser fetch / network failures bubble up as TypeError
  if (e.name === "TypeError" || /fetch|network/i.test(message)) {
    return err("NETWORK_ERROR", "网络连接异常。", error);
  }
  return err("UNKNOWN", message || "未知错误", error);
}

/**
 * Verify that cloud sync is enabled AND the Supabase client is configured.
 * Returns the client on success, a typed error result otherwise.
 */
export function ensureCloudClient(): CloudResult<SupabaseClient> {
  if (!isCloudEnabled()) {
    return err("CLOUD_DISABLED", "Cloud sync is not enabled.");
  }
  const client = getSupabaseClient();
  if (!client) {
    return err(
      "SUPABASE_NOT_CONFIGURED",
      "Supabase env vars are missing.",
    );
  }
  return ok(client);
}
