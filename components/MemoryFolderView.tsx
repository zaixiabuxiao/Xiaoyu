"use client";

import { useMemo, useState } from "react";
import type { AlbumPhoto, DailyRecord } from "@/lib/local-records";
import { formatDateForDisplay } from "@/lib/date-utils";
import { useDiaryData } from "@/lib/use-diary-data";
import { DEFAULT_FOLDER_NAME } from "@/lib/memory-folders";
import DiaryCard from "./DiaryCard";
import DiaryButton from "./DiaryButton";
import PixelButton from "./PixelButton";
import RecordChapterDialog from "./RecordChapterDialog";
import AlbumUploadForm, { type AlbumUploadPayload } from "./AlbumUploadForm";
import AlbumPhotoEditForm, {
  type AlbumPhotoEditPayload,
} from "./AlbumPhotoEditForm";
import { PixelPin } from "./PixelIcons";

type FolderItemSource = "daily" | "album";

type FolderItem = {
  source: FolderItemSource;
  id: string;
  photo?: string;
  sortDate: string; // ISO-ish for sort (YYYY-MM-DD or ISO timestamp)
  displayDate?: string;
  title?: string;
  note?: string;
  location?: string;
  // Only meaningful for album items — present when the underlying AlbumPhoto
  // exists locally and we know we can edit it.
  albumPhoto?: AlbumPhoto;
};

type FolderBucket = {
  key: string;
  name: string;
  isDefault: boolean;
  items: FolderItem[];
  latestDate?: string;
  latestThumbnail?: string;
};

function resolveFolderName(
  photo: AlbumPhoto,
  folderNameById: Map<string, string>,
): string {
  if (photo.folderId) {
    const found = folderNameById.get(photo.folderId);
    if (found) return found;
  }
  if (photo.folderName) return photo.folderName;
  if (photo.location && photo.location.trim().length > 0) {
    return photo.location.trim();
  }
  return DEFAULT_FOLDER_NAME;
}

function dailyFolderName(record: DailyRecord): string {
  if (record.location && record.location.trim().length > 0) {
    return record.location.trim();
  }
  return DEFAULT_FOLDER_NAME;
}

function bucketize(
  records: DailyRecord[],
  album: AlbumPhoto[],
  knownFolderNames: string[],
  folderNameById: Map<string, string>,
): FolderBucket[] {
  const buckets = new Map<string, FolderBucket>();

  function ensure(name: string): FolderBucket {
    const key = name;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        key,
        name,
        isDefault: name === DEFAULT_FOLDER_NAME,
        items: [],
      };
      buckets.set(key, bucket);
    }
    return bucket;
  }

  for (const name of knownFolderNames) {
    ensure(name);
  }

  for (const record of records) {
    if (record.photos.length === 0) continue;
    const name = dailyFolderName(record);
    const bucket = ensure(name);
    bucket.items.push({
      source: "daily",
      id: `daily-${record.date}`,
      photo: record.photos[0],
      sortDate: record.date,
      displayDate: formatDateForDisplay(record.date),
      title: record.title,
      note: record.note,
      location: record.location,
    });
  }

  for (const photo of album) {
    const name = resolveFolderName(photo, folderNameById);
    const bucket = ensure(name);
    bucket.items.push({
      source: "album",
      id: photo.id,
      photo: photo.photo,
      sortDate: photo.date ?? photo.createdAt.slice(0, 10),
      displayDate: photo.date ? formatDateForDisplay(photo.date) : undefined,
      note: photo.note,
      location: photo.location,
      albumPhoto: photo,
    });
  }

  for (const bucket of buckets.values()) {
    bucket.items.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
    if (bucket.items.length > 0) {
      bucket.latestDate = bucket.items[0].sortDate;
      bucket.latestThumbnail = bucket.items[0].photo;
    }
  }

  // Empty default folder is still useful as the "drop zone" placeholder.
  // Other empty folders we hide unless they are user-persisted.
  const all = Array.from(buckets.values()).filter(
    (b) => b.items.length > 0 || b.isDefault || knownFolderNames.includes(b.name),
  );

  // Sort: default folder last; then by latest date desc; then by name asc.
  all.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return 1;
    if (!a.isDefault && b.isDefault) return -1;
    const al = a.latestDate ?? "0000-00-00";
    const bl = b.latestDate ?? "0000-00-00";
    if (al !== bl) return bl.localeCompare(al);
    return a.name.localeCompare(b.name);
  });

  return all;
}

