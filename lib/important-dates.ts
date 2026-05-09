// Editable important relationship dates.
//
// Stored locally for now. The shape mirrors what we'd later persist into
// Supabase `app_settings` / a dedicated table — see PHASE 9F+ for cloud-first
// migration. Until then localStorage is the only writer/reader.
//
// Brand-card-stable IDs
// ---------------------
// The three core dates use stable IDs (`seed-met`, `seed-together`,
// `seed-engaged`) so that BrandSummaryCard can look them up regardless of how
// the user reorders, renames, or deletes them. Custom user-added dates use
// generated UUIDs and never collide with the seed IDs.

export const SEED_MET_ID = "seed-met";
export const SEED_TOGETHER_ID = "seed-together";
export const SEED_ENGAGED_ID = "seed-engaged";

export type ImportantDate = {
  id: string;
  label: string;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export const IMPORTANT_DATES_STORAGE_KEY = "yuyang_important_dates_v1";
export const IMPORTANT_DATES_EVENT = "yuyang-important-dates-changed";

const SEED_DATES: ImportantDate[] = [
  {
    id: SEED_MET_ID,
    label: "相识日",
    date: "2022-09-10",
    createdAt: "2022-09-10T00:00:00.000Z",
    updatedAt: "2022-09-10T00:00:00.000Z",
  },
  {
    id: SEED_TOGETHER_ID,
    label: "在一起日",
    date: "2023-03-19",
    createdAt: "2023-03-19T00:00:00.000Z",
    updatedAt: "2023-03-19T00:00:00.000Z",
  },
  {
    id: SEED_ENGAGED_ID,
    label: "订婚日",
    date: "2024-05-15",
    createdAt: "2024-05-15T00:00:00.000Z",
    updatedAt: "2024-05-15T00:00:00.000Z",
  },
];

export function getSeedImportantDates(): ImportantDate[] {
  return SEED_DATES.map((d) => ({ ...d }));
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isValidDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isImportantDate(value: unknown): value is ImportantDate {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.label === "string" &&
    isValidDate(v.date) &&
    typeof v.createdAt === "string" &&
    typeof v.updatedAt === "string" &&
    (v.note === undefined || typeof v.note === "string")
  );
}

function read(): ImportantDate[] {
  if (!isBrowser()) return getSeedImportantDates();
  try {
    const raw = window.localStorage.getItem(IMPORTANT_DATES_STORAGE_KEY);
    if (!raw) return getSeedImportantDates();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return getSeedImportantDates();
    const valid = parsed.filter(isImportantDate);
    if (valid.length === 0) return getSeedImportantDates();
    return valid;
  } catch {
    return getSeedImportantDates();
  }
}

function write(dates: ImportantDate[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      IMPORTANT_DATES_STORAGE_KEY,
      JSON.stringify(dates),
    );
    window.dispatchEvent(new Event(IMPORTANT_DATES_EVENT));
  } catch {
    /* quota / privacy mode — ignore */
  }
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

function sortByDateAsc(dates: ImportantDate[]): ImportantDate[] {
  return [...dates].sort((a, b) => a.date.localeCompare(b.date));
}

export function getImportantDates(): ImportantDate[] {
  return sortByDateAsc(read());
}

/** Lookup a single seeded core date, falling back to its original seed value. */
export function getCoreImportantDate(
  id: typeof SEED_MET_ID | typeof SEED_TOGETHER_ID | typeof SEED_ENGAGED_ID,
): ImportantDate {
  const all = read();
  const found = all.find((d) => d.id === id);
  if (found) return found;
  const seed = SEED_DATES.find((d) => d.id === id);
  return seed ? { ...seed } : SEED_DATES[0];
}

export function addImportantDate(input: {
  label: string;
  date: string;
  note?: string;
}): ImportantDate {
  const trimmedLabel = input.label.trim();
  if (!trimmedLabel) {
    throw new Error("名称不能为空。");
  }
  if (!isValidDate(input.date)) {
    throw new Error("日期格式应为 YYYY-MM-DD。");
  }
  const note = input.note?.trim();
  const created: ImportantDate = {
    id: newId(),
    label: trimmedLabel,
    date: input.date,
    note: note ? note : undefined,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const next = [...read(), created];
  write(next);
  return created;
}

export function updateImportantDate(
  id: string,
  patch: { label?: string; date?: string; note?: string },
): ImportantDate | null {
  const all = read();
  const idx = all.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  const existing = all[idx];
  const nextLabel =
    patch.label !== undefined ? patch.label.trim() : existing.label;
  if (!nextLabel) {
    throw new Error("名称不能为空。");
  }
  const nextDate = patch.date !== undefined ? patch.date : existing.date;
  if (!isValidDate(nextDate)) {
    throw new Error("日期格式应为 YYYY-MM-DD。");
  }
  const nextNoteRaw = patch.note !== undefined ? patch.note : existing.note;
  const nextNote =
    typeof nextNoteRaw === "string" ? nextNoteRaw.trim() : undefined;
  const updated: ImportantDate = {
    ...existing,
    label: nextLabel,
    date: nextDate,
    note: nextNote && nextNote.length > 0 ? nextNote : undefined,
    updatedAt: nowIso(),
  };
  const copy = [...all];
  copy[idx] = updated;
  write(copy);
  return updated;
}

export function deleteImportantDate(id: string): boolean {
  const all = read();
  const next = all.filter((d) => d.id !== id);
  if (next.length === all.length) return false;
  write(next);
  return true;
}
