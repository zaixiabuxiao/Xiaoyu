"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getCloudConfigStatus } from "@/lib/cloud-config";
import {
  getCloudProjectHost,
  getSupabaseClient,
} from "@/lib/supabase-client";
import {
  getCurrentCloudSession,
  signInCloud,
  signOutCloud,
  subscribeCloudAuthChanges,
  type CloudSession,
} from "@/lib/cloud/auth";
import DiaryCard from "./DiaryCard";
import DiaryButton from "./DiaryButton";
import PixelButton from "./PixelButton";

const SIGNIN_ERROR_COPY =
  "这把云端钥匙没有打开，再检查一下邮箱或密码。";

type SafeAuthError = {
  name: string | null;
  message: string | null;
  status: number | null;
  code: string | null;
};

type AuthFlowDebug = {
  attempted: boolean;
  clientReady: boolean;
  projectHost: string | null;
  passwordLength: number | null;
  resultCode: string | null;
  rawError: SafeAuthError | null;
};

function extractSafeErrorFields(cause: unknown): SafeAuthError | null {
  if (!cause || typeof cause !== "object") return null;
  const e = cause as {
    name?: unknown;
    message?: unknown;
    status?: unknown;
    code?: unknown;
  };
  return {
    name: typeof e.name === "string" ? e.name : null,
    message: typeof e.message === "string" ? e.message : null,
    status: typeof e.status === "number" ? e.status : null,
    code: typeof e.code === "string" ? e.code : null,
  };
}

export default function CloudAuthCard() {
  const [config] = useState(() => getCloudConfigStatus());
  const [session, setSession] = useState<CloudSession | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authDebug, setAuthDebug] = useState<AuthFlowDebug>(() => ({
    attempted: false,
    clientReady: getSupabaseClient() !== null,
    projectHost: getCloudProjectHost(),
    passwordLength: null,
    resultCode: null,
    rawError: null,
  }));

  useEffect(() => {
    if (!config.enabled) {
      setHydrated(true);
      return;
    }
    let mounted = true;
    getCurrentCloudSession().then((result) => {
      if (!mounted) return;
      if (result.ok) setSession(result.data);
      setHydrated(true);
    });
    const unsubscribe = subscribeCloudAuthChanges((next) => {
      if (mounted) setSession(next);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [config.enabled]);

  // ── Cloud disabled / env missing ─────────────────────────────────────
  if (!config.enabled) {
    const message =
      config.reason === "missing-url" ||
      config.reason === "missing-client-key"
        ? "云端环境还没有配置完整。"
        : "云端同步还没有开启。需要先完成 Supabase 环境配置。";
    return (
      <DiaryCard variant="soft">
        <Header />
        <p className="text-[13px] text-diary-ink-soft mt-2 leading-relaxed">
          {message}
        </p>
      </DiaryCard>
    );
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const submittedPasswordLength = password.length;
    setAuthDebug((prev) => ({
      ...prev,
      attempted: true,
      clientReady: getSupabaseClient() !== null,
      projectHost: getCloudProjectHost(),
      passwordLength: submittedPasswordLength,
      resultCode: null,
      rawError: null,
    }));
    const result = await signInCloud({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (result.ok) {
      setSession(result.data);
      setPassword("");
      setEmail("");
      setAuthDebug((prev) => ({
        ...prev,
        resultCode: "OK",
        rawError: null,
      }));
    } else {
      setError(SIGNIN_ERROR_COPY);
      setAuthDebug((prev) => ({
        ...prev,
        resultCode: result.code,
        rawError: extractSafeErrorFields(result.cause),
      }));
    }
  }

  async function handleSignOut() {
    if (busy) return;
    setBusy(true);
    await signOutCloud();
    setBusy(false);
    setSession(null);
  }

  return (
    <DiaryCard variant="soft">
      <Header />
      <p className="text-[13px] text-diary-ink-soft mt-2 leading-relaxed">
        连接云端身份后，这台设备才能把本地日记备份到同一本云端日记里。
      </p>
      <div className="dash-h my-3" />

      {!hydrated ? (
        <p className="font-pixel text-[10px] text-navy/50">…</p>
      ) : session ? (
        <SignedInPanel
          session={session}
          busy={busy}
          onSignOut={handleSignOut}
        />
      ) : (
        <form onSubmit={handleSignIn} className="space-y-3">
          <Field label="邮箱">
            <input
              type="email"
              autoComplete="email"
              required
              className="pixel-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </Field>
          <Field label="密码">
            <input
              type="password"
              autoComplete="current-password"
              required
              className="pixel-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />
          </Field>
          {error ? (
            <p className="font-pixel text-[10px] text-warm-orange leading-relaxed">
              {error}
            </p>
          ) : null}
          <DiaryButton type="submit" variant="small" disabled={busy}>
            {busy ? "连接中…" : "连接云端"}
          </DiaryButton>
        </form>
      )}
      <AuthFlowDebugBlock debug={authDebug} />
    </DiaryCard>
  );
}

function AuthFlowDebugBlock({ debug }: { debug: AuthFlowDebug }) {
  return (
    <div className="mt-4 opacity-60">
      <div className="dash-h mb-2" />
      <p className="font-pixel text-[9px] tracking-widest text-navy/50 mb-1">
        DEBUG · AUTH FLOW
      </p>
      <ul className="font-pixel text-[10px] text-navy/60 leading-relaxed space-y-0.5">
        <li>attempted: {String(debug.attempted)}</li>
        <li>clientReady: {String(debug.clientReady)}</li>
        <li>projectHost: {debug.projectHost ?? "null"}</li>
        <li>
          passwordLength:{" "}
          {debug.passwordLength === null
            ? "—"
            : String(debug.passwordLength)}
        </li>
        <li>resultCode: {debug.resultCode ?? "—"}</li>
        <li>
          errorStatus:{" "}
          {debug.rawError?.status === null ||
          debug.rawError?.status === undefined
            ? "—"
            : String(debug.rawError.status)}
        </li>
        <li>errorCode: {debug.rawError?.code ?? "—"}</li>
        <li>errorName: {debug.rawError?.name ?? "—"}</li>
        <li className="break-all">
          errorMessage: {debug.rawError?.message ?? "—"}
        </li>
      </ul>
    </div>
  );
}

function Header() {
  return (
    <>
      <p className="font-pixel text-[10px] tracking-widest text-warm-orange">
        TOOLS · 云端身份
      </p>
      <p className="font-display text-[16px] text-navy mt-1 leading-snug">
        云端身份
      </p>
    </>
  );
}

function SignedInPanel({
  session,
  busy,
  onSignOut,
}: {
  session: CloudSession;
  busy: boolean;
  onSignOut: () => void;
}) {
  return (
    <div className="space-y-2">
      <p className="font-display text-[15px] text-navy leading-snug">
        已连接云端身份。
      </p>
      {session.email ? (
        <p className="text-[12px] text-diary-ink-soft break-all">
          当前账号：{session.email}
        </p>
      ) : null}
      <p className="text-[13px] text-diary-ink-soft leading-relaxed">
        现在可以进行云端迁移准备。
      </p>
      <div className="mt-2">
        <PixelButton
          type="button"
          variant="ghost"
          onClick={onSignOut}
          disabled={busy}
        >
          {busy ? "断开中…" : "断开连接"}
        </PixelButton>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-display text-[13px] text-navy">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
