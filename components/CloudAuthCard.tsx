"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getCloudConfigStatus } from "@/lib/cloud-config";
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

export default function CloudAuthCard() {
  const [config] = useState(() => getCloudConfigStatus());
  const [session, setSession] = useState<CloudSession | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const result = await signInCloud({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (result.ok) {
      setSession(result.data);
      setPassword("");
      setEmail("");
    } else {
      setError(SIGNIN_ERROR_COPY);
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
    </DiaryCard>
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
