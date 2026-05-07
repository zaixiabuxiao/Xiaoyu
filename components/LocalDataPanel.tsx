"use client";

import { useState } from "react";
import {
  clearDailyRecords,
  clearPlannedChapters,
  exportDailyRecordsAsText,
  getTodayString,
} from "@/lib/local-records";
import { useLocalRecords } from "@/lib/use-local-records";
import PixelCard from "./PixelCard";
import PixelButton from "./PixelButton";

export default function LocalDataPanel() {
  const { records, planned, hydrated } = useLocalRecords();
  const [message, setMessage] = useState<string | null>(null);

  function handleExport() {
    const text = exportDailyRecordsAsText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `羽扬日记_本地回忆_${getTodayString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage("已导出本地回忆。");
  }

  function handleClear() {
    const ok = window.confirm(
      "确定清除全部本地测试记录吗？此操作不可撤销。",
    );
    if (!ok) return;
    clearDailyRecords();
    clearPlannedChapters();
    setMessage("已清除本地记录与计划。");
  }

  return (
    <PixelCard>
      <p className="font-pixel text-[10px] tracking-widest text-warm-orange">
        本地数据
      </p>
      <p className="font-pixel text-xs mt-1">
        本地回忆 · 本地计划
      </p>
      <p className="text-lg mt-2 leading-snug">
        目前记录保存在这台设备上。建议定期导出本地回忆，避免浏览器数据清除后丢失。
      </p>
      <ul className="mt-2 text-base text-navy/70 space-y-1">
        <li>· 已记录：{hydrated ? records.length : "…"} 条</li>
        <li>· 计划中：{hydrated ? planned.length : "…"} 件</li>
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <PixelButton type="button" onClick={handleExport}>
          导出本地回忆
        </PixelButton>
        <PixelButton type="button" variant="ghost" onClick={handleClear}>
          清除本地测试记录
        </PixelButton>
      </div>
      {message ? (
        <p className="font-pixel text-[10px] text-warm-orange mt-2">
          {message}
        </p>
      ) : null}
    </PixelCard>
  );
}
