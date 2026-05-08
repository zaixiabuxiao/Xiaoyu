"use client";

import { chapterVolumes } from "@/lib/mock-data";
import { useLocalRecords } from "@/lib/use-local-records";
import PixelCard from "./PixelCard";

export default function VolumeListSection() {
  const { records, hydrated } = useLocalRecords();

  return (
    <ul className="space-y-3">
      {chapterVolumes.map((vol) => {
        const numCN =
          vol.number === 1 ? "一" : vol.number === 2 ? "二" : "三";
        const writtenForVolume = hydrated
          ? records.filter((r) => r.volumeId === vol.id).length
          : 0;
        const written = vol.completedCount + writtenForVolume;
        const status = vol.active
          ? `进行中 · ${written}/${vol.totalCount}`
          : vol.number === 2
            ? "第一卷写完后开启"
            : "未来开启";
        return (
          <li key={vol.id}>
            <PixelCard variant={vol.active ? "orange" : "ghost"}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-pixel text-[10px] tracking-widest text-warm-orange">
                    VOL · {vol.number}
                  </p>
                  <p className="font-pixel text-xs mt-1">
                    第{numCN}卷：{vol.title}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-pixel text-[10px] border-2 px-2 py-1 whitespace-nowrap ${
                    vol.active
                      ? "bg-navy text-cream border-navy"
                      : "bg-cream text-navy/70 border-navy/40"
                  }`}
                >
                  {status}
                </span>
              </div>
            </PixelCard>
          </li>
        );
      })}
    </ul>
  );
}
