import type { OtRule } from './types';

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function startEndToHours(start: string, end: string, breakMinutes: number): number {
  let startMin = parseTimeToMinutes(start);
  let endMin = parseTimeToMinutes(end);
  if (endMin <= startMin) endMin += 24 * 60;
  return Math.max(0, round2((endMin - startMin - breakMinutes) / 60));
}

export function applyDailyOtRule(
  totalHours: number,
  otRule: OtRule,
): { stHours: number; otHours: number } {
  const threshold = otRule === 'daily_10' ? 10 : 8;
  if (otRule === 'weekly_40') {
    return { stHours: round2(totalHours), otHours: 0 };
  }
  return {
    stHours: round2(Math.min(totalHours, threshold)),
    otHours: round2(Math.max(0, totalHours - threshold)),
  };
}

export function splitHoursByAllocation(
  stHours: number,
  otHours: number,
  percents: number[],
): { stHours: number; otHours: number }[] {
  const sum = percents.reduce((a, b) => a + b, 0) || 1;
  return percents.map((p) => ({
    stHours: round2(stHours * (p / sum)),
    otHours: round2(otHours * (p / sum)),
  }));
}

/** Re-apply weekly OT after daily splits are computed. */
export function applyWeeklyOt<T extends { contractorId: string; workDate: string; stHours: number; otHours: number }>(
  entries: T[],
  contractorId: string,
): T[] {
  const mine = entries
    .filter((e) => e.contractorId === contractorId)
    .sort((a, b) => a.workDate.localeCompare(b.workDate));

  const weekTotal = mine.reduce((s, e) => s + e.stHours + e.otHours, 0);
  const weeklyOt = Math.max(0, weekTotal - 40);
  if (weeklyOt === 0) return entries;

  let remainingOt = weeklyOt;
  const updated = new Map(mine.map((e) => [`${e.workDate}`, { ...e }]));

  for (let i = mine.length - 1; i >= 0 && remainingOt > 0; i--) {
    const key = mine[i].workDate;
    const row = updated.get(key)!;
    const movable = Math.min(row.stHours, remainingOt);
    row.stHours = round2(row.stHours - movable);
    row.otHours = round2(row.otHours + movable);
    remainingOt = round2(remainingOt - movable);
    updated.set(key, row);
  }

  return entries.map((e) => {
    if (e.contractorId !== contractorId) return e;
    return updated.get(e.workDate) ?? e;
  });
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** "07:00" -> "7:00a", "15:30" -> "3:30p" */
export function fmtTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'p' : 'a';
  const hr12 = h % 12 === 0 ? 12 : h % 12;
  return `${hr12}:${String(m).padStart(2, '0')}${period}`;
}

/**
 * Forgiving free-text time parser. Accepts:
 *   "7" "07" -> 07:00, "730" "7:30" -> 07:30, "1530" "15:30" -> 15:30,
 *   "7:30a" "730am" -> 07:30, "3p" "3pm" -> 15:00, "12a" -> 00:00, "12p" -> 12:00
 * Returns "HH:MM" or null if it can't make sense of the input.
 */
export function parseTimeInput(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (!s) return null;

  let period: 'a' | 'p' | null = null;
  if (/(a|am)$/.test(s)) period = 'a';
  else if (/(p|pm)$/.test(s)) period = 'p';

  const digits = s.replace(/[^0-9:]/g, '');
  let h: number;
  let m = 0;

  if (digits.includes(':')) {
    const [hp, mp] = digits.split(':');
    h = Number(hp);
    m = Number(mp || '0');
  } else if (digits.length <= 2) {
    h = Number(digits);
  } else if (digits.length === 3) {
    h = Number(digits.slice(0, 1));
    m = Number(digits.slice(1));
  } else {
    h = Number(digits.slice(0, 2));
    m = Number(digits.slice(2, 4));
  }

  if (Number.isNaN(h) || Number.isNaN(m)) return null;

  if (period === 'p' && h < 12) h += 12;
  if (period === 'a' && h === 12) h = 0;

  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Parse a free-text hours value like "8" "8.5" "8h" -> number or null. */
export function parseHoursInput(raw: string): number | null {
  if (raw == null) return null;
  const n = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
  if (Number.isNaN(n)) return null;
  return round2(Math.max(0, n));
}

export function formatWeekLabel(start: string, end: string): string {
  const s = new Date(`${start}T12:00:00`);
  const e = new Date(`${end}T12:00:00`);
  return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}
