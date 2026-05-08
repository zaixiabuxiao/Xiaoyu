"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import type { DailyRecord } from "@/lib/local-records";
import PixelButton from "./PixelButton";

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
  saveLabel = "写下这一页",
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
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayTitle = chapterTitle ?? existing?.title;

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    try {
      const dataUrl = await fileToCompressedDataURL(file);
      setPhotos([dataUrl]);
      if (error === PHOTO_MISSING_ERROR) setError(null);
    } catch {
      setError("这张照片读不进来，换一张试试看。");
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
      photos,
      createdAt: existing?.createdAt,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="font-pixel text-[10px] text-warm-orange tracking-widest">
          {existing ? "编辑这一页" : "今天这一页"}
        </p>
        <p className="font-pixel text-xs mt-1 leading-snug">
          {displayTitle ?? `${date} · 自由记录`}
        </p>
      </div>

      <Field label="今日照片" required>
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
        <p className="font-pixel text-[10px] text-warm-orange whitespace-pre-line leading-relaxed">
          {error}
        </p>
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
        className="w-full flex items-center gap-3 p-3 bg-cream border-3 border-dashed border-navy text-left disabled:opacity-60"
      >
        <span
          className="shrink-0 w-12 h-12 grid place-items-center bg-white border-3 border-navy text-navy font-pixel text-base"
          aria-hidden="true"
        >
          +
        </span>
        <span className="min-w-0 text-base text-navy leading-snug">
          {busy ? "正在读取这张照片…" : "上传一张今天的照片，让这一页真的属于今天。"}
        </span>
      </button>
    );
  }
  return (
    <div className="flex items-start gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        alt="今日照片"
        width={80}
        height={80}
        className="shrink-0 w-20 h-20 object-cover border-3 border-navy bg-cream"
        style={{ imageRendering: "auto" }}
      />
      <div className="flex flex-col gap-2">
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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
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
