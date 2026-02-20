import { MONTHS, WEEKDAYS } from '../data/holidays';
import { formatISODate } from '../lib/dates';
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
  const holidayByDate = activeHolidays.reduce<Record<string, string>>((map, holiday) => {
    map[holiday.date] = holiday.name;
    return map;
  }, {});

  const ptoSet = new Set(suggestedPTO);
  const selectedStrategy = strategies.find((strategy) => strategy.name === selectedStrategyName);
  const selectedSet = new Set(selectedStrategy?.dates ?? []);

  return (
    <section className="panel calendar-panel">
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
            <i className="dot focus" />Selected Strategy
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
                  if (isFocus) {
                    classes.push('focus');
                    const next = new Date(year, monthIndex, day + 1);
                    if (selectedSet.has(formatISODate(next))) {
                      classes.push('link-right');
                    }
                  }

                  const note = holidayName ?? (isFocus ? selectedStrategyName : undefined);

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
