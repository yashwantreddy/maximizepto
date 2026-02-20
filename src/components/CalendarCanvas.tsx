import { useMemo } from 'react';
import { MONTHS, WEEKDAYS } from '../data/holidays';
import {
  addDaysToISODate,
  buildOffdaySet,
  enumerateISODateRange,
  formatISODate,
  getBreakWindows
} from '../lib/dates';
import type { Holiday, Strategy } from '../types';

interface CalendarCanvasProps {
  year: number;
  activeHolidays: Holiday[];
  suggestedPTO: string[];
  selectedStrategyName: string;
  strategies: Strategy[];
}

export function CalendarCanvas({
  year,
  activeHolidays,
  suggestedPTO,
  selectedStrategyName,
  strategies
}: CalendarCanvasProps) {
  const holidayByDate = useMemo(
    () =>
      activeHolidays.reduce<Record<string, string>>((map, holiday) => {
        map[holiday.date] = holiday.name;
        return map;
      }, {}),
    [activeHolidays]
  );

  const ptoSet = useMemo(() => new Set(suggestedPTO), [suggestedPTO]);
  const selectedStrategy = useMemo(
    () => strategies.find((strategy) => strategy.name === selectedStrategyName),
    [strategies, selectedStrategyName]
  );
  const selectedSet = useMemo(() => new Set(selectedStrategy?.dates ?? []), [selectedStrategy]);
  const holidayDates = useMemo(() => activeHolidays.map((holiday) => holiday.date), [activeHolidays]);

  const selectedOffSet = useMemo(
    () =>
      selectedStrategy ? buildOffdaySet(year, holidayDates, selectedStrategy.dates) : new Set<string>(),
    [holidayDates, selectedStrategy, year]
  );

  const selectedWindows = useMemo(
    () =>
      selectedStrategy
        ? getBreakWindows(year, selectedOffSet).filter((window) => {
            if (window.length < 3) {
              return false;
            }

            return enumerateISODateRange(window.start, window.end).some((dateIso) =>
              selectedSet.has(dateIso)
            );
          })
        : [],
    [selectedOffSet, selectedSet, selectedStrategy, year]
  );

  const ribbonLengthByDate = useMemo(
    () =>
      selectedWindows.reduce<Map<string, number>>((map, window) => {
        enumerateISODateRange(window.start, window.end).forEach((dateIso) => {
          map.set(dateIso, window.length);
        });
        return map;
      }, new Map<string, number>()),
    [selectedWindows]
  );

  const opportunityByDate = useMemo(() => {
    const opportunityMap = new Map<string, string>();
    if (!selectedStrategy) {
      return opportunityMap;
    }

    const countAdjacentOffDays = (dateIso: string, delta: number): number => {
      let count = 0;
      let probe = addDaysToISODate(dateIso, delta);

      while (selectedOffSet.has(probe)) {
        count += 1;
        probe = addDaysToISODate(probe, delta);
      }

      return count;
    };

    for (let month = 0; month < 12; month += 1) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(year, month, day);
        const dateIso = formatISODate(date);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        if (isWeekend || selectedOffSet.has(dateIso)) {
          continue;
        }

        const left = countAdjacentOffDays(dateIso, -1);
        const right = countAdjacentOffDays(dateIso, 1);
        const total = left + 1 + right;

        if (total >= 4) {
          const prefix = left > 0 && right > 0 ? 'Bridge two breaks' : 'Extend a break';
          opportunityMap.set(dateIso, `${prefix}: take PTO to unlock ${total} days`);
        }
      }
    }

    return opportunityMap;
  }, [selectedOffSet, selectedStrategy, year]);

  return (
    <section className="panel calendar-panel" id="calendar-canvas">
      <div className="calendar-head">
        <div>
          <p className="eyebrow">Calendar Canvas</p>
          <h3>{year} Planner</h3>
        </div>
        <div className="legend">
          <span>
            <i className="dot holiday" />Holiday
          </span>
          <span>
            <i className="dot pto" />Suggested PTO
          </span>
          <span>
            <i className="dot ribbon" />Connected Break
          </span>
          <span>
            <i className="dot focus" />Selected Strategy
          </span>
          <span>
            <i className="dot opportunity" />What-if Opportunity
          </span>
          <span>
            <i className="dot weekend" />Weekend
          </span>
        </div>
      </div>

      <div className="calendar-grid">
        {MONTHS.map((monthName, monthIndex) => {
          const firstDay = new Date(year, monthIndex, 1).getDay();
          const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

          return (
            <article className="month-card" key={monthName}>
              <h4>{monthName}</h4>

              <div className="weekday-row">
                {WEEKDAYS.map((weekday) => (
                  <div className="weekday" key={weekday}>
                    {weekday}
                  </div>
                ))}
              </div>

              <div className="days-grid">
                {Array.from({ length: firstDay }, (_, index) => (
                  <div className="day empty" key={`empty-${monthName}-${index}`} />
                ))}

                {Array.from({ length: daysInMonth }, (_, dayIndex) => {
                  const day = dayIndex + 1;
                  const date = new Date(year, monthIndex, day);
                  const iso = formatISODate(date);

                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const holidayName = holidayByDate[iso];
                  const isPTO = ptoSet.has(iso);
                  const isFocus = selectedSet.has(iso);
                  const isRibbon = ribbonLengthByDate.has(iso);
                  const ribbonLength = ribbonLengthByDate.get(iso);
                  const hasOpportunity = opportunityByDate.has(iso);

                  const classes = ['day'];
                  if (isWeekend) {
                    classes.push('weekend');
                  }
                  if (holidayName) {
                    classes.push('holiday');
                  }
                  if (isPTO) {
                    classes.push('pto-suggested');
                  }
                  if (isRibbon) {
                    classes.push('ribbon');
                    const prevInRibbon = ribbonLengthByDate.has(addDaysToISODate(iso, -1));
                    const nextInRibbon = ribbonLengthByDate.has(addDaysToISODate(iso, 1));

                    if (prevInRibbon) {
                      classes.push('link-left');
                    }
                    if (nextInRibbon) {
                      classes.push('link-right');
                    }
                    if (!prevInRibbon) {
                      classes.push('ribbon-start');
                    }
                    if (!nextInRibbon) {
                      classes.push('ribbon-end');
                    }
                  }
                  if (isFocus) {
                    classes.push('focus');
                  }
                  if (hasOpportunity) {
                    classes.push('opportunity');
                  }

                  let note: string | undefined;
                  if (isFocus && selectedStrategyName) {
                    note = `${selectedStrategyName} · PTO pick`;
                  } else if (holidayName && ribbonLength) {
                    note = `${holidayName} · ${ribbonLength}-day connected break`;
                  } else if (holidayName) {
                    note = holidayName;
                  } else if (ribbonLength) {
                    note = `${ribbonLength}-day connected break`;
                  } else {
                    note = opportunityByDate.get(iso);
                  }

                  return (
                    <div className={classes.join(' ')} key={iso} data-note={note}>
                      {day}
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
