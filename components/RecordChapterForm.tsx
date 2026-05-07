"use client";

import { useState, type FormEvent } from "react";
import type { DailyRecord } from "@/lib/local-records";
import PixelButton from "./PixelButton";

export type RecordPayload = Omit<DailyRecord, "createdAt"> & {
  createdAt?: string;
};

type Props = {
  date: string;
  chapterId?: string;
  volumeId?: string;
  chapterTitle?: string;
  existing?: DailyRecord;
  onSave: (payload: RecordPayload) => void;
  onCancel: () => void;
  saveLabel?: string;
  cancelLabel?: string;
};

function deriveTitle(input: {
  chapterTitle?: string;
  memory: string;
  note: string;
  date: string;
  existing?: DailyRecord;
}): string {
  if (input.existing?.title) return input.existing.title;
  if (input.chapterTitle) return input.chapterTitle;
  const fromMemory = input.memory.trim().split("\n")[0]?.slice(0, 24);
  if (fromMemory) return fromMemory;
  const fromNote = input.note.trim().split("\n")[0]?.slice(0, 24);
  if (fromNote) return fromNote;
  return `今天的小事 · ${input.date}`;
}

export default function RecordChapterForm({
  date,
  chapterId,
  volumeId,
  chapterTitle,
  existing,
  onSave,
  onCancel,
  saveLabel = "保存今天这一件",
  cancelLabel = "先不记录",
}: Props) {
  const [note, setNote] = useState(existing?.note ?? "");
  const [memory, setMemory] = useState(existing?.memory ?? "");
  const [husband, setHusband] = useState(existing?.husbandReflection ?? "");
  const [wife, setWife] = useState(existing?.wifeReflection ?? "");
  const [location, setLocation] = useState(existing?.location ?? "");
  const [wantsToRepeat, setWantsToRepeat] = useState(
    existing?.wantsToRepeat ?? false,
  );
  const [error, setError] = useState<string | null>(null);

  const displayTitle = chapterTitle ?? existing?.title;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!note.trim()) {
      setError("先写一句“今天发生了什么”吧。");
      return;
    }
    setError(null);
    onSave({
      date,
      chapterId: existing?.chapterId ?? chapterId ?? `freeform_${date}`,
      volumeId: existing?.volumeId ?? volumeId ?? "v1",
      title: deriveTitle({ chapterTitle, memory, note, date, existing }),
      note: note.trim(),
      memory: memory.trim() || undefined,
      husbandReflection: husband.trim() || undefined,
      wifeReflection: wife.trim() || undefined,
      location: location.trim() || undefined,
      wantsToRepeat,
      createdAt: existing?.createdAt,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="font-pixel text-[10px] text-warm-orange tracking-widest">
          {existing ? "编辑这条回忆" : "今天的一件"}
        </p>
        <p className="font-pixel text-xs mt-1 leading-snug">
          {displayTitle ?? `${date} · 自由记录`}
        </p>
      </div>

      <Field label="今天发生了什么？" required>
        <textarea
          className="pixel-textarea"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="一两句话就够了。"
        />
      </Field>

      <Field label="我想记住的是：">
        <textarea
          className="pixel-textarea"
          value={memory}
          onChange={(e) => setMemory(e.target.value)}
          rows={2}
        />
      </Field>

      <Field label="我的感受：">
        <textarea
          className="pixel-textarea"
          value={husband}
          onChange={(e) => setHusband(e.target.value)}
          rows={2}
        />
      </Field>

      <Field label="她的感受：">
        <textarea
          className="pixel-textarea"
          value={wife}
          onChange={(e) => setWife(e.target.value)}
          rows={2}
        />
      </Field>

      <Field label="地点：">
        <input
          className="pixel-input"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="家 / 哪条街 / 哪家店"
        />
      </Field>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          className="h-4 w-4 accent-warm-orange"
          checked={wantsToRepeat}
          onChange={(e) => setWantsToRepeat(e.target.checked)}
        />
        <span className="text-lg">是否想再来一次</span>
      </label>

      {error ? (
        <p className="font-pixel text-[10px] text-warm-orange">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-1">
        <PixelButton type="submit">{saveLabel}</PixelButton>
        <PixelButton type="button" variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </PixelButton>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-pixel text-[10px] text-warm-orange tracking-widest">
        {label}
        {required ? " *" : ""}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
