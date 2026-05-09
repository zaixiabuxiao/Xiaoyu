"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { AlbumPhoto } from "@/lib/local-records";
import { useDiaryData } from "@/lib/use-diary-data";
import type { MemoryFolder } from "@/lib/memory-folders";
import PixelButton from "./PixelButton";

export type AlbumPhotoEditPayload = {
  date?: string;
  folderId?: string;
  folderName?: string;
  location?: string;
  note?: string;
};

type Props = {
  photo: AlbumPhoto;
  onSave: (payload: AlbumPhotoEditPayload) => void;
  onCancel: () => void;
};

const NEW_FOLDER_VALUE = "__new__";

export default function AlbumPhotoEditForm({ photo, onSave, onCancel }: Props) {
  const data = useDiaryData();
  const folders = data.folders;

  const initialFolderId =
    photo.folderId ??
    (photo.folderName
      ? folders.find((f) => f.name === photo.folderName)?.id
      : photo.location
        ? folders.find((f) => f.name === photo.location)?.id
        : undefined);

  const [date, setDate] = useState(photo.date ?? "");
  const [folderChoice, setFolderChoice] = useState<string>(
    initialFolderId ?? "",
  );
  const [newFolderName, setNewFolderName] = useState("");
  const [location, setLocation] = useState(photo.location ?? "");
  const [note, setNote] = useState(photo.note ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
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
    onSave({
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
          相册照片
        </p>
        <h2 className="font-display text-[20px] text-navy leading-snug mt-1">
          编辑这张照片
        </h2>
      </header>

      <div className="space-y-4">
        <PreviewBlock photo={photo} />

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
          <PixelButton type="submit">保存</PixelButton>
          <PixelButton type="button" variant="ghost" onClick={onCancel}>
            取消
          </PixelButton>
        </div>
      </div>
    </form>
  );
}

function PreviewBlock({ photo }: { photo: AlbumPhoto }) {
  return (
    <div className="space-y-1">
      <span className="block font-display text-[13px] text-navy">照片</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.photo}
        alt="编辑中的照片"
        className="block w-full max-h-56 object-cover border-3 border-navy bg-cream mt-1.5"
        style={{ imageRendering: "auto" }}
      />
    </div>
  );
}

export function FolderPickerField({
  folders,
  value,
  newFolderName,
  onChange,
  onChangeNewFolderName,
}: {
  folders: MemoryFolder[];
  value: string;
  newFolderName: string;
  onChange: (next: string) => void;
  onChangeNewFolderName: (next: string) => void;
}) {
  return (
    <Field label="地图文件夹" optional>
      <div className="space-y-2">
        <select
          className="pixel-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">没有地点的照片（默认）</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
          <option value={NEW_FOLDER_VALUE}>＋ 新建地图文件夹</option>
        </select>
        {value === NEW_FOLDER_VALUE ? (
          <input
            className="pixel-input"
            placeholder="新文件夹名称（如：京都）"
            value={newFolderName}
            onChange={(e) => onChangeNewFolderName(e.target.value)}
            autoFocus
          />
        ) : null}
      </div>
    </Field>
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
