"use client";

import { useState, type FormEvent } from "react";
import DiaryCard from "./DiaryCard";
import DiaryButton from "./DiaryButton";
import PixelButton from "./PixelButton";
import { PixelCalendar } from "./PixelIcons";
import {
  addImportantDate,
  deleteImportantDate,
  updateImportantDate,
  type ImportantDate,
} from "@/lib/important-dates";
import { useImportantDates } from "@/lib/use-important-dates";
import {
  daysSinceInLosAngeles,
  formatDateForDisplay,
} from "@/lib/date-utils";

type EditorMode =
  | { kind: "idle" }
  | { kind: "adding" }
  | { kind: "editing"; id: string }
  | { kind: "confirming-delete"; id: string };

export default function ImportantDatesEditor() {
  const { dates, hydrated } = useImportantDates();
  const [mode, setMode] = useState<EditorMode>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setMode({ kind: "idle" });
    setError(null);
  }

  function handleAdd(input: { label: string; date: string; note?: string }) {
    try {
      addImportantDate(input);
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存出错。");
    }
  }

  function handleUpdate(
    id: string,
    input: { label: string; date: string; note?: string },
  ) {
    try {
      updateImportantDate(id, input);
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存出错。");
    }
  }

  function handleDelete(id: string) {
    deleteImportantDate(id);
    reset();
  }

  return (
    <DiaryCard variant="soft">
      <p className="font-pixel text-[10px] tracking-widest text-warm-orange">
        US · 重要的日子
      </p>
      <p className="font-display text-[16px] text-navy mt-1 leading-snug">
        重要的日子
      </p>
      <p className="text-[13px] text-diary-ink-soft mt-2 leading-relaxed">
        这些日子，是这本日记最开始的书签。以后也可以继续加新的书签。
      </p>

      <div className="dash-h my-3" />

      {!hydrated ? (
        <p className="font-pixel text-[10px] text-navy/50">…</p>
      ) : (
        <ul className="space-y-3">
          {dates.map((d) => (
            <li key={d.id}>
              {mode.kind === "editing" && mode.id === d.id ? (
                <DateForm
                  initial={d}
                  submitLabel="保存"
                  onSubmit={(input) => handleUpdate(d.id, input)}
                  onCancel={reset}
                  error={error}
                />
              ) : mode.kind === "confirming-delete" && mode.id === d.id ? (
                <DeleteConfirm
                  date={d}
                  onConfirm={() => handleDelete(d.id)}
                  onCancel={reset}
                />
              ) : (
                <DateRow
                  date={d}
                  disabled={mode.kind !== "idle"}
                  onEdit={() => {
                    setMode({ kind: "editing", id: d.id });
                    setError(null);
                  }}
                  onDelete={() => {
                    setMode({ kind: "confirming-delete", id: d.id });
                    setError(null);
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        {mode.kind === "adding" ? (
          <DateForm
            submitLabel="保存"
            onSubmit={handleAdd}
            onCancel={reset}
            error={error}
          />
        ) : mode.kind === "idle" ? (
          <DiaryButton
            type="button"
            variant="small"
            onClick={() => {
              setMode({ kind: "adding" });
              setError(null);
            }}
          >
            添加日子
          </DiaryButton>
        ) : null}
      </div>
    </DiaryCard>
  );
}

function DateRow({
  date,
  disabled,
  onEdit,
  onDelete,
}: {
  date: ImportantDate;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const days = daysSinceInLosAngeles(date.date);
  const dayLabel =
    days >= 0 ? `第 ${days} 天` : `还有 ${Math.abs(days)} 天`;
  return (
    <div className="flex items-start gap-2">
      <PixelCalendar size={12} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-display text-[15px] text-navy">
            {date.label}
          </span>
          <span className="font-pixel text-[10px] text-diary-orange-d">
            {formatDateForDisplay(date.date)}
          </span>
          <span className="font-pixel text-[10px] text-diary-ink-soft">
            · {dayLabel}
          </span>
        </div>
        {date.note ? (
          <p className="text-[12px] text-diary-ink-soft mt-1 leading-relaxed">
            {date.note}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-2">
          <PixelButton
            type="button"
            variant="ghost"
            onClick={onEdit}
            disabled={disabled}
          >
            编辑
          </PixelButton>
          <PixelButton
            type="button"
            variant="ghost"
            onClick={onDelete}
            disabled={disabled}
          >
            删除
          </PixelButton>
        </div>
      </div>
    </div>
  );
}

function DateForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  error,
}: {
  initial?: ImportantDate;
  submitLabel: string;
  onSubmit: (input: { label: string; date: string; note?: string }) => void;
  onCancel: () => void;
  error: string | null;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [note, setNote] = useState(initial?.note ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      label,
      date,
      note: note.trim() ? note : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label="名称">
        <input
          type="text"
          required
          maxLength={40}
          className="pixel-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </Field>
      <Field label="日期">
        <input
          type="date"
          required
          className="pixel-input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>
      <Field label="备注（可选）">
        <input
          type="text"
          maxLength={80}
          className="pixel-input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      {error ? (
        <p className="font-pixel text-[10px] text-warm-orange leading-relaxed">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <DiaryButton type="submit" variant="small">
          {submitLabel}
        </DiaryButton>
        <PixelButton type="button" variant="ghost" onClick={onCancel}>
          取消
        </PixelButton>
      </div>
    </form>
  );
}

function DeleteConfirm({
  date,
  onConfirm,
  onCancel,
}: {
  date: ImportantDate;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[13px] text-navy leading-relaxed">
        确认删除「{date.label}」（{formatDateForDisplay(date.date)}）这个书签吗？
      </p>
      <div className="flex gap-2">
        <DiaryButton type="button" variant="small" onClick={onConfirm}>
          确认删除
        </DiaryButton>
        <PixelButton type="button" variant="ghost" onClick={onCancel}>
          取消
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
