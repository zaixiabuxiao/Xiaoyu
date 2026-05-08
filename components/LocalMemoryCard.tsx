"use client";

import type { DailyRecord } from "@/lib/local-records";
import DiaryCard from "./DiaryCard";
import PixelButton from "./PixelButton";
import { PixelCalendar, PixelHeart, PixelPin } from "./PixelIcons";

type Props = {
  record: DailyRecord;
  showActions?: boolean;
  compact?: boolean;
  onEdit?: (record: DailyRecord) => void;
  onDelete?: (record: DailyRecord) => void;
};

export default function LocalMemoryCard({
  record,
  showActions = false,
  compact = false,
  onEdit,
  onDelete,
}: Props) {
  if (compact) {
    return (
      <DiaryCard>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5">
              <PixelCalendar size={12} />
              <span className="font-pixel text-[10px] text-diary-orange-d">
                {record.date}
              </span>
            </div>
            <h3 className="font-display text-lg leading-tight mt-1">
              {record.title}
            </h3>
          </div>
          <PixelHeart size={12} className="shrink-0 mt-1" />
        </div>
        {record.note ? (
          <>
            <div className="dash-h my-2" />
            <p className="text-base leading-snug">{record.note}</p>
          </>
        ) : null}
      </DiaryCard>
    );
  }

  return (
    <DiaryCard>
      <span className="absolute top-3 right-3">
        <PixelHeart size={14} />
      </span>

      <div className="pr-5">
        <div className="inline-flex items-center gap-1.5">
          <PixelCalendar size={12} />
          <span className="font-pixel text-[10px] text-diary-orange-d">
            {record.date}
          </span>
          <span className="font-pixel text-[9px] text-navy/60 tracking-widest">
            · 我们的日记
          </span>
        </div>

        <h3 className="font-display text-[22px] leading-tight text-navy mt-1 break-words">
          {record.title}
        </h3>

        <div className="dash-h my-3" />

        {record.note ? (
          <p className="text-[14px] text-navy leading-relaxed whitespace-pre-line">
            {record.note}
          </p>
        ) : null}

        {record.memory ? (
          <p className="mt-3 text-[13px] text-navy/85 italic leading-relaxed">
            “{record.memory}”
          </p>
        ) : null}

        {record.husbandReflection || record.wifeReflection ? (
          <div className="mt-3 space-y-1 text-[13px] text-navy leading-relaxed">
            {record.husbandReflection ? (
              <p>
                <span className="font-display text-warm-orange">我：</span>
                {record.husbandReflection}
              </p>
            ) : null}
            {record.wifeReflection ? (
              <p>
                <span className="font-display text-heart-d">她：</span>
                {record.wifeReflection}
              </p>
            ) : null}
          </div>
        ) : null}

        {record.location || record.wantsToRepeat ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            {record.location ? (
              <span className="inline-flex items-center gap-1.5 font-display text-sm text-navy">
                <PixelPin size={12} /> {record.location}
              </span>
            ) : null}
            {record.wantsToRepeat ? (
              <span className="inline-flex items-center gap-1.5 font-display text-sm text-heart-d">
                <PixelHeart size={11} /> 想再来一次
              </span>
            ) : null}
          </div>
        ) : null}

        {showActions ? (
          <div className="mt-4 pt-3 border-t-2 border-dashed border-navy/25 flex flex-wrap gap-2">
            <PixelButton
              type="button"
              variant="ghost"
              onClick={() => onEdit?.(record)}
            >
              编辑这一页
            </PixelButton>
            <PixelButton
              type="button"
              variant="ghost"
              onClick={() => onDelete?.(record)}
            >
              轻轻撕掉这一页
            </PixelButton>
          </div>
        ) : null}
      </div>
    </DiaryCard>
  );
}
