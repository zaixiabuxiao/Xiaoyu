"use client";

// Phase 9J: cloud-first data orchestrator.
//
// One <DiaryDataProvider> mounted at the top of AppShell becomes the single
// data source for /home, /chapters, /memories, /us. Reads:
//   - cloud-active path (env enabled + Supabase session + diary_space resolved)
//     → load cloud snapshot, resolve signed URLs, expose `source: "cloud"`.
//   - cloud-failure path → fall back to localStorage; expose `source: "cache"`.
//   - cloud-disabled / signed-out path → use localStorage; expose
//     `source: "local"`.
//
// Writes go cloud-first when active, then mirror to localStorage so the
// local cache stays warm for subsequent offline sessions. When cloud is not
// active, writes go straight to localStorage as before.
//
// Bundle hygiene: ALL `@supabase/supabase-js`-touching helpers come from a
// single dynamic `await import("./cloud/bridge")` so the cloud code lands
// in its own async chunk. The first-load JS for /home, /chapters, /memories,
// and /us therefore stays the same as before this hook existed.
//
// Important dates are intentionally NOT routed through this hook in 9J —
// they continue to live under `lib/important-dates.ts` and `useImportantDates`.
// The plan is to migrate them into Supabase `app_settings` in a follow-up
// (Phase 9K) so this phase ships a smaller, safer surface.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  saveDailyRecord as localSaveDaily,
  updateDailyRecord as localUpdateDaily,
  deleteDailyRecord as localDeleteDaily,
  saveAlbumPhoto as localSaveAlbum,
  updateAlbumPhoto as localUpdateAlbum,
  deleteAlbumPhoto as localDeleteAlbum,
  addPlannedChapter as localAddPlanned,
  removePlannedChapter as localRemovePlanned,
  getDailyRecords,
  getAlbumPhotos,
  getPlannedChapters,
  STORAGE_EVENTS,
  type AlbumPhoto,
  type DailyRecord,
} from "./local-records";
import {
  createMemoryFolder as localCreateFolder,
  updateMemoryFolder as localUpdateFolder,
  deleteMemoryFolder as localDeleteFolder,
  getMemoryFolders,
  getOrCreateMemoryFolderByName as localGetOrCreateFolder,
  MEMORY_FOLDERS_EVENT,
  type MemoryFolder,
} from "./memory-folders";
import { isCloudEnabled } from "./cloud-config";
import type { CloudErrorCode } from "./cloud/errors";
import type { CloudSession } from "./cloud/auth";

export type DataSource = "cloud" | "cache" | "local";

export type SaveDailyPayload = {
  date: string;
  chapterId: string;
  volumeId: string;
  title: string;
  note: string;
  memory?: string;
  husbandReflection?: string;
  wifeReflection?: string;
  location?: string;
  wantsToRepeat?: boolean;
  photos: string[]; // data URLs
  timeLabel?: string;
};

export type UpdateDailyPatch = Partial<
  Pick<
    DailyRecord,
    | "title"
    | "note"
    | "memory"
    | "husbandReflection"
    | "wifeReflection"
    | "location"
    | "wantsToRepeat"
    | "photos"
    | "timeLabel"
  >
>;

export type SaveAlbumPayload = {
  photo: string; // data URL
  date?: string;
  folderId?: string;
  folderName?: string;
  location?: string;
  note?: string;
};

export type UpdateAlbumPatch = {
  date?: string;
  folderId?: string;
  folderName?: string;
  location?: string;
  note?: string;
};

export type WriteResult<T> =
  | { ok: true; data: T; source: "cloud" | "local" }
  | {
      ok: false;
      code: CloudErrorCode | "LOCAL_FAILED";
      message: string;
    };

