export const LA_TIMEZONE = "America/Los_Angeles" as const;

export type LosAngelesTimezone = typeof LA_TIMEZONE;

function partsInLA(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: LA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

export function getLosAngelesToday(now: Date = new Date()): string {
  const { year, month, day } = partsInLA(now);
  return `${year}-${month}-${day}`;
}

export function getLosAngelesNowLabel(now: Date = new Date()): string {
  const { year, month, day, hour, minute } = partsInLA(now);
  let h = hour === "24" ? "00" : hour;
  return `${year}.${month}.${day} ${h}:${minute}`;
}

function normalizeDateString(s: string): { y: number; m: number; d: number } {
  const norm = s.replace(/[./]/g, "-").trim();
  const [y, m, d] = norm.split("-").map((p) => Number.parseInt(p, 10));
  return { y, m, d };
}

function toCalendarUTC(s: string): number {
  const { y, m, d } = normalizeDateString(s);
  return Date.UTC(y, m - 1, d);
}

export function daysSinceInLosAngeles(
  dateString: string,
  now: Date = new Date(),
): number {
  const start = toCalendarUTC(dateString);
  const todayUTC = toCalendarUTC(getLosAngelesToday(now));
  return Math.floor((todayUTC - start) / 86_400_000);
}

export function formatDateForDisplay(dateString: string): string {
  const { y, m, d } = normalizeDateString(dateString);
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}.${mm}.${dd}`;
}
