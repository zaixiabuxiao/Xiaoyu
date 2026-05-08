import {
  getLosAngelesNowLabel,
  getLosAngelesToday,
  LA_TIMEZONE,
  type LosAngelesTimezone,
} from "./date-utils";

export type DailyRecord = {
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
  photos: string[];
  photoRequired: true;
  timezone: LosAngelesTimezone;
  timeLabel?: string;
  createdAt: string;
};

const RECORDS_KEY = "life_daily_records_v1";
const PLANNED_KEY = "life_planned_chapters_v1";

const RECORDS_EVENT = "life-records-changed";
const PLANNED_EVENT = "life-planned-changed";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or privacy mode — ignore */
  }
}

function notify(eventName: string): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(eventName));
}

function normalizeRecord(raw: Partial<DailyRecord> & { date: string }): DailyRecord {
  return {
    date: raw.date,
    chapterId: raw.chapterId ?? `freeform_${raw.date}`,
    volumeId: raw.volumeId ?? "v1",
    title: raw.title ?? "",
    note: raw.note ?? "",
    memory: raw.memory,
    husbandReflection: raw.husbandReflection,
    wifeReflection: raw.wifeReflection,
    location: raw.location,
    wantsToRepeat: raw.wantsToRepeat,
    photos: Array.isArray(raw.photos) ? raw.photos : [],
    photoRequired: true,
    timezone: LA_TIMEZONE,
    timeLabel: raw.timeLabel,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

export { getLosAngelesToday, getLosAngelesNowLabel };

/**
 * Returns the official "today" string anchored to America/Los_Angeles.
 * One-record-per-day is enforced on this LA date, not the browser's local date.
 */
export function getTodayString(): string {
  return getLosAngelesToday();
}

export class DailyRecordExistsError extends Error {
  constructor(public readonly date: string) {
    super(`A record already exists for ${date}.`);
    this.name = "DailyRecordExistsError";
  }
}

export function getDailyRecords(): DailyRecord[] {
  const raw = read<Array<Partial<DailyRecord> & { date: string }>>(
    RECORDS_KEY,
    [],
  );
  return raw.map(normalizeRecord);
}

export function getTodayRecord(): DailyRecord | undefined {
  const today = getTodayString();
  return getDailyRecords().find((r) => r.date === today);
}

export function saveDailyRecord(
  record: Omit<DailyRecord, "createdAt" | "photoRequired" | "timezone"> & {
    createdAt?: string;
    timeLabel?: string;
  },
): DailyRecord {
  const records = getDailyRecords();
  if (records.some((r) => r.date === record.date)) {
    throw new DailyRecordExistsError(record.date);
  }
  const full: DailyRecord = {
    ...record,
    photos: record.photos ?? [],
    photoRequired: true,
    timezone: LA_TIMEZONE,
    timeLabel: record.timeLabel ?? getLosAngelesNowLabel(),
    createdAt: record.createdAt ?? new Date().toISOString(),
  };
  records.push(full);
  write(RECORDS_KEY, records);
  notify(RECORDS_EVENT);
  return full;
}

export function updateDailyRecord(
  date: string,
  partial: Partial<DailyRecord>,
): DailyRecord | undefined {
  const records = getDailyRecords();
  const idx = records.findIndex((r) => r.date === date);
  if (idx === -1) return undefined;
  const updated: DailyRecord = {
    ...records[idx],
    ...partial,
    date,
    photoRequired: true,
    timezone: LA_TIMEZONE,
  };
  records[idx] = updated;
  write(RECORDS_KEY, records);
  notify(RECORDS_EVENT);
  return updated;
}

export function deleteDailyRecord(date: string): void {
  const next = getDailyRecords().filter((r) => r.date !== date);
  write(RECORDS_KEY, next);
  notify(RECORDS_EVENT);
}

export function clearDailyRecords(): void {
  write(RECORDS_KEY, []);
  notify(RECORDS_EVENT);
}

export function getPlannedChapters(): string[] {
  return read<string[]>(PLANNED_KEY, []);
}

export function addPlannedChapter(chapterId: string): void {
  const planned = getPlannedChapters();
  if (planned.includes(chapterId)) return;
  planned.push(chapterId);
  write(PLANNED_KEY, planned);
  notify(PLANNED_EVENT);
}

export function removePlannedChapter(chapterId: string): void {
  const next = getPlannedChapters().filter((id) => id !== chapterId);
  write(PLANNED_KEY, next);
  notify(PLANNED_EVENT);
}

export function clearPlannedChapters(): void {
  write(PLANNED_KEY, []);
  notify(PLANNED_EVENT);
}

export function exportDailyRecordsAsText(): string {
  const records = [...getDailyRecords()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  if (records.length === 0) {
    return "羽扬日记 · 本地回忆\n（暂时还没有记录）\n";
  }
  const lines: string[] = ["羽扬日记 · 本地回忆", ""];
  for (const r of records) {
    const stamp = r.timeLabel ? ` · ${r.timeLabel}` : "";
    lines.push(`【${r.date}${stamp}】${r.title}`);
    if (r.note) lines.push(`今天发生了什么：${r.note}`);
    if (r.memory) lines.push(`我想记住的是：${r.memory}`);
    if (r.husbandReflection) lines.push(`我的感受：${r.husbandReflection}`);
    if (r.wifeReflection) lines.push(`她的感受：${r.wifeReflection}`);
    if (r.location) lines.push(`地点：${r.location}`);
    if (r.wantsToRepeat) lines.push("✦ 想再来一次");
    if (r.photos.length > 0) lines.push(`今日照片：${r.photos.length} 张`);
    lines.push("");
  }
  return lines.join("\n");
}

export const STORAGE_EVENTS = {
  records: RECORDS_EVENT,
  planned: PLANNED_EVENT,
} as const;
