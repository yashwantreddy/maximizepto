import type { Holiday } from '../types';

interface ControlRailProps {
  accrualRate: number;
  annualTotal: number;
  aggressiveness: number;
  aggressivenessLabel: string;
  observedHolidayIds: string[];
  defaultHolidays: Holiday[];
  customHolidays: Holiday[];
  customHolidayName: string;
  customHolidayDate: string;
  ptoUsed: number;
  ptoRemaining: number;
  onAccrualChange: (value: number) => void;
  onAggressivenessChange: (value: number) => void;
  onPresetSelect: (value: number) => void;
  onToggleHoliday: (id: string, checked: boolean) => void;
  onCustomHolidayNameChange: (value: string) => void;
  onCustomHolidayDateChange: (value: string) => void;
  onAddCustomHoliday: () => void;
  onRemoveCustomHoliday: (id: string) => void;
}

export function ControlRail({
  accrualRate,
  annualTotal,
  aggressiveness,
  aggressivenessLabel,
  observedHolidayIds,
  defaultHolidays,
  customHolidays,
  customHolidayName,
  customHolidayDate,
  ptoUsed,
  ptoRemaining,
  onAccrualChange,
  onAggressivenessChange,
  onPresetSelect,
  onToggleHoliday,
  onCustomHolidayNameChange,
  onCustomHolidayDateChange,
  onAddCustomHoliday,
  onRemoveCustomHoliday
}: ControlRailProps) {
  return (
    <aside className="control-rail panel">
      <section className="section-block">
        <h3>Planner Inputs</h3>
        <label htmlFor="accrual-rate">Monthly PTO Accrual</label>
        <div className="input-wrap">
          <input
            id="accrual-rate"
            type="number"
            value={accrualRate}
            min={0}
            step={0.1}
            onChange={(event) => onAccrualChange(Number(event.target.value) || 0)}
          />
          <span>days</span>
        </div>
        <p className="support-text">
          Annual total: <strong>{annualTotal.toFixed(1)}</strong> days
        </p>
      </section>

      <section className="section-block">
        <h3>Intensity</h3>
        <label htmlFor="aggressiveness">Strategy Aggressiveness</label>
        <input
          id="aggressiveness"
          type="range"
          min={1}
          max={3}
          step={1}
          value={aggressiveness}
          onChange={(event) => onAggressivenessChange(Number(event.target.value))}
        />
        <div className="scale-row">
          <span>Chill</span>
          <strong>{aggressivenessLabel}</strong>
          <span>Max Out</span>
        </div>
        <div className="preset-row" role="group" aria-label="Strategy presets">
          {[1, 2, 3].map((level) => (
            <button
              key={level}
              type="button"
              className={`preset-btn ${level === aggressiveness ? 'active' : ''}`}
              onClick={() => onPresetSelect(level)}
            >
              {level === 1 ? 'Chill' : level === 2 ? 'Balanced' : 'Max Out'}
            </button>
          ))}
        </div>
      </section>

      <section className="section-block">
        <h3>Observed Holidays</h3>
        <div className="holiday-list">
          {defaultHolidays.map((holiday) => {
            const checked = observedHolidayIds.includes(holiday.id);
            return (
              <label className="holiday-item" key={holiday.id}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => onToggleHoliday(holiday.id, event.target.checked)}
                />
                <span>{holiday.name}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="section-block">
        <h3>Add Custom Holiday</h3>
        <div className="custom-form">
          <input
            type="text"
            placeholder="Name (Team Retreat Day)"
            value={customHolidayName}
            onChange={(event) => onCustomHolidayNameChange(event.target.value)}
          />
          <input
            type="date"
            min="2026-01-01"
            max="2026-12-31"
            value={customHolidayDate}
            onChange={(event) => onCustomHolidayDateChange(event.target.value)}
          />
          <button type="button" className="add-btn" onClick={onAddCustomHoliday}>
            +
          </button>
        </div>

        <div className="custom-list">
          {!customHolidays.length ? (
            <p className="support-text">No custom holidays yet.</p>
          ) : (
            customHolidays
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((holiday) => (
                <div className="custom-entry" key={holiday.id}>
                  <span>
                    {holiday.name} ({holiday.date})
                  </span>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => onRemoveCustomHoliday(holiday.id)}
                  >
                    &times;
                  </button>
                </div>
              ))
          )}
        </div>
      </section>

      <section className="section-block totals-block">
        <article>
          <p>Suggested PTO</p>
          <h4>{ptoUsed}</h4>
        </article>
        <article>
          <p>Remaining</p>
          <h4>{ptoRemaining.toFixed(1)}</h4>
        </article>
      </section>
    </aside>
  );
}
