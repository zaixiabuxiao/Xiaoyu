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

export function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export class DailyRecordExistsError extends Error {
  constructor(public readonly date: string) {
    super(`A record already exists for ${date}.`);
    this.name = "DailyRecordExistsError";
  }
}

export function getDailyRecords(): DailyRecord[] {
  return read<DailyRecord[]>(RECORDS_KEY, []);
}

export function getTodayRecord(): DailyRecord | undefined {
  const today = getTodayString();
  return getDailyRecords().find((r) => r.date === today);
}

export function saveDailyRecord(
  record: Omit<DailyRecord, "createdAt"> & { createdAt?: string },
): DailyRecord {
  const records = getDailyRecords();
  if (records.some((r) => r.date === record.date)) {
    throw new DailyRecordExistsError(record.date);
  }
  const full: DailyRecord = {
    ...record,
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
  const updated: DailyRecord = { ...records[idx], ...partial, date };
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
    lines.push(`【${r.date}】${r.title}`);
    if (r.note) lines.push(`今天发生了什么：${r.note}`);
    if (r.memory) lines.push(`我想记住的是：${r.memory}`);
    if (r.husbandReflection) lines.push(`我的感受：${r.husbandReflection}`);
    if (r.wifeReflection) lines.push(`她的感受：${r.wifeReflection}`);
    if (r.location) lines.push(`地点：${r.location}`);
    if (r.wantsToRepeat) lines.push("✦ 想再来一次");
    lines.push("");
  }
  return lines.join("\n");
}

export const STORAGE_EVENTS = {
  records: RECORDS_EVENT,
  planned: PLANNED_EVENT,
} as const;