export type DiaryDataValue = {
  records: DailyRecord[];
  planned: string[];
  album: AlbumPhoto[];
  folders: MemoryFolder[];
  hydrated: boolean;
  loading: boolean;
  source: DataSource;
  cloudActive: boolean;
  signedIn: boolean;
  diarySpaceId: string | null;
  error: string | null;

  refresh: () => Promise<void>;
  saveDailyRecord: (
    payload: SaveDailyPayload,
  ) => Promise<WriteResult<DailyRecord>>;
  updateDailyRecord: (
    date: string,
    patch: UpdateDailyPatch,
  ) => Promise<WriteResult<void>>;
  deleteDailyRecord: (date: string) => Promise<WriteResult<void>>;
  saveAlbumPhoto: (
    payload: SaveAlbumPayload,
  ) => Promise<WriteResult<AlbumPhoto>>;
  updateAlbumPhoto: (
    id: string,
    patch: UpdateAlbumPatch,
  ) => Promise<WriteResult<void>>;
  deleteAlbumPhoto: (id: string) => Promise<WriteResult<void>>;
  addPlannedChapter: (chapterId: string) => Promise<WriteResult<void>>;
  removePlannedChapter: (chapterId: string) => Promise<WriteResult<void>>;
  createMemoryFolder: (
    name: string,
    description?: string,
  ) => Promise<WriteResult<MemoryFolder>>;
  updateMemoryFolder: (
    id: string,
    patch: { name?: string; description?: string },
  ) => Promise<WriteResult<void>>;
  deleteMemoryFolder: (id: string) => Promise<WriteResult<boolean>>;
  getOrCreateMemoryFolderByName: (
    name: string,
  ) => Promise<WriteResult<MemoryFolder>>;
};

const DiaryDataContext = createContext<DiaryDataValue | null>(null);

type SnapshotCaches = {
  cloudRecordIdByDate: Map<string, string>;
  cloudAlbumStoragePathById: Map<string, string>;
  cloudAlbumFolderIdById: Map<string, string | null>;
  cloudFolderIdByName: Map<string, string>;
  cloudDailyPhotoStoragePathsByDate: Map<string, string[]>;
};

function emptyCaches(): SnapshotCaches {
  return {
    cloudRecordIdByDate: new Map(),
    cloudAlbumStoragePathById: new Map(),
    cloudAlbumFolderIdById: new Map(),
    cloudFolderIdByName: new Map(),
    cloudDailyPhotoStoragePathsByDate: new Map(),
  };
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  if (!dataUrl.startsWith("data:")) {
    throw new Error("photo is not a data URL");
  }
  const res = await fetch(dataUrl);
  return await res.blob();
}

function readLocalSnapshot(): {
  records: DailyRecord[];
  planned: string[];
  album: AlbumPhoto[];
  folders: MemoryFolder[];
} {
  return {
    records: getDailyRecords(),
    planned: getPlannedChapters(),
    album: getAlbumPhotos(),
    folders: getMemoryFolders(),
  };
}

// One-shot dynamic import of the cloud helpers. Cached after first load so
// repeated mutations don't keep re-importing.
type CloudBridge = typeof import("./cloud/bridge");
let cachedBridge: Promise<CloudBridge> | null = null;
function loadCloudBridge(): Promise<CloudBridge> {
  if (!cachedBridge) {
    cachedBridge = import("./cloud/bridge");
  }
  return cachedBridge;
}

