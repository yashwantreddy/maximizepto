import type { Holiday, OverviewMetrics, PlannerResult, Strategy } from '../types';
import { buildOffdaySet, formatISODate, getBreakWindows, parseISODate, shortenDate } from './dates';

interface PlannerInput {
  year: number;
  budget: number;
  aggressiveness: number;
  activeHolidays: Holiday[];
}

export function getActiveHolidays(
  defaultHolidays: Holiday[],
  observedHolidayIds: string[],
  customHolidays: Holiday[]
): Holiday[] {
  const standard = defaultHolidays.filter((holiday) => observedHolidayIds.includes(holiday.id));
  return [...standard, ...customHolidays];
}

export function calculateOptimalPTO({
  year,
  budget,
  aggressiveness,
  activeHolidays
}: PlannerInput): PlannerResult {
  const suggestedPTO: string[] = [];
  const strategyDatesByName = new Map<string, Set<string>>();
  const holidayDates = new Set(activeHolidays.map((holiday) => holiday.date));

  if (budget <= 0) {
    return { suggestedPTO, strategies: [] };
  }

  const appendToStrategy = (reason: string, dateIso: string): void => {
    const existing = strategyDatesByName.get(reason);
    if (existing) {
      existing.add(dateIso);
      return;
    }

    strategyDatesByName.set(reason, new Set([dateIso]));
  };

  const addPTOIfPossible = (date: Date, reason: string): void => {
    if (date.getFullYear() !== year) {
      return;
    }

    const iso = formatISODate(date);
    const day = date.getDay();

    if (day === 0 || day === 6) {
      return;
    }

    if (holidayDates.has(iso)) {
      return;
    }

    if (suggestedPTO.includes(iso)) {
      appendToStrategy(reason, iso);
      return;
    }

    if (suggestedPTO.length >= budget) {
      return;
    }

    suggestedPTO.push(iso);
    appendToStrategy(reason, iso);
  };

  activeHolidays.forEach((holiday) => {
    const date = parseISODate(holiday.date);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 2) {
      const bridgeDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
      addPTOIfPossible(bridgeDate, `Bridge ${holiday.name}`);
    }

    if (dayOfWeek === 4) {
      const bridgeDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      addPTOIfPossible(bridgeDate, `Bridge ${holiday.name}`);
    }
  });

  if (aggressiveness >= 2) {
    activeHolidays.forEach((holiday) => {
      const date = parseISODate(holiday.date);
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 1) {
        const beforeWeekend = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 3);
        addPTOIfPossible(beforeWeekend, `4-Day ${holiday.name}`);
      }

      if (dayOfWeek === 5) {
        const afterWeekend = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 3);
        addPTOIfPossible(afterWeekend, `4-Day ${holiday.name}`);
      }
    });

    const thanksgiving = activeHolidays.find((holiday) => holiday.name === 'Thanksgiving Day');
    if (thanksgiving) {
      const friday = parseISODate(thanksgiving.date);
      friday.setDate(friday.getDate() + 1);
      addPTOIfPossible(friday, 'Thanksgiving Escape');
    }
  }

  if (aggressiveness >= 3) {
    const hasChristmas = activeHolidays.some((holiday) => holiday.name === 'Christmas Day');
    if (hasChristmas) {
      ['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31'].forEach((dateString) => {
        addPTOIfPossible(parseISODate(dateString), 'Holiday Season Stretch');
      });
    }

    const hasIndependence = activeHolidays.some((holiday) => holiday.name.includes('Independence'));
    if (hasIndependence) {
      ['2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02'].forEach((dateString) => {
        addPTOIfPossible(parseISODate(dateString), 'Summer Expansion');
      });
    }
  }

  suggestedPTO.sort();

  const strategies: Strategy[] = Array.from(strategyDatesByName.entries())
    .map(([name, datesSet]) => {
      const dates = Array.from(datesSet).sort();
      const offSet = buildOffdaySet(
        year,
        activeHolidays.map((holiday) => holiday.date),
        dates
      );
      const windows = getBreakWindows(year, offSet);

      const vacationDays = windows
        .filter((window) => window.length >= 3)
        .reduce((total, window) => total + window.length, 0);
      const longest = windows.reduce((max, window) => Math.max(max, window.length), 0);
      const micro = windows.filter((window) => window.length >= 3 && window.length <= 4).length;
      const ptoDays = dates.length;
      const yieldScore = ptoDays ? Number((vacationDays / ptoDays).toFixed(1)) : 0;
      const rank = vacationDays * 2 + longest * 1.25 - ptoDays * 0.75;

      return {
        name,
        dates,
        ptoDays,
        vacationDays,
        longest,
        micro,
        yieldScore,
        rank
      };
    })
    .sort((a, b) => b.rank - a.rank || a.ptoDays - b.ptoDays);

  return {
    suggestedPTO,
    strategies
  };
}

export function calculateOverviewMetrics(
  year: number,
  annualTotal: number,
  activeHolidays: Holiday[],
  suggestedPTO: string[]
): OverviewMetrics {
  const offSet = buildOffdaySet(
    year,
    activeHolidays.map((holiday) => holiday.date),
    suggestedPTO
  );
  const windows = getBreakWindows(year, offSet);

  const vacationDays = windows
    .filter((window) => window.length >= 3)
    .reduce((total, window) => total + window.length, 0);
  const longestBreak = windows.reduce((max, window) => Math.max(max, window.length), 0);
  const microBreaks = windows.filter((window) => window.length >= 3 && window.length <= 4).length;

  const used = suggestedPTO.length;
  const yieldScore = used ? vacationDays / used : 0;
  const unused = Math.max(annualTotal - used, 0);
  const utilizationRate = annualTotal > 0 ? Math.min((used / annualTotal) * 100, 100) : 0;

  let unusedRisk: OverviewMetrics['unusedRisk'] = 'Low';
  if (unused > 6) {
    unusedRisk = 'High';
  } else if (unused > 3) {
    unusedRisk = 'Medium';
  }

  return {
    yieldScore,
    longestBreak,
    microBreaks,
    unusedRisk,
    vacationDays,
    utilizationRate
  };
}

export function formatDateRange(dateList: string[]): string {
  if (!dateList.length) {
    return '-';
  }

  if (dateList.length === 1) {
    return shortenDate(dateList[0]);
  }

  const first = dateList[0];
  const last = dateList[dateList.length - 1];
  return `${shortenDate(first)}-${shortenDate(last)}`;
}
