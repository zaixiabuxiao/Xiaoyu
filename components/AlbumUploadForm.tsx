"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { fileToCompressedDataURL } from "@/lib/photo-utils";
import { useDiaryData } from "@/lib/use-diary-data";
import { FolderPickerField } from "./AlbumPhotoEditForm";
import PixelButton from "./PixelButton";

export type AlbumUploadPayload = {
  photo: string;
  date?: string;
  folderId?: string;
  folderName?: string;
  location?: string;
  note?: string;
};

type Props = {
  onSave: (payload: AlbumUploadPayload) => void;
  onCancel: () => void;
};

const PHOTO_MISSING_ERROR = "先选一张照片，我们再把它放进相册。";
const PHOTO_READ_ERROR = "这张照片读不进来，换一张试试看。";
const NEW_FOLDER_VALUE = "__new__";

export default function AlbumUploadForm({ onSave, onCancel }: Props) {
  const data = useDiaryData();
  const folders = data.folders;
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [date, setDate] = useState("");
  const [folderChoice, setFolderChoice] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
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
      setPhoto(dataUrl);
      if (error === PHOTO_MISSING_ERROR || error === PHOTO_READ_ERROR) {
        setError(null);
      }
    } catch {
      setError(PHOTO_READ_ERROR);
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!photo) {
      setError(PHOTO_MISSING_ERROR);
      return;
    }
    let folderId: string | undefined;
    let folderName: string | undefined;
    if (folderChoice === NEW_FOLDER_VALUE) {
      const trimmed = newFolderName.trim();
      if (!trimmed) {
        setError("新文件夹名称不能为空。");
        return;
      }
      const result = await data.getOrCreateMemoryFolderByName(trimmed);
      if (!result.ok) {
        setError(result.message || "新建文件夹出错。");
        return;
      }
      folderId = result.data.id;
      folderName = result.data.name;
    } else if (folderChoice) {
      const found = folders.find((f) => f.id === folderChoice);
      if (found) {
        folderId = found.id;
        folderName = found.name;
      }
    }
    setError(null);
    onSave({
      photo,
      date: date.trim() || undefined,
      folderId,
      folderName,
      location: location.trim() || undefined,
      note: note.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <header className="pt-1 pb-3 pr-10">
        <p className="font-pixel text-[10px] tracking-widest text-warm-orange">
          地图相册
        </p>
        <h2 className="font-display text-[20px] text-navy leading-snug mt-1">
          放进地图相册
        </h2>
        <p className="text-[12px] text-diary-ink-soft mt-1.5 leading-snug">
          把以前的照片放进对应的回忆地点里。
          <br />
          不是每一张照片都要写成长篇故事，留一句也很好。
        </p>
      </header>

      <div className="space-y-4">
        <Field label="照片" required>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {photo ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt="选中的照片"
                className="block w-full max-h-56 object-cover border-3 border-navy bg-cream"
                style={{ imageRendering: "auto" }}
              />
              <div className="flex flex-wrap gap-2">
                <PixelButton
                  type="button"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoBusy ? "更换中…" : "更换照片"}
                </PixelButton>
                <PixelButton
                  type="button"
                  variant="ghost"
                  onClick={() => setPhoto(undefined)}
                >
                  移除照片
                </PixelButton>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoBusy}
              className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 bg-white border-3 border-dashed border-navy text-center disabled:opacity-60"
            >
              <span
                aria-hidden="true"
                className="w-14 h-14 grid place-items-center bg-cream border-3 border-navy"
              >
                <span className="font-pixel text-xl text-navy leading-none">
                  +
                </span>
              </span>
              <p className="font-display text-[15px] text-navy">
                {photoBusy ? "正在读取这张照片…" : "选一张以前的照片"}
              </p>
            </button>
          )}
        </Field>

        <Field label="照片日期" optional>
          <input
            type="date"
            className="pixel-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>

        <FolderPickerField
          folders={folders}
          value={folderChoice}
          newFolderName={newFolderName}
          onChange={setFolderChoice}
          onChangeNewFolderName={setNewFolderName}
        />

        <Field label="地点" optional>
          <input
            className="pixel-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="家 / 哪条街 / 哪家店"
          />
        </Field>

        <Field label="这张照片的故事" optional>
          <textarea
            className="pixel-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="一句也好。"
          />
        </Field>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-4 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-cream border-t-2 border-dashed border-navy/25">
        {error ? (
          <p className="font-pixel text-[10px] text-warm-orange whitespace-pre-line leading-relaxed mb-2">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <PixelButton type="submit">放进地图相册</PixelButton>
          <PixelButton type="button" variant="ghost" onClick={onCancel}>
            先不上传
          </PixelButton>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
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
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
