"use client";

import { useEffect, useState } from "react";
import { getCloudConfigStatus } from "@/lib/cloud-config";
import {
  getLocalMigrationSummary,
  migrateLocalDataToCloud,
  type LocalMigrationSummary,
  type MigrationErrorEntry,
  type MigrationResult,
} from "@/lib/cloud/migration";
import DiaryCard from "./DiaryCard";
import DiaryButton from "./DiaryButton";

type Status =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "done"; result: MigrationResult };

const ERROR_COPY: Record<string, string> = {
  CLOUD_DISABLED:
    "云端同步还没有开启。需要先完成 Supabase 环境配置。",
  SUPABASE_NOT_CONFIGURED:
    "云端同步还没有开启。需要先完成 Supabase 环境配置。",
  NOT_AUTHENTICATED:
    "还没有连接到云端身份。下一步需要完成登录/成员设置。",
  NOT_ALLOWED: "当前云端身份还没有加入羽扬日记空间。",
  NOT_FOUND: "找不到云端日记空间，请稍后再试。",
  NETWORK_ERROR: "网络连接异常，等会儿再试一次试试看。",
  PHOTO_REQUIRED: "这一页缺少照片，暂时不能迁移到云端。",
  DAILY_RECORD_EXISTS: "这一页已经在云端里了。",
  UNKNOWN: "出了点小状况，再试一次试试看。",
};

export default function CloudMigrationCard() {
  const [config] = useState(() => getCloudConfigStatus());
  const [local, setLocal] = useState<LocalMigrationSummary | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    setLocal(getLocalMigrationSummary());
  }, []);

  if (!config.enabled) {
    return (
      <DiaryCard variant="soft">
        <p className="font-pixel text-[10px] tracking-widest text-warm-orange">
          TOOLS · 云端同步准备
        </p>
        <p className="font-display text-[16px] text-navy mt-1 leading-snug">
          云端同步准备
        </p>
        <p className="text-[13px] text-diary-ink-soft mt-2 leading-relaxed">
          {ERROR_COPY.CLOUD_DISABLED}
        </p>
      </DiaryCard>
    );
  }

  async function handleStart() {
    if (status.kind === "running") return;
    setStatus({ kind: "running" });
    try {
      const result = await migrateLocalDataToCloud();
      setStatus({ kind: "done", result });
      setLocal(getLocalMigrationSummary());
    } catch (cause) {
      setStatus({
        kind: "done",
        result: {
          ok: false,
          summary: {
            dailyRecordsTotal: 0,
            dailyRecordsMigrated: 0,
            albumPhotosTotal: 0,
            albumPhotosMigrated: 0,
            plannedChaptersTotal: 0,
            plannedChaptersMigrated: 0,
            skipped: 0,
            failed: 0,
          },
          errors: [
            {
              type: "UNKNOWN",
              message: ERROR_COPY.UNKNOWN,
              cause,
            },
          ],
        },
      });
    }
  }

  return (
    <DiaryCard variant="soft">
      <p className="font-pixel text-[10px] tracking-widest text-warm-orange">
        TOOLS · 云端同步准备
      </p>
      <p className="font-display text-[16px] text-navy mt-1 leading-snug">
        云端同步准备
      </p>
      <p className="text-[13px] text-diary-ink-soft mt-2 leading-relaxed">
        把这台设备里的日记、照片和想做清单备份到同一本云端日记里。以后，不同设备都会从这本云端日记读取内容。
      </p>

      <div className="dash-h my-3" />

      <LocalSummary summary={local} />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <DiaryButton
          type="button"
          variant="small"
          onClick={handleStart}
          disabled={status.kind === "running"}
        >
          {status.kind === "running" ? "迁移中…" : "开始迁移到云端"}
        </DiaryButton>
        <span className="text-[11px] text-diary-ink-soft">
          迁移不会删除这台设备里的本地记录。
        </span>
      </div>

      {status.kind === "done" ? (
        <ResultPanel result={status.result} />
      ) : null}
    </DiaryCard>
  );
}