export default function MemoryFolderView() {
  const data = useDiaryData();
  const { records, album, folders, hydrated } = data;
  const [activeFolderKey, setActiveFolderKey] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);

  const folderNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of folders) map.set(f.id, f.name);
    return map;
  }, [folders]);

  const buckets = useMemo(
    () =>
      bucketize(
        records,
        album,
        folders.map((f) => f.name),
        folderNameById,
      ),
    [records, album, folders, folderNameById],
  );

  const activeBucket = activeFolderKey
    ? buckets.find((b) => b.key === activeFolderKey) ?? null
    : null;

  const editingPhoto = editingPhotoId
    ? album.find((p) => p.id === editingPhotoId)
    : undefined;

  async function handleUpload(payload: AlbumUploadPayload) {
    await data.saveAlbumPhoto(payload);
    setUploadOpen(false);
  }

  async function handleEditSave(payload: AlbumPhotoEditPayload) {
    if (!editingPhotoId) return;
    await data.updateAlbumPhoto(editingPhotoId, payload);
    setEditingPhotoId(null);
  }

  async function handleDelete(id: string) {
    if (typeof window === "undefined") return;
    if (window.confirm("把这张照片从地图相册里取出来吗？")) {
      await data.deleteAlbumPhoto(id);
    }
  }

  if (!hydrated) {
    return (
      <DiaryCard variant="soft">
        <p className="font-pixel text-[10px] text-navy/50">…</p>
      </DiaryCard>
    );
  }

  const debugStats = computeDebugStats(buckets, data);

  if (activeBucket) {
    return (
      <>
        <FolderDetail
          bucket={activeBucket}
          onBack={() => setActiveFolderKey(null)}
          onEditAlbumPhoto={(id) => setEditingPhotoId(id)}
          onDeleteAlbumPhoto={handleDelete}
          onUpload={() => setUploadOpen(true)}
        />
        <UploadDialog
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onSave={handleUpload}
        />
        <EditDialog
          open={Boolean(editingPhoto)}
          photo={editingPhoto}
          onClose={() => setEditingPhotoId(null)}
          onSave={handleEditSave}
        />
        <FolderDebugBlock stats={debugStats} />
      </>
    );
  }

  if (buckets.length === 0 || buckets.every((b) => b.items.length === 0)) {
    return (
      <>
        <DiaryCard variant="soft">
          <p className="font-display text-[16px] text-navy leading-snug">
            地图相册还空着。
          </p>
          <div className="dash-h my-3" />
          <p className="text-[13px] text-diary-ink-soft leading-relaxed">
            可以先放进一张以前的照片，或者等我们写下新的日记。
          </p>
          <div className="mt-3">
            <DiaryButton type="button" onClick={() => setUploadOpen(true)}>
              放进地图相册
            </DiaryButton>
          </div>
        </DiaryCard>
        <UploadDialog
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onSave={handleUpload}
        />
        <FolderDebugBlock stats={debugStats} />
      </>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <DiaryButton
          type="button"
          variant="small"
          onClick={() => setUploadOpen(true)}
        >
          放进地图相册
        </DiaryButton>
      </div>

      <ul className="grid grid-cols-2 gap-3">
        {buckets.map((bucket) => (
          <li key={bucket.key}>
            <FolderCard
              bucket={bucket}
              onOpen={() => setActiveFolderKey(bucket.key)}
            />
          </li>
        ))}
      </ul>

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSave={handleUpload}
      />
      <EditDialog
        open={Boolean(editingPhoto)}
        photo={editingPhoto}
        onClose={() => setEditingPhotoId(null)}
        onSave={handleEditSave}
      />
      <FolderDebugBlock stats={debugStats} />
    </>
  );
}

