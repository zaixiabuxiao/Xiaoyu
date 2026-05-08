"use client";

import Link from "next/link";
import DiaryCard from "./DiaryCard";
import { useLocalRecords } from "@/lib/use-local-records";
import { getTodayString } from "@/lib/local-records";

export default function HomeChapterChooser() {
  const { records, hydrated } = useLocalRecords();
  const today = getTodayString();
  const todayRecord = records.find((r) => r.date === today);

  if (!hydrated) {
    return (
      <section>
        <h2 className="font-display text-[18px] text-navy mb-2 leading-tight">
          今天打算写哪一个？
        </h2>
        <DiaryCard>
          <p className="font-pixel text-[10px] text-navy/50">…</p>
        </DiaryCard>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-display text-[18px] text-navy mb-2 leading-tight">
        今天打算写哪一个？
      </h2>
      <DiaryCard>
        {todayRecord ? (
          <div className="space-y-3">
            <div className="space-y-1 text-navy">
              <p className="font-display text-[16px] leading-snug">
                今天这一页已经写好了。
              </p>
              <p className="text-[13px] text-diary-ink-soft leading-relaxed">
                明天再去选下一页。
              </p>
            </div>
            <Link
              href="/memories"
              className="diary-pbtn-small inline-flex"
            >
              打开今天的日记
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[14px] text-navy leading-relaxed">
              去第一卷里选一页，今天只认真写这一页。
            </p>
            <Link href="/chapters" className="diary-pbtn inline-flex">
              去章节里选一页
            </Link>
          </div>
        )}
      </DiaryCard>
    </section>
  );
}
