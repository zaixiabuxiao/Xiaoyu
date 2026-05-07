"use client";

import { useState } from "react";
import {
  getTodayString,
  saveDailyRecord,
  DailyRecordExistsError,
} from "@/lib/local-records";
import { useLocalRecords } from "@/lib/use-local-records";
import PixelCard from "./PixelCard";
import PixelButton from "./PixelButton";
import RecordChapterDialog from "./RecordChapterDialog";
import RecordChapterForm, { type RecordPayload } from "./RecordChapterForm";

export default function TodayRecordPanel() {
  const { records, hydrated } = useLocalRecords();
  const [open, setOpen] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = getTodayString();
  const todayRecord = records.find((r) => r.date === today);

  if (!hydrated) {
    return (
      <PixelCard>
        <p className="font-pixel text-[10px] text-warm-orange tracking-widest">
          今天
        </p>
        <p className="text-lg mt-2">载入中…</p>
      </PixelCard>
    );
  }

  function handleSave(payload: RecordPayload) {
    try {
      saveDailyRecord(payload);
      setOpen(false);
      setError(null);
    } catch (e) {
      if (e instanceof DailyRecordExistsError) {
        setError("今天已经写过一件了，剩下的明天再来。");
      } else {
        setError("保存失败，请稍后再试。");
      }
    }
  }

  return (
    <>
      {todayRecord ? (
        <PixelCard variant="orange">
          <p className="font-pixel text-[10px] tracking-widest text-warm-orange">
            今天 · {today}
          </p>
          <p className="font-pixel text-xs mt-1">今天这一页，已经写好了</p>
          <p className="text-lg mt-2 leading-snug">
            今天已经有一件被认真记住了，剩下的我们明天再慢慢来。
          </p>
          <div className="mt-3">
            <PixelButton type="button" onClick={() => setShowDetail((v) => !v)}>
              {showDetail ? "收起今天的日记" : "打开今天的日记"}
            </PixelButton>
          </div>
          {showDetail ? (
            <div className="mt-3 bg-white border-3 border-navy p-3 space-y-2">
              <p className="font-pixel text-xs">{todayRecord.title}</p>
              <DetailRow label="今天发生了什么" value={todayRecord.note} />
              <DetailRow label="我想记住的是" value={todayRecord.memory} />
              <DetailRow label="我的感受" value={todayRecord.husbandReflection} />
              <DetailRow label="她的感受" value={todayRecord.wifeReflection} />
              <DetailRow label="地点" value={todayRecord.location} />
              {todayRecord.wantsToRepeat ? (
                <p className="font-pixel text-[10px] text-warm-orange">
                  ✦ 想再来一次
                </p>
              ) : null}
            </div>
          ) : null}
        </PixelCard>
      ) : (
        <PixelCard>
          <p className="font-pixel text-[10px] tracking-widest text-warm-orange">
            今天 · {today}
          </p>
          <p className="font-pixel text-xs mt-1">今天这一页，还空着</p>
          <p className="text-lg mt-2 leading-snug">
            想到一件想被记住的事了吗？先轻轻写下来。
          </p>
          <div className="mt-3">
            <PixelButton type="button" onClick={() => setOpen(true)}>
              写下今天这一件
            </PixelButton>
          </div>
        </PixelCard>
      )}

      <RecordChapterDialog open={open} onClose={() => setOpen(false)}>
        <RecordChapterForm
          date={today}
          onSave={handleSave}
          onCancel={() => setOpen(false)}
        />
        {error ? (
          <p className="font-pixel text-[10px] text-warm-orange mt-2">
            {error}
          </p>
        ) : null}
      </RecordChapterDialog>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="font-pixel text-[10px] text-warm-orange tracking-widest">
        {label}
      </p>
      <p className="text-lg leading-snug">{value}</p>
    </div>
  );
}
