"use client";

import { useState } from "react";
import type { LifeChapter } from "@/lib/mock-data";
import type { DailyRecord } from "@/lib/local-records";
import { useDiaryData } from "@/lib/use-diary-data";
import DiaryCard from "./DiaryCard";
import LocalMemoryCard from "./LocalMemoryCard";
import MemoryTimelineCard from "./MemoryTimelineCard";
import MemoryFolderView from "./MemoryFolderView";
import YangMascot from "./YangMascot";
import RecordChapterDialog from "./RecordChapterDialog";
import RecordChapterForm, { type RecordPayload } from "./RecordChapterForm";
import { PixelHeart, PixelTriangle } from "./PixelIcons";

type Props = {
  mockMemories: LifeChapter[];
};

type TabId = "timeline" | "folders" | "review";

const tabs: { id: TabId; label: string }[] = [
  { id: "timeline", label: "时间线" },
  { id: "folders", label: "地图相册" },
  { id: "review", label: "年度回顾" },
];

export default function MemoriesView({ mockMemories }: Props) {
  const data = useDiaryData();
  const [activeTab, setActiveTab] = useState<TabId>("timeline");
  const [editing, setEditing] = useState<DailyRecord | null>(null);

  const sortedLocal = [...data.records].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  async function handleEditSave(payload: RecordPayload) {
    if (!editing) return;
    await data.updateDailyRecord(editing.date, payload);
    setEditing(null);
  }

  async function handleDelete(record: DailyRecord) {
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        `要轻轻撕掉 ${record.date} 这一页吗？`,
      );
      if (!ok) return;
    }
    await data.deleteDailyRecord(record.date);
  }

  return (
    <>
      <FolderTabs activeId={activeTab} onChange={setActiveTab} />

      {activeTab === "timeline" ? (
        <TimelineTab
          hydrated={data.hydrated}
          sortedLocal={sortedLocal}
          mockMemories={mockMemories}
          onEdit={setEditing}
          onDelete={handleDelete}
        />
      ) : null}

      {activeTab === "folders" ? <MemoryFolderView /> : null}

      {activeTab === "review" ? <ReviewPlaceholder /> : null}

      <ClosingRibbon />

      <RecordChapterDialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
      >
        {editing ? (
          <RecordChapterForm
            date={editing.date}
            existing={editing}
            onSave={handleEditSave}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </RecordChapterDialog>
    </>
  );
}

function TimelineTab({
  hydrated,
  sortedLocal,
  mockMemories,
  onEdit,
  onDelete,
}: {
  hydrated: boolean;
  sortedLocal: DailyRecord[];
  mockMemories: LifeChapter[];
  onEdit: (record: DailyRecord) => void;
  onDelete: (record: DailyRecord) => void;
}) {
  return (
    <>
      <section className="space-y-3">
        <SectionTitle subtitle="OUR DIARY">我们的日记本</SectionTitle>

        {!hydrated ? (
          <DiaryCard>
            <p className="font-pixel text-[10px] text-navy/60">…</p>
          </DiaryCard>
        ) : sortedLocal.length === 0 ? (
          <EmptyLocalState />
        ) : (
          <Timeline>
            {sortedLocal.map((record) => (
              <TimelineEntry key={record.date}>
                <LocalMemoryCard
                  record={record}
                  showActions
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </TimelineEntry>
            ))}
          </Timeline>
        )}
      </section>

      <section className="space-y-3">
        <SectionTitle subtitle="FROM CHAPTERS" muted>
          章节里的回忆
        </SectionTitle>
        <p className="text-base text-navy/70 leading-snug">
          这些是从 100 件章节里挑出来的样本，等我们一件件把它们写成自己的版本。
        </p>

        {mockMemories.length === 0 ? (
          <DiaryCard variant="soft">
            <p className="text-lg">章节里还没有写过的回忆。</p>
          </DiaryCard>
        ) : (
          <Timeline subdued>
            {mockMemories.map((chapter) => (
              <TimelineEntry key={chapter.id} subdued>
                <MemoryTimelineCard chapter={chapter} />
              </TimelineEntry>
            ))}
          </Timeline>
        )}
      </section>
    </>
  );
}

function ReviewPlaceholder() {
  return (
    <DiaryCard variant="soft">
      <p className="font-display text-[16px] text-navy leading-snug">
        年度回顾还在慢慢生成。
      </p>
      <div className="dash-h my-3" />
      <p className="text-[13px] text-diary-ink-soft leading-relaxed">
        等这一卷写得更多一点，我们再一起回头看。
      </p>
    </DiaryCard>
  );
}

function FolderTabs({
  activeId,
  onChange,
}: {
  activeId: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 px-1 mb-1">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-current={active ? "page" : undefined}
            className={[
              "relative px-1 pt-2 pb-3 text-center font-display text-sm border-2 border-navy rounded-t-[10px] transition-colors",
              active
                ? "bg-warm-orange text-cream -mt-0 z-10"
                : "bg-diary-cream-2 text-navy mt-[2px] hover:bg-diary-cream-1",
            ].join(" ")}
            style={
              active
                ? {
                    boxShadow:
                      "inset 0 -3px 0 0 #C66A2F, inset 0 2px 0 0 #F3B06F",
                  }
                : {
                    boxShadow: "inset 0 -3px 0 0 rgba(28,42,74,0.10)",
                  }
            }
          >
            <span className="block leading-tight">{tab.label}</span>
            {active ? (
              <span className="absolute left-1/2 -bottom-2 -translate-x-1/2">
                <PixelTriangle size={6} color="#EE6F7E" />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function SectionTitle({
  children,
  subtitle,
  muted,
}: {
  children: React.ReactNode;
  subtitle?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <h2
        className={`font-display ${muted ? "text-lg text-navy/80" : "text-2xl text-navy"} leading-none`}
      >
        {children}
      </h2>
      {subtitle ? (
        <span className="font-pixel text-[9px] text-warm-orange tracking-widest">
          {subtitle}
        </span>
      ) : null}
    </div>
  );
}

function Timeline({
  children,
  subdued,
}: {
  children: React.ReactNode;
  subdued?: boolean;
}) {
  return (
    <div className="relative pl-6">
      <span
        className={`absolute left-2 top-1 bottom-1 w-[2px] ${subdued ? "diary-rail opacity-50" : "diary-rail"}`}
      />
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function TimelineEntry({
  children,
  subdued,
}: {
  children: React.ReactNode;
  subdued?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute -left-[19px] top-3">
        <PixelHeart
          size={14}
          color={subdued ? "#F3B06F" : "#EE6F7E"}
          shadow={subdued ? "#C66A2F" : "#D04A5B"}
        />
      </span>
      {children}
    </div>
  );
}

function EmptyLocalState() {
  return (
    <DiaryCard variant="soft">
      <div className="flex items-start gap-3">
        <YangMascot size="sm" className="mt-1" />
        <div className="flex-1 min-w-0">
          <p className="font-display text-[18px] leading-snug text-navy">
            第一篇真正属于我们的日记，还在等我们写下。
          </p>
          <div className="dash-h my-3" />
          <p className="text-[14px] text-navy/85 leading-relaxed">
            今天写下的那一件，会出现在这里。
          </p>
        </div>
      </div>
    </DiaryCard>
  );
}

function ClosingRibbon() {
  return (
    <div className="mt-2 flex items-center justify-center gap-2 text-navy/40">
      {Array.from({ length: 7 }).map((_, i) => (
        <span key={`l-${i}`} className="block w-1.5 h-[2px] bg-current" />
      ))}
      <PixelHeart size={12} />
      {Array.from({ length: 7 }).map((_, i) => (
        <span key={`r-${i}`} className="block w-1.5 h-[2px] bg-current" />
      ))}
    </div>
  );
}
