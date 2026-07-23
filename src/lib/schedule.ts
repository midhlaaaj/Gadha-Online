// Shared time/day helpers for mentor schedule-conflict detection.
// Time strings are always "H:MM AM/PM" (matching TIME_OPTIONS on
// mentor/availability and courses/sessions' class_time/session_time
// columns) so this is the single parser used everywhere that needs
// to compare two time-of-day values.

export function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/^(\d+):?(\d*)\s*(AM|PM)$/i);
  if (!match) return -1;
  let h = parseInt(match[1], 10);
  const m = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM" && h < 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

export function minutesToTimeString(totalMinutes: number): string {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  let hh = Math.floor(wrapped / 60);
  const mm = wrapped % 60;
  const meridiem = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 || 12;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${meridiem}`;
}

export function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  if (aStart === -1 || aEnd === -1 || bStart === -1 || bEnd === -1) return false;
  return aStart < bEnd && bStart < aEnd;
}

// Canonical weekday names, matching sessions.days / courses.class_days
// (e.g. "Monday, Wednesday, Friday").
export function parseDayList(days: string | null | undefined): string[] {
  if (!days) return [];
  return days
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

export function dayListsOverlap(a: string[], b: string[]): boolean {
  return a.some((day) => b.includes(day));
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function weekdayNameForDate(dateStr: string): string {
  const d = new Date(dateStr);
  return WEEKDAY_NAMES[d.getDay()];
}
