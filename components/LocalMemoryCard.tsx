"use client";

import type { DailyRecord } from "@/lib/local-records";
import PixelButton from "./PixelButton";

type Props = {
  record: DailyRecord;
  showActions?: boolean;
  onEdit?: (record: DailyRecord) => void;
  onDelete?: (record: DailyRecord) => void;
};

export default function LocalMemoryCard({
  record,
  showActions = false,
  onEdit,
  onDelete,
}: Props) {
  return (
    <article className="relative pl-6">
      <span className="absolute left-0 top-2 h-3 w-3 bg-warm-orange border-2 border-navy" />
      <span className="absolute left-[5px] top-5 bottom-0 w-[2px] bg-navy/30" />

      <div className="bg-white border-3 border-navy shadow-pixel p-4">
        <p className="font-pixel text-[10px] text-warm-orange tracking-widest">
          {record.date} · 本地记录
        </p>
        <h3 className="font-pixel text-xs mt-1 leading-snug">{record.title}</h3>

        {record.note ? (
          <p className="text-lg mt-2 leading-snug">{record.note}</p>
        ) : null}
        {record.memory ? (
          <p className="text-base mt-2 italic text-navy/80">
            “{record.memory}”
          </p>
        ) : null}
        {record.husbandReflection ? (
          <p className="text-base mt-2">我：{record.husbandReflection}</p>
        ) : null}
        {record.wifeReflection ? (
          <p className="text-base mt-1">她：{record.wifeReflection}</p>
        ) : null}
        {record.location ? (
          <p className="font-pixel text-[10px] text-navy/70 mt-2">
            ◎ {record.location}
          </p>
        ) : null}
        {record.wantsToRepeat ? (
          <p className="font-pixel text-[10px] text-warm-orange mt-2">
            ✦ 想再来一次
          </p>
        ) : null}

        {showActions ? (
          <div className="mt-3 pt-3 border-t-3 border-dashed border-navy/30 flex gap-2">
            <PixelButton
              type="button"
              variant="ghost"
              onClick={() => onEdit?.(record)}
            >
              编辑这条回忆
            </PixelButton>
            <PixelButton
              type="button"
              variant="ghost"
              onClick={() => onDelete?.(record)}
            >
              删除这条本地记录
            </PixelButton>
          </div>
        ) : null}
      </div>
    </article>
  );
}