type FolderDebugStats = {
  source: string;
  signedIn: boolean;
  cloudActive: boolean;
  hasDiarySpaceId: boolean;
  recordsCount: number;
  albumCount: number;
  foldersCount: number;
  visibleBucketsCount: number;
  visiblePhotosCount: number;
  signedUrlSuccessCount: number;
  signedUrlEmptyCount: number;
  errorCopy: string | null;
};

function computeDebugStats(
  buckets: FolderBucket[],
  data: ReturnType<typeof useDiaryData>,
): FolderDebugStats {
  let visiblePhotos = 0;
  let signedOk = 0;
  let signedEmpty = 0;
  for (const b of buckets) {
    visiblePhotos += b.items.length;
  }
  for (const photo of data.album) {
    if (typeof photo.photo === "string" && photo.photo.length > 0) {
      signedOk++;
    } else {
      signedEmpty++;
    }
  }
  return {
    source: data.source,
    signedIn: data.signedIn,
    cloudActive: data.cloudActive,
    hasDiarySpaceId: data.diarySpaceId !== null,
    recordsCount: data.records.length,
    albumCount: data.album.length,
    foldersCount: data.folders.length,
    visibleBucketsCount: buckets.length,
    visiblePhotosCount: visiblePhotos,
    signedUrlSuccessCount: signedOk,
    signedUrlEmptyCount: signedEmpty,
    errorCopy: data.error,
  };
}

function FolderDebugBlock({ stats }: { stats: FolderDebugStats }) {
  return (
    <div className="mt-4 opacity-60">
      <div className="dash-h mb-2" />
      <p className="font-pixel text-[9px] tracking-widest text-navy/50 mb-1">
        DEBUG · 地图相册
      </p>
      <ul className="font-pixel text-[10px] text-navy/60 leading-relaxed space-y-0.5">
        <li>source: {stats.source}</li>
        <li>signedIn: {String(stats.signedIn)}</li>
        <li>cloudActive: {String(stats.cloudActive)}</li>
        <li>hasDiarySpaceId: {String(stats.hasDiarySpaceId)}</li>
        <li>records: {stats.recordsCount}</li>
        <li>album: {stats.albumCount}</li>
        <li>folders: {stats.foldersCount}</li>
        <li>visibleBuckets: {stats.visibleBucketsCount}</li>
        <li>visiblePhotos: {stats.visiblePhotosCount}</li>
        <li>signedUrlOk: {stats.signedUrlSuccessCount}</li>
        <li>signedUrlEmpty: {stats.signedUrlEmptyCount}</li>
        {stats.errorCopy ? (
          <li className="break-all">error: {stats.errorCopy}</li>
        ) : null}
      </ul>
    </div>
  );
}

function FolderCard({
  bucket,
  onOpen,
}: {
  bucket: FolderBucket;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="block text-left bg-white border-3 border-navy shadow-pixel-sm p-2 w-full"
    >
      <div className="aspect-square w-full border-2 border-navy bg-cream grid place-items-center overflow-hidden">
        {bucket.latestThumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bucket.latestThumbnail}
            alt={bucket.name}
            className="block w-full h-full object-cover"
            style={{ imageRendering: "auto" }}
          />
        ) : (
          <PixelPin size={20} />
        )}
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="inline-flex items-center gap-1 font-display text-[14px] leading-snug text-navy">
          <PixelPin size={10} /> {bucket.name}
        </p>
        <p className="font-pixel text-[10px] text-diary-ink-soft">
          {bucket.items.length} 张
          {bucket.latestDate ? (
            <span className="ml-1">
              · 最近 {formatDateForDisplay(bucket.latestDate)}
            </span>
          ) : null}
        </p>
        <p className="font-pixel text-[10px] text-warm-orange">打开</p>
      </div>
    </button>
  );
}

