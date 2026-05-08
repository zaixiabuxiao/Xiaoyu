"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import type { DailyRecord } from "@/lib/local-records";
import { lifeChapters } from "@/lib/mock-data";
import PixelButton from "./PixelButton";
import { PixelHeart } from "./PixelIcons";

export type RecordPayload = Omit<
  DailyRecord,
  "createdAt" | "photoRequired" | "timezone"
> & {
  createdAt?: string;
  timeLabel?: string;
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

const PHOTO_MISSING_ERROR =
  "这一页还缺一张今天的照片。\n放一张照片进来，我们再把它写进日记。";
const NOTE_MISSING_ERROR = "先写一句今天发生了什么吧。";
const PHOTO_READ_ERROR = "这张照片读不进来，换一张试试看。";

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

async function fileToCompressedDataURL(
  file: File,
  maxDim = 1280,
  quality = 0.85,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      if (typeof reader.result !== "string")
        return reject(new Error("read failed"));
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        try {
          const ratio = Math.min(
            maxDim / img.width,
            maxDim / img.height,
            1,
          );
          const w = Math.max(1, Math.round(img.width * ratio));
          const h = Math.max(1, Math.round(img.height * ratio));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("canvas unavailable"));
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function RecordChapterForm({
  date,
  chapterId,
  volumeId,
  chapterTitle,
  existing,
  onSave,
  onCancel,
  saveLabel,
  cancelLabel,
}: Props) {
  const isEdit = Boolean(existing);
  const resolvedSaveLabel = saveLabel ?? (isEdit ? "保存这一页" : "写下这一页");
  const resolvedCancelLabel =
    cancelLabel ?? (isEdit ? "先不改" : "先不写");

  const referencedChapterId = existing?.chapterId ?? chapterId;
  const referencedChapter = referencedChapterId
    ? lifeChapters.find((c) => c.id === referencedChapterId)
    : undefined;
  const numberLabel = referencedChapter
    ? `No.${referencedChapter.number.toString().padStart(2, "0")}`
    : null;
  const category = referencedChapter?.category ?? null;
  const headerTitle =
    chapterTitle ??
    existing?.title ??
    referencedChapter?.title ??
    `今天的小事 · ${date}`;

  const [note, setNote] = useState(existing?.note ?? "");
  const [memory, setMemory] = useState(existing?.memory ?? "");
  const [husband, setHusband] = useState(existing?.husbandReflection ?? "");
  const [wife, setWife] = useState(existing?.wifeReflection ?? "");
  const [location, setLocation] = useState(existing?.location ?? "");
  const [wantsToRepeat, setWantsToRepeat] = useState(
    existing?.wantsToRepeat ?? false,
  );
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    try {
      const dataUrl = await fileToCompressedDataURL(file);
      setPhotos([dataUrl]);
      if (error === PHOTO_MISSING_ERROR || error === PHOTO_READ_ERROR) {
        setError(null);
      }
    } catch {
      setError(PHOTO_READ_ERROR);
    } finally {
      setPhotoBusy(false);
    }
  }

  function handlePickPhoto() {
    fileInputRef.current?.click();
  }

  function handleRemovePhoto() {
    setPhotos([]);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (photos.length === 0) {
      setError(PHOTO_MISSING_ERROR);
      return;
    }
    if (!note.trim()) {
      setError(NOTE_MISSING_ERROR);
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
      photos,
      createdAt: existing?.createdAt,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <header className="pt-1 pb-3">
        <p className="font-pixel text-[10px] tracking-widest text-warm-orange">
          {isEdit ? "编辑这一页" : "今天这一页"}
        </p>
        {numberLabel && category ? (
          <p className="font-pixel text-[10px] mt-1 text-diary-orange-d">
            {numberLabel}{" "}
            <span className="font-display text-[12px] text-diary-ink-soft">
              · {category}
            </span>
          </p>
        ) : null}
        <h2 className="font-display text-[20px] text-navy leading-snug mt-1 break-words pr-10">
          {headerTitle}
        </h2>
        {!isEdit ? (
          <p className="text-[11.5px] text-diary-ink-soft mt-1.5">
            今天按洛杉矶时间写下。
          </p>
        ) : null}
      </header>

      <div className="space-y-4">
        <Field
          label="今日照片"
          required
          hint="上传一张今天的照片，让这一页真的属于今天。"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <PhotoSlot
            photo={photos[0]}
            busy={photoBusy}
            onPick={handlePickPhoto}
            onRemove={handleRemovePhoto}
          />
        </Field>

        <Field label="今天发生了什么" required>
          <textarea
            className="pixel-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="一两句话就够了。"
          />
        </Field>

        <Field label="我想记住的" optional>
          <textarea
            className="pixel-textarea"
            value={memory}
            onChange={(e) => setMemory(e.target.value)}
            rows={2}
            placeholder="那个最想留下来的瞬间。"
          />
        </Field>

        <Field label="我的感受" optional>
          <textarea
            className="pixel-textarea"
            value={husband}
            onChange={(e) => setHusband(e.target.value)}
            rows={2}
            placeholder="我今天心里是这样的……"
          />
        </Field>

        <Field label="她的感受" optional>
          <textarea
            className="pixel-textarea"
            value={wife}
            onChange={(e) => setWife(e.target.value)}
            rows={2}
            placeholder="她今天可能想留下的是……"
          />
        </Field>

        <Field label="地点" optional>
          <input
            className="pixel-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="家 / 哪条街 / 哪家店"
          />
        </Field>

        <RepeatRow
          checked={wantsToRepeat}
          onToggle={() => setWantsToRepeat((v) => !v)}
        />
      </div>

      <div className="sticky bottom-0 -mx-4 mt-4 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-cream border-t-2 border-dashed border-navy/25">
        {error ? (
          <p className="font-pixel text-[10px] text-warm-orange whitespace-pre-line leading-relaxed mb-2">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <PixelButton type="submit">{resolvedSaveLabel}</PixelButton>
          <PixelButton type="button" variant="ghost" onClick={onCancel}>
            {resolvedCancelLabel}
          </PixelButton>
        </div>
      </div>
    </form>
  );
}

function PhotoSlot({
  photo,
  busy,
  onPick,
  onRemove,
}: {
  photo?: string;
  busy: boolean;
  onPick: () => void;
  onRemove: () => void;
}) {
  if (!photo) {
    return (
      <button
        type="button"
        onClick={onPick}
        disabled={busy}
        className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 bg-white border-3 border-dashed border-navy text-center disabled:opacity-60"
      >
        <span
          aria-hidden="true"
          className="w-14 h-14 grid place-items-center bg-cream border-3 border-navy"
        >
          <span className="font-pixel text-xl text-navy leading-none">+</span>
        </span>
        <p className="font-display text-[15px] text-navy">
          {busy ? "正在读取这张照片…" : "放一张今天的照片进来"}
        </p>
      </button>
    );
  }
  return (
    <div className="space-y-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        alt="今日照片"
        className="block w-full max-h-56 object-cover border-3 border-navy bg-cream"
        style={{ imageRendering: "auto" }}
      />
      <div className="flex flex-wrap gap-2">
        <PixelButton type="button" variant="ghost" onClick={onPick}>
          {busy ? "更换中…" : "更换照片"}
        </PixelButton>
        <PixelButton type="button" variant="ghost" onClick={onRemove}>
          移除照片
        </PixelButton>
      </div>
    </div>
  );
}

function RepeatRow({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={`w-full flex items-center gap-3 px-3 py-3 border-3 transition-colors text-left ${
        checked
          ? "bg-warm-orange-soft border-navy"
          : "bg-white border-navy/40 hover:border-navy"
      }`}
    >
      <span
        aria-hidden="true"
        className={`shrink-0 w-6 h-6 grid place-items-center border-2 ${
          checked ? "bg-warm-orange border-navy" : "bg-cream border-navy/60"
        }`}
      >
        {checked ? (
          <PixelHeart size={12} color="#FBF3E2" shadow="#E8743B" />
        ) : (
          <span className="block w-1.5 h-1.5 bg-navy/20" />
        )}
      </span>
      <span className="font-display text-[15px] text-navy">
        是否想再来一次
      </span>
    </button>
  );
}

function Field({
  label,
  required,
  optional,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline gap-2">
        <span className="font-display text-[13px] text-navy">{label}</span>
        {required ? (
          <span className="font-pixel text-[9px] text-warm-orange tracking-widest">
            必填
          </span>
        ) : optional ? (
          <span className="font-pixel text-[9px] text-navy/40 tracking-widest">
            可选
          </span>
        ) : null}
      </span>
      {hint ? (
        <p className="text-[11.5px] text-diary-ink-soft mt-1 leading-snug">
          {hint}
        </p>
      ) : null}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