export function DiaryDataProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [_session, setSession] = useState<CloudSession | null>(null);
  const [diarySpaceId, setDiarySpaceId] = useState<string | null>(null);

  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [planned, setPlanned] = useState<string[]>([]);
  const [album, setAlbum] = useState<AlbumPhoto[]>([]);
  const [folders, setFolders] = useState<MemoryFolder[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<DataSource>("local");
  const [error, setError] = useState<string | null>(null);

  const cachesRef = useRef<SnapshotCaches>(emptyCaches());

  const cloudFlagOn = isCloudEnabled();
  const cloudActive = cloudFlagOn && signedIn && diarySpaceId !== null;

  // ── Auth subscription ──────────────────────────────────────────────────
  useEffect(() => {
    if (!cloudFlagOn) {
      setHydrated(true);
      return;
    }
    let mounted = true;
    let unsubscribe = () => {};
    void (async () => {
      const bridge = await loadCloudBridge();
      const result = await bridge.getCurrentCloudSession();
      if (!mounted) return;
      if (result.ok) {
        setSession(result.data);
        setSignedIn(result.data !== null);
      } else {
        setSession(null);
        setSignedIn(false);
      }
      unsubscribe = bridge.subscribeCloudAuthChanges((next) => {
        if (!mounted) return;
        setSession(next);
        setSignedIn(next !== null);
      });
    })();
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [cloudFlagOn]);

  // ── Resolve diary space when signed in ────────────────────────────────
  useEffect(() => {
    if (!cloudFlagOn || !signedIn) {
      setDiarySpaceId(null);
      return;
    }
    let mounted = true;
    void (async () => {
      const bridge = await loadCloudBridge();
      const result = await bridge.getCloudDiarySpace();
      if (!mounted) return;
      if (result.ok && result.data) {
        setDiarySpaceId(result.data.id);
      } else {
        setDiarySpaceId(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [cloudFlagOn, signedIn]);

  // ── Loading: cloud-first, then local fallback ─────────────────────────
  const fetchSnapshot = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (cloudActive && diarySpaceId) {
      const bridge = await loadCloudBridge();
      const result = await bridge.loadCloudSnapshot(diarySpaceId);
      if (result.ok) {
        const snap = result.data;
        cachesRef.current = {
          cloudRecordIdByDate: snap.cloudRecordIdByDate,
          cloudAlbumStoragePathById: snap.cloudAlbumStoragePathById,
          cloudAlbumFolderIdById: snap.cloudAlbumFolderIdById,
          cloudFolderIdByName: snap.cloudFolderIdByName,
          cloudDailyPhotoStoragePathsByDate:
            snap.cloudDailyPhotoStoragePathsByDate,
        };
        setRecords(snap.records);
        setPlanned(snap.planned);
        setAlbum(snap.album);
        setFolders(snap.folders);
        setSource("cloud");
        setLoading(false);
        setHydrated(true);
        return;
      }
      // Cloud failed — fall back to local cache and remember the error.
      const local = readLocalSnapshot();
      setRecords(local.records);
      setPlanned(local.planned);
      setAlbum(local.album);
      setFolders(local.folders);
      setSource("cache");
      setError("云端暂时没有连上，这台设备先显示本地记录。");
      setLoading(false);
      setHydrated(true);
      return;
    }

    // Cloud disabled or not signed in — local mode.
    const local = readLocalSnapshot();
    setRecords(local.records);
    setPlanned(local.planned);
    setAlbum(local.album);
    setFolders(local.folders);
    setSource("local");
    setLoading(false);
    setHydrated(true);
  }, [cloudActive, diarySpaceId]);

  // Initial + auth-change refetch
  useEffect(() => {
    void fetchSnapshot();
  }, [fetchSnapshot]);

  // Keep local-mode state in sync with localStorage events from other tabs
  // and from cache writes done by mutations below.
  useEffect(() => {
    if (cloudActive) return;
    const refresh = () => {
      const local = readLocalSnapshot();
      setRecords(local.records);
      setPlanned(local.planned);
      setAlbum(local.album);
      setFolders(local.folders);
    };
    window.addEventListener(STORAGE_EVENTS.records, refresh);
    window.addEventListener(STORAGE_EVENTS.planned, refresh);
    window.addEventListener(STORAGE_EVENTS.album, refresh);
    window.addEventListener(MEMORY_FOLDERS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(STORAGE_EVENTS.records, refresh);
      window.removeEventListener(STORAGE_EVENTS.planned, refresh);
      window.removeEventListener(STORAGE_EVENTS.album, refresh);
      window.removeEventListener(MEMORY_FOLDERS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [cloudActive]);

  // ── Mutations ──────────────────────────────────────────────────────────

  const saveDailyRecord = useCallback(
    async (payload: SaveDailyPayload): Promise<WriteResult<DailyRecord>> => {
      if (!cloudActive || !diarySpaceId) {
        try {
          const saved = localSaveDaily({
            date: payload.date,
            chapterId: payload.chapterId,
            volumeId: payload.volumeId,
            title: payload.title,
            note: payload.note,
            memory: payload.memory,
            husbandReflection: payload.husbandReflection,
            wifeReflection: payload.wifeReflection,
            location: payload.location,
            wantsToRepeat: payload.wantsToRepeat,
            photos: payload.photos,
            timeLabel: payload.timeLabel,
          });
          return { ok: true, data: saved, source: "local" };
        } catch (e) {
          return {
            ok: false,
            code: "LOCAL_FAILED",
            message:
              e instanceof Error ? e.message : "保存到本地时出了点小状况。",
          };
        }
      }

      const bridge = await loadCloudBridge();
      const client = bridge.getSupabaseClient();
      if (!client) {
        return {
          ok: false,
          code: "SUPABASE_NOT_CONFIGURED",
          message: "云端身份断开了，请先重新连接。",
        };
      }

      // Upload all photos first to a per-date prefix under the diary_space.
      // RLS only requires the leading `{diary_space_id}/` segment.
      const photoPaths: { storagePath: string; position: number }[] = [];
      try {
        for (let i = 0; i < payload.photos.length; i++) {
          const dataUrl = payload.photos[i];
          const blob = await dataUrlToBlob(dataUrl);
          const filename = `${i}-${crypto.randomUUID()}.jpg`;
          const storagePath = `${diarySpaceId}/${payload.date}/${filename}`;
          const upload = await client.storage
            .from(bridge.DAILY_PHOTOS_BUCKET)
            .upload(storagePath, blob, {
              contentType: "image/jpeg",
              upsert: false,
            });
          if (upload.error) {
            return {
              ok: false,
              code: "UNKNOWN",
              message: "这张照片没有传上去，稍后再试一次。",
            };
          }
          photoPaths.push({ storagePath, position: i });
        }
      } catch {
        return {
          ok: false,
          code: "UNKNOWN",
          message: "这张照片没有传上去，稍后再试一次。",
        };
      }

      const result = await bridge.saveCloudDailyRecord({
        diarySpaceId,
        laDate: payload.date,
        chapterId: payload.chapterId,
        volumeId: payload.volumeId,
        title: payload.title,
        note: payload.note,
        memory: payload.memory,
        husbandReflection: payload.husbandReflection,
        wifeReflection: payload.wifeReflection,
        location: payload.location,
        wantsToRepeat: payload.wantsToRepeat,
        timeLabel: payload.timeLabel,
        photos: photoPaths,
      });
      if (!result.ok) {
        return { ok: false, code: result.code, message: result.message };
      }
      // Mirror to local cache (best-effort) so offline reads have it.
      try {
        localSaveDaily({
          date: payload.date,
          chapterId: payload.chapterId,
          volumeId: payload.volumeId,
          title: payload.title,
          note: payload.note,
          memory: payload.memory,
          husbandReflection: payload.husbandReflection,
          wifeReflection: payload.wifeReflection,
          location: payload.location,
          wantsToRepeat: payload.wantsToRepeat,
          photos: payload.photos,
          timeLabel: payload.timeLabel,
        });
      } catch {
        /* duplicate is fine — DB is authoritative */
      }
      await fetchSnapshot();
      const fresh = getDailyRecords().find((r) => r.date === payload.date);
      return {
        ok: true,
        data:
          fresh ??
          ({
            date: payload.date,
            chapterId: payload.chapterId,
            volumeId: payload.volumeId,
            title: payload.title,
            note: payload.note,
            memory: payload.memory,
            husbandReflection: payload.husbandReflection,
            wifeReflection: payload.wifeReflection,
            location: payload.location,
            wantsToRepeat: payload.wantsToRepeat,
            photos: payload.photos,
            photoRequired: true,
            timezone: "America/Los_Angeles",
            timeLabel: payload.timeLabel,
            createdAt: new Date().toISOString(),
          } as DailyRecord),
        source: "cloud",
      };
    },
    [cloudActive, diarySpaceId, fetchSnapshot],
  );

  const updateDailyRecord = useCallback(
    async (
      date: string,
      patch: UpdateDailyPatch,
    ): Promise<WriteResult<void>> => {
      // Local cache update always — cheap and keeps offline view consistent.
      localUpdateDaily(date, patch);

      if (!cloudActive || !diarySpaceId) {
        return { ok: true, data: undefined, source: "local" };
      }
      const recordId = cachesRef.current.cloudRecordIdByDate.get(date);
      if (!recordId) {
        return { ok: true, data: undefined, source: "cloud" };
      }
      const bridge = await loadCloudBridge();
      const result = await bridge.updateCloudDailyRecord(recordId, {
        title: patch.title,
        note: patch.note,
        memory: patch.memory ?? null,
        husbandReflection: patch.husbandReflection ?? null,
        wifeReflection: patch.wifeReflection ?? null,
        location: patch.location ?? null,
        wantsToRepeat: patch.wantsToRepeat,
        timeLabel: patch.timeLabel ?? null,
      });
      if (!result.ok) {
        return { ok: false, code: result.code, message: result.message };
      }
      await fetchSnapshot();
      return { ok: true, data: undefined, source: "cloud" };
    },
    [cloudActive, diarySpaceId, fetchSnapshot],
  );

  const deleteDailyRecord = useCallback(
    async (date: string): Promise<WriteResult<void>> => {
      const cloudId = cachesRef.current.cloudRecordIdByDate.get(date);
      const cloudPaths =
        cachesRef.current.cloudDailyPhotoStoragePathsByDate.get(date) ?? [];

      // Remove local first (cache + cloud both share this view).
      localDeleteDaily(date);

      if (!cloudActive || !diarySpaceId || !cloudId) {
        return { ok: true, data: undefined, source: "local" };
      }
      const bridge = await loadCloudBridge();
      const cloud = await bridge.deleteCloudDailyRecord(cloudId);
      if (!cloud.ok) {
        return { ok: false, code: cloud.code, message: cloud.message };
      }
      // Best-effort photo file cleanup; ignore failures.
      await Promise.all(
        cloudPaths.map((p) =>
          bridge.deletePhoto(bridge.DAILY_PHOTOS_BUCKET, p),
        ),
      );
      await fetchSnapshot();
      return { ok: true, data: undefined, source: "cloud" };
    },
    [cloudActive, diarySpaceId, fetchSnapshot],
  );

  const saveAlbumPhoto = useCallback(
    async (
      payload: SaveAlbumPayload,
    ): Promise<WriteResult<AlbumPhoto>> => {
      if (!cloudActive || !diarySpaceId) {
        const saved = localSaveAlbum(payload);
        return { ok: true, data: saved, source: "local" };
      }
      const bridge = await loadCloudBridge();
      // Cloud path: upload bytes, then insert row referencing the storage path.
      const albumPhotoId = crypto.randomUUID();
      let blob: Blob;
      try {
        blob = await dataUrlToBlob(payload.photo);
      } catch {
        return {
          ok: false,
          code: "UNKNOWN",
          message: "这张照片没有传上去，稍后再试一次。",
        };
      }
      const upload = await bridge.uploadAlbumPhoto({
        diarySpaceId,
        albumPhotoId,
        blob,
      });
      if (!upload.ok) {
        return { ok: false, code: upload.code, message: upload.message };
      }
      const result = await bridge.saveCloudAlbumPhoto({
        diarySpaceId,
        storagePath: upload.data.storagePath,
        takenOn: payload.date,
        location: payload.location,
        note: payload.note,
        folderId: payload.folderId,
      });
      if (!result.ok) {
        return { ok: false, code: result.code, message: result.message };
      }
      // Mirror to local cache so the same id is reusable offline.
      const mirrored = localSaveAlbum({
        ...payload,
        id: result.data.id,
      });
      await fetchSnapshot();
      return { ok: true, data: mirrored, source: "cloud" };
    },
    [cloudActive, diarySpaceId, fetchSnapshot],
  );

  const updateAlbumPhoto = useCallback(
    async (
      id: string,
      patch: UpdateAlbumPatch,
    ): Promise<WriteResult<void>> => {
      localUpdateAlbum(id, patch);
      if (!cloudActive || !diarySpaceId) {
        return { ok: true, data: undefined, source: "local" };
      }
      const bridge = await loadCloudBridge();
      const result = await bridge.updateCloudAlbumPhoto(id, {
        takenOn: patch.date ?? null,
        location: patch.location ?? null,
        note: patch.note ?? null,
        folderId: patch.folderId ?? null,
      });
      if (!result.ok) {
        return { ok: false, code: result.code, message: result.message };
      }
      await fetchSnapshot();
      return { ok: true, data: undefined, source: "cloud" };
    },
    [cloudActive, diarySpaceId, fetchSnapshot],
  );

  const deleteAlbumPhoto = useCallback(
    async (id: string): Promise<WriteResult<void>> => {
      const storagePath = cachesRef.current.cloudAlbumStoragePathById.get(id);
      localDeleteAlbum(id);
      if (!cloudActive || !diarySpaceId) {
        return { ok: true, data: undefined, source: "local" };
      }
      const bridge = await loadCloudBridge();
      const result = await bridge.deleteCloudAlbumPhoto(id);
      if (!result.ok) {
        return { ok: false, code: result.code, message: result.message };
      }
      if (storagePath) {
        await bridge.deletePhoto(bridge.ALBUM_PHOTOS_BUCKET, storagePath);
      }
      await fetchSnapshot();
      return { ok: true, data: undefined, source: "cloud" };
    },
    [cloudActive, diarySpaceId, fetchSnapshot],
  );

  const addPlannedChapter = useCallback(
    async (chapterId: string): Promise<WriteResult<void>> => {
      localAddPlanned(chapterId);
      if (!cloudActive || !diarySpaceId) {
        return { ok: true, data: undefined, source: "local" };
      }
      const bridge = await loadCloudBridge();
      const result = await bridge.addCloudPlannedChapter(
        diarySpaceId,
        chapterId,
      );
      if (!result.ok) {
        return { ok: false, code: result.code, message: result.message };
      }
      await fetchSnapshot();
      return { ok: true, data: undefined, source: "cloud" };
    },
    [cloudActive, diarySpaceId, fetchSnapshot],
  );

  const removePlannedChapter = useCallback(
    async (chapterId: string): Promise<WriteResult<void>> => {
      localRemovePlanned(chapterId);
      if (!cloudActive || !diarySpaceId) {
        return { ok: true, data: undefined, source: "local" };
      }
      const bridge = await loadCloudBridge();
      const result = await bridge.removeCloudPlannedChapter(
        diarySpaceId,
        chapterId,
      );
      if (!result.ok) {
        return { ok: false, code: result.code, message: result.message };
      }
      await fetchSnapshot();
      return { ok: true, data: undefined, source: "cloud" };
    },
    [cloudActive, diarySpaceId, fetchSnapshot],
  );

  const createMemoryFolderFn = useCallback(
    async (
      name: string,
      description?: string,
    ): Promise<WriteResult<MemoryFolder>> => {
      const local = localCreateFolder({ name, description });
      if (!cloudActive || !diarySpaceId) {
        return { ok: true, data: local, source: "local" };
      }
      const bridge = await loadCloudBridge();
      const result = await bridge.createCloudMemoryFolder({
        diarySpaceId,
        name,
        description,
      });
      if (!result.ok) {
        return { ok: false, code: result.code, message: result.message };
      }
      await fetchSnapshot();
      return {
        ok: true,
        data: {
          id: result.data.id,
          name: result.data.name,
          description: result.data.description ?? undefined,
          createdAt: result.data.created_at,
          updatedAt: result.data.updated_at,
        },
        source: "cloud",
      };
    },
    [cloudActive, diarySpaceId, fetchSnapshot],
  );

  const updateMemoryFolderFn = useCallback(
    async (
      id: string,
      patch: { name?: string; description?: string },
    ): Promise<WriteResult<void>> => {
      try {
        localUpdateFolder(id, patch);
      } catch (e) {
        return {
          ok: false,
          code: "LOCAL_FAILED",
          message: e instanceof Error ? e.message : "更新文件夹时出错了。",
        };
      }
      if (!cloudActive || !diarySpaceId) {
        return { ok: true, data: undefined, source: "local" };
      }
      const bridge = await loadCloudBridge();
      const result = await bridge.updateCloudMemoryFolder(id, patch);
      if (!result.ok) {
        return { ok: false, code: result.code, message: result.message };
      }
      await fetchSnapshot();
      return { ok: true, data: undefined, source: "cloud" };
    },
    [cloudActive, diarySpaceId, fetchSnapshot],
  );

  const deleteMemoryFolderFn = useCallback(
    async (id: string): Promise<WriteResult<boolean>> => {
      const localOk = localDeleteFolder(id);
      if (!cloudActive || !diarySpaceId) {
        return { ok: true, data: localOk, source: "local" };
      }
      const bridge = await loadCloudBridge();
      const result = await bridge.deleteCloudMemoryFolder(id);
      if (!result.ok) {
        return { ok: false, code: result.code, message: result.message };
      }
      await fetchSnapshot();
      return { ok: true, data: true, source: "cloud" };
    },
    [cloudActive, diarySpaceId, fetchSnapshot],
  );

  const getOrCreateMemoryFolderByNameFn = useCallback(
    async (name: string): Promise<WriteResult<MemoryFolder>> => {
      const localFolder = localGetOrCreateFolder(name);
      if (!cloudActive || !diarySpaceId) {
        return { ok: true, data: localFolder, source: "local" };
      }
      const bridge = await loadCloudBridge();
      const result = await bridge.getOrCreateCloudMemoryFolder(
        diarySpaceId,
        name,
      );
      if (!result.ok) {
        return { ok: false, code: result.code, message: result.message };
      }
      const cloudFolder: MemoryFolder = {
        id: result.data.id,
        name: result.data.name,
        description: result.data.description ?? undefined,
        createdAt: result.data.created_at,
        updatedAt: result.data.updated_at,
      };
      await fetchSnapshot();
      return { ok: true, data: cloudFolder, source: "cloud" };
    },
    [cloudActive, diarySpaceId, fetchSnapshot],
  );

  const value = useMemo<DiaryDataValue>(
    () => ({
      records,
      planned,
      album,
      folders,
      hydrated,
      loading,
      source,
      cloudActive,
      signedIn,
      diarySpaceId,
      error,
      refresh: fetchSnapshot,
      saveDailyRecord,
      updateDailyRecord,
      deleteDailyRecord,
      saveAlbumPhoto,
      updateAlbumPhoto,
      deleteAlbumPhoto,
      addPlannedChapter,
      removePlannedChapter,
      createMemoryFolder: createMemoryFolderFn,
      updateMemoryFolder: updateMemoryFolderFn,
      deleteMemoryFolder: deleteMemoryFolderFn,
      getOrCreateMemoryFolderByName: getOrCreateMemoryFolderByNameFn,
    }),
    [
      records,
      planned,
      album,
      folders,
      hydrated,
      loading,
      source,
      cloudActive,
      signedIn,
      diarySpaceId,
      error,
      fetchSnapshot,
      saveDailyRecord,
      updateDailyRecord,
      deleteDailyRecord,
      saveAlbumPhoto,
      updateAlbumPhoto,
      deleteAlbumPhoto,
      addPlannedChapter,
      removePlannedChapter,
      createMemoryFolderFn,
      updateMemoryFolderFn,
      deleteMemoryFolderFn,
      getOrCreateMemoryFolderByNameFn,
    ],
  );

  return (
    <DiaryDataContext.Provider value={value}>
      {children}
    </DiaryDataContext.Provider>
  );
}

export function useDiaryData(): DiaryDataValue {
  const ctx = useContext(DiaryDataContext);
  if (ctx) return ctx;
  return makeFallbackValue();
}

function makeFallbackValue(): DiaryDataValue {
  const local = readLocalSnapshot();
  const noopWrite = async <T,>(value: T): Promise<WriteResult<T>> => ({
    ok: true,
    data: value,
    source: "local",
  });
  return {
    ...local,
    hydrated: false,
    loading: false,
    source: "local",
    cloudActive: false,
    signedIn: false,
    diarySpaceId: null,
    error: null,
    refresh: async () => {},
    saveDailyRecord: async (payload) => {
      try {
        const saved = localSaveDaily(payload);
        return { ok: true, data: saved, source: "local" };
      } catch (e) {
        return {
          ok: false,
          code: "LOCAL_FAILED",
          message: e instanceof Error ? e.message : "保存到本地时出了点小状况。",
        };
      }
    },
    updateDailyRecord: async (date, patch) => {
      localUpdateDaily(date, patch);
      return noopWrite(undefined);
    },
    deleteDailyRecord: async (date) => {
      localDeleteDaily(date);
      return noopWrite(undefined);
    },
    saveAlbumPhoto: async (payload) =>
      noopWrite(localSaveAlbum(payload)),
    updateAlbumPhoto: async (id, patch) => {
      localUpdateAlbum(id, patch);
      return noopWrite(undefined);
    },
    deleteAlbumPhoto: async (id) => {
      localDeleteAlbum(id);
      return noopWrite(undefined);
    },
    addPlannedChapter: async (id) => {
      localAddPlanned(id);
      return noopWrite(undefined);
    },
    removePlannedChapter: async (id) => {
      localRemovePlanned(id);
      return noopWrite(undefined);
    },
    createMemoryFolder: async (name, description) =>
      noopWrite(localCreateFolder({ name, description })),
    updateMemoryFolder: async (id, patch) => {
      try {
        localUpdateFolder(id, patch);
        return noopWrite(undefined);
      } catch (e) {
        return {
          ok: false,
          code: "LOCAL_FAILED",
          message: e instanceof Error ? e.message : "更新文件夹时出错了。",
        };
      }
    },
    deleteMemoryFolder: async (id) =>
      noopWrite(localDeleteFolder(id)),
    getOrCreateMemoryFolderByName: async (name) =>
      noopWrite(localGetOrCreateFolder(name)),
  };
}