function FolderDetail({
  bucket,
  onBack,
  onEditAlbumPhoto,
  onDeleteAlbumPhoto,
  onUpload,
}: {
  bucket: FolderBucket;
  onBack: () => void;
  onEditAlbumPhoto: (id: string) => void;
  onDeleteAlbumPhoto: (id: string) => void;
  onUpload: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-3 gap-2">
        <PixelButton type="button" variant="ghost" onClick={onBack}>
          ← 返回地图相册
        </PixelButton>
        <DiaryButton type="button" variant="small" onClick={onUpload}>
          放进这里
        </DiaryButton>
      </div>

      <DiaryCard variant="soft" className="mb-3">
        <p className="inline-flex items-center gap-1 font-display text-[18px] text-navy leading-snug">
          <PixelPin size={12} /> {bucket.name}
        </p>
        <p className="font-pixel text-[10px] text-diary-ink-soft mt-1">
          {bucket.items.length} 张
        </p>
      </DiaryCard>

      {bucket.items.length === 0 ? (
        <DiaryCard variant="soft">
          <p className="text-[13px] text-diary-ink-soft leading-relaxed">
            这个地图文件夹还没有照片。
          </p>
        </DiaryCard>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {bucket.items.map((item) => (
            <li key={`${item.source}-${item.id}`}>
              <PhotoCard
                item={item}
                onEdit={
                  item.source === "album"
                    ? () => onEditAlbumPhoto(item.id)
                    : undefined
                }
                onDelete={
                  item.source === "album"
                    ? () => onDeleteAlbumPhoto(item.id)
                    : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function PhotoCard({
  item,
  onEdit,
  onDelete,
}: {
  item: FolderItem;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const isAlbum = item.source === "album";
  return (
    <div className="relative bg-white border-3 border-navy shadow-pixel-sm p-2">
      {item.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.photo}
          alt={item.title ?? item.note ?? "回忆照片"}
          className="block w-full aspect-square object-cover border-2 border-navy bg-cream"
          style={{ imageRendering: "auto" }}
        />
      ) : (
        <div className="block w-full aspect-square border-2 border-navy bg-cream grid place-items-center">
          <PixelPin size={16} />
        </div>
      )}

      <span
        className={`absolute top-3 left-3 font-pixel text-[8px] tracking-widest px-1.5 py-0.5 border-2 ${
          isAlbum
            ? "bg-cream text-navy border-navy"
            : "bg-warm-orange text-cream border-navy"
        }`}
      >
        {isAlbum ? "相册照片" : "日记照片"}
      </span>

      <div className="mt-2 space-y-0.5">
        {item.displayDate ? (
          <p className="font-pixel text-[10px] text-diary-orange-d">
            {item.displayDate}
          </p>
        ) : (
          <p className="font-pixel text-[10px] text-diary-ink-soft">
            未注明日期
          </p>
        )}
        {item.title ? (
          <h3 className="font-display text-[14px] leading-snug text-navy line-clamp-2 break-words">
            {item.title}
          </h3>
        ) : null}
        {item.note && !item.title ? (
          <p className="text-[12px] text-navy line-clamp-2 leading-snug">
            {item.note}
          </p>
        ) : null}
        {item.location ? (
          <p className="inline-flex items-center gap-1 font-display text-[12px] text-diary-ink-soft">
            <PixelPin size={10} /> {item.location}
          </p>
        ) : null}
        {isAlbum && (onEdit || onDelete) ? (
          <div className="pt-1 flex flex-wrap gap-1">
            {onEdit ? (
              <PixelButton type="button" variant="ghost" onClick={onEdit}>
                编辑
              </PixelButton>
            ) : null}
            {onDelete ? (
              <PixelButton type="button" variant="ghost" onClick={onDelete}>
                移除
              </PixelButton>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function UploadDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (payload: AlbumUploadPayload) => void;
}) {
  return (
    <RecordChapterDialog open={open} onClose={onClose}>
      <AlbumUploadForm onSave={onSave} onCancel={onClose} />
    </RecordChapterDialog>
  );
}

function EditDialog({
  open,
  photo,
  onClose,
  onSave,
}: {
  open: boolean;
  photo?: AlbumPhoto;
  onClose: () => void;
  onSave: (payload: AlbumPhotoEditPayload) => void;
}) {
  return (
    <RecordChapterDialog open={open} onClose={onClose}>
      {photo ? (
        <AlbumPhotoEditForm
          photo={photo}
          onSave={onSave}
          onCancel={onClose}
        />
      ) : null}
    </RecordChapterDialog>
  );
}
