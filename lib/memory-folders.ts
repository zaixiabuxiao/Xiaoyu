// Local memory folders for the 地图相册 (map album) view.
//
// Phase 9H. Folders are stored under `yuyang_memory_folders_v1` and contain
// a single seeded folder named "没有地点的照片". User-created folders use
// crypto.randomUUID(). Folder names are unique per device.
//
// Photos are NOT stored here — see `lib/local-records.ts` AlbumPhoto. A photo
// references a folder by `folderId` (preferred) or `folderName` (fallback for
// legacy rows). The UI computes folder membership in the same precedence so a
// photo with only a legacy `location` string still appears under a virtual
// folder of that name in the overview.
//
// Future cloud migration writes folders into `memory_folders` in Supabase
// (see supabase/migrations/003_memory_folders.sql). This module mirrors the
// shape so a one-way push from local to cloud stays straightforward.

export const DEFAULT_FOLDER_NAME = "没有地点的照片";

export const MEMORY_FOLDERS_STORAGE_KEY = "yuyang_memory_folders_v1";
export const MEMORY_FOLDERS_EVENT = "yuyang-memory-folders-changed";

export type MemoryFolder = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function isMemoryFolder(value: unknown): value is MemoryFolder {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.createdAt === "string" &&
    typeof v.updatedAt === "string" &&
    (v.description === undefined || typeof v.description === "string")
  );
}

function read(): MemoryFolder[] {
  if (!isBrowser()) return [defaultFolder()];
  try {
    const raw = window.localStorage.getItem(MEMORY_FOLDERS_STORAGE_KEY);
    if (!raw) return [defaultFolder()];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [defaultFolder()];
    const valid = parsed.filter(isMemoryFolder);
    if (valid.length === 0) return [defaultFolder()];
    return valid;
  } catch {
    return [defaultFolder()];
  }
}

function write(folders: MemoryFolder[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      MEMORY_FOLDERS_STORAGE_KEY,
      JSON.stringify(folders),
    );
    window.dispatchEvent(new Event(MEMORY_FOLDERS_EVENT));
  } catch {
    /* quota / privacy mode — ignore */
  }
}

function defaultFolder(): MemoryFolder {
  return {
    id: "seed-no-location",
    name: DEFAULT_FOLDER_NAME,
    createdAt: "1970-01-01T00:00:00.000Z",
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
}

function ensureDefault(folders: MemoryFolder[]): MemoryFolder[] {
  if (folders.some((f) => f.name === DEFAULT_FOLDER_NAME)) return folders;
  return [defaultFolder(), ...folders];
}

export function getMemoryFolders(): MemoryFolder[] {
  return ensureDefault(read());
}

export function getMemoryFolderById(id: string): MemoryFolder | undefined {
  return getMemoryFolders().find((f) => f.id === id);
}

export function getMemoryFolderByName(name: string): MemoryFolder | undefined {
  const trimmed = name.trim();
  return getMemoryFolders().find((f) => f.name === trimmed);
}

export function createMemoryFolder(input: {
  name: string;
  description?: string;
}): MemoryFolder {
  const trimmed = input.name.trim();
  if (!trimmed) throw new Error("文件夹名称不能为空。");
  const existing = getMemoryFolderByName(trimmed);
  if (existing) return existing;
  const desc = input.description?.trim();
  const created: MemoryFolder = {
    id: newId(),
    name: trimmed,
    description: desc && desc.length > 0 ? desc : undefined,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const next = [...getMemoryFolders(), created];
  write(next);
  return created;
}

export function updateMemoryFolder(
  id: string,
  patch: { name?: string; description?: string },
): MemoryFolder | null {
  const folders = getMemoryFolders();
  const idx = folders.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  const existing = folders[idx];
  const nextName =
    patch.name !== undefined ? patch.name.trim() : existing.name;
  if (!nextName) throw new Error("文件夹名称不能为空。");
  if (
    folders.some(
      (f) => f.id !== id && f.name === nextName,
    )
  ) {
    throw new Error("已经有同名的文件夹了。");
  }
  const nextDescRaw =
    patch.description !== undefined ? patch.description : existing.description;
  const nextDesc =
    typeof nextDescRaw === "string" ? nextDescRaw.trim() : undefined;
  const updated: MemoryFolder = {
    ...existing,
    name: nextName,
    description: nextDesc && nextDesc.length > 0 ? nextDesc : undefined,
    updatedAt: nowIso(),
  };
  const copy = [...folders];
  copy[idx] = updated;
  write(copy);
  return updated;
}

export function deleteMemoryFolder(id: string): boolean {
  const folders = getMemoryFolders();
  const target = folders.find((f) => f.id === id);
  // Refuse to delete the default folder — it's the safety net for orphan
  // photos.
  if (!target || target.name === DEFAULT_FOLDER_NAME) return false;
  const next = folders.filter((f) => f.id !== id);
  write(next);
  return true;
}

export function getOrCreateMemoryFolderByName(name: string): MemoryFolder {
  const trimmed = name.trim();
  if (!trimmed) {
    return getMemoryFolderByName(DEFAULT_FOLDER_NAME) ?? defaultFolder();
  }
  const existing = getMemoryFolderByName(trimmed);
  if (existing) return existing;
  return createMemoryFolder({ name: trimmed });
}
