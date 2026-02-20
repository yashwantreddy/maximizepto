import type { BreakWindow } from '../types';

export function parseISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function shortenDate(isoDate: string): string {
  const date = parseISODate(isoDate);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function addDaysToISODate(isoDate: string, delta: number): string {
  const date = parseISODate(isoDate);
  date.setDate(date.getDate() + delta);
  return formatISODate(date);
}

export function enumerateISODateRange(startIso: string, endIso: string): string[] {
  const dates: string[] = [];
  const cursor = parseISODate(startIso);
  const end = parseISODate(endIso);

  while (cursor <= end) {
    dates.push(formatISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function getBreakWindows(year: number, offSet: Set<string>): BreakWindow[] {
  const windows: BreakWindow[] = [];
  const cursor = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  while (cursor <= end) {
    const iso = formatISODate(cursor);
    if (!offSet.has(iso)) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }

    const start = iso;
    let length = 0;

    while (cursor <= end && offSet.has(formatISODate(cursor))) {
      length += 1;
      cursor.setDate(cursor.getDate() + 1);
    }

    const endDate = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
    windows.push({
      start,
      end: formatISODate(endDate),
      length
    });
  }

  return windows;
}

export function buildOffdaySet(year: number, holidayDates: string[], ptoDates: string[]): Set<string> {
  const offSet = new Set<string>();

  for (let month = 0; month < 12; month += 1) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      if (date.getDay() === 0 || date.getDay() === 6) {
        offSet.add(formatISODate(date));
      }
    }
  }

  holidayDates.forEach((date) => offSet.add(date));
  ptoDates.forEach((date) => offSet.add(date));

  return offSet;
}