function LocalSummary({
  summary,
}: {
  summary: LocalMigrationSummary | null;
}) {
  if (!summary) {
    return (
      <p className="font-pixel text-[10px] text-navy/50">…</p>
    );
  }
  return (
    <ul className="space-y-1 text-[13px] text-navy">
      <li>
        · 这台设备的日记：
        <span className="font-pixel text-[11px] text-diary-orange-d ml-1">
          {summary.dailyRecordsLocal}
        </span>{" "}
        页
        {summary.dailyRecordsWithoutPhotos > 0 ? (
          <span className="text-[12px] text-diary-ink-soft ml-1">
            （其中{" "}
            <span className="font-pixel text-[10px]">
              {summary.dailyRecordsWithoutPhotos}
            </span>{" "}
            页缺少照片，暂时不能上传）
          </span>
        ) : null}
      </li>
      <li>
        · 相册照片：
        <span className="font-pixel text-[11px] text-diary-orange-d ml-1">
          {summary.albumPhotosLocal}
        </span>{" "}
        张
      </li>
      <li>
        · 想做清单：
        <span className="font-pixel text-[11px] text-diary-orange-d ml-1">
          {summary.plannedChaptersLocal}
        </span>{" "}
        件
      </li>
    </ul>
  );
}

function ResultPanel({ result }: { result: MigrationResult }) {
  const blockingError = result.errors.find((e) =>
    [
      "CLOUD_DISABLED",
      "SUPABASE_NOT_CONFIGURED",
      "NOT_AUTHENTICATED",
      "NOT_ALLOWED",
      "NOT_FOUND",
    ].includes(e.type),
  );
  const everythingZero =
    result.summary.dailyRecordsTotal === 0 &&
    result.summary.albumPhotosTotal === 0 &&
    result.summary.plannedChaptersTotal === 0;

  return (
    <div className="mt-4">
      <div className="dash-h mb-3" />
      {blockingError ? (
        <p className="text-[13px] text-warm-orange leading-relaxed">
          {ERROR_COPY[blockingError.type] ?? blockingError.message}
        </p>
      ) : result.ok ? (
        <p className="font-display text-[15px] text-navy leading-snug">
          这台设备里的记录已经备份到云端。
        </p>
      ) : (
        <p className="font-display text-[15px] text-navy leading-snug">
          有一些没有迁移上去，可以稍后再试一次。
        </p>
      )}

      {!blockingError && !everythingZero ? (
        <ul className="mt-2 space-y-1 text-[13px] text-navy">
          <li>
            · 日记：迁移{" "}
            <span className="font-pixel text-[11px] text-diary-orange-d">
              {result.summary.dailyRecordsMigrated}
            </span>{" "}
            / 共{" "}
            <span className="font-pixel text-[11px]">
              {result.summary.dailyRecordsTotal}
            </span>{" "}
            页
          </li>
          <li>
            · 相册：迁移{" "}
            <span className="font-pixel text-[11px] text-diary-orange-d">
              {result.summary.albumPhotosMigrated}
            </span>{" "}
            / 共{" "}
            <span className="font-pixel text-[11px]">
              {result.summary.albumPhotosTotal}
            </span>{" "}
            张
          </li>
          <li>
            · 想做：迁移{" "}
            <span className="font-pixel text-[11px] text-diary-orange-d">
              {result.summary.plannedChaptersMigrated}
            </span>{" "}
            / 共{" "}
            <span className="font-pixel text-[11px]">
              {result.summary.plannedChaptersTotal}
            </span>{" "}
            件
          </li>
          {result.summary.skipped > 0 ? (
            <li className="text-diary-ink-soft">
              · 已经在云端的（跳过）：
              <span className="font-pixel text-[11px] ml-1">
                {result.summary.skipped}
              </span>
            </li>
          ) : null}
          {result.summary.failed > 0 ? (
            <li className="text-warm-orange">
              · 没成功（可重试）：
              <span className="font-pixel text-[11px] ml-1">
                {result.summary.failed}
              </span>
            </li>
          ) : null}
        </ul>
      ) : null}

      {!blockingError && result.errors.length > 0 ? (
        <details className="mt-3">
          <summary className="font-display text-[13px] text-diary-ink-soft cursor-pointer">
            看看哪些没成功
          </summary>
          <ul className="mt-2 space-y-1 text-[12px] text-diary-ink-soft">
            {result.errors.slice(0, 12).map((e, i) => (
              <li key={i}>· {translateError(e)}</li>
            ))}
            {result.errors.length > 12 ? (
              <li>· …还有 {result.errors.length - 12} 条</li>
            ) : null}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function translateError(e: MigrationErrorEntry): string {
  const friendly = ERROR_COPY[e.type];
  if (friendly && e.localId) return `${e.localId}：${friendly}`;
  if (friendly) return friendly;
  return e.message;
}
