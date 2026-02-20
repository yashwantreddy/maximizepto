import { useEffect, useMemo, useState } from 'react';
import { CalendarCanvas } from './components/CalendarCanvas';
import { ControlRail } from './components/ControlRail';
import { HeroMetrics } from './components/HeroMetrics';
import { StrategyStudio } from './components/StrategyStudio';
import { DEFAULT_FEDERAL_HOLIDAYS, YEAR } from './data/holidays';
import { calculateOptimalPTO, calculateOverviewMetrics, getActiveHolidays } from './lib/planner';
import type { Holiday, PlannerState } from './types';

const STORAGE_KEY = 'pto-planner-state';

function getDefaultState(): PlannerState {
  return {
    accrualRate: 1.5,
    aggressiveness: 2,
    observedHolidays: DEFAULT_FEDERAL_HOLIDAYS.map((holiday) => holiday.id),
    customHolidays: []
  };
}

function loadInitialState(): PlannerState {
  if (typeof window === 'undefined') {
    return getDefaultState();
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return getDefaultState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PlannerState>;
    const defaults = getDefaultState();

    return {
      accrualRate: Number(parsed.accrualRate) || defaults.accrualRate,
      aggressiveness:
        Number(parsed.aggressiveness) >= 1 && Number(parsed.aggressiveness) <= 3
          ? Number(parsed.aggressiveness)
          : defaults.aggressiveness,
      observedHolidays:
        Array.isArray(parsed.observedHolidays) && parsed.observedHolidays.length
          ? parsed.observedHolidays
          : defaults.observedHolidays,
      customHolidays: Array.isArray(parsed.customHolidays)
        ? parsed.customHolidays.filter(
            (holiday): holiday is Holiday =>
              Boolean(holiday) &&
              typeof holiday.id === 'string' &&
              typeof holiday.name === 'string' &&
              typeof holiday.date === 'string'
          )
        : defaults.customHolidays
    };
  } catch {
    return getDefaultState();
  }
}

export default function App() {
  const [plannerState, setPlannerState] = useState<PlannerState>(loadInitialState);
  const [customHolidayName, setCustomHolidayName] = useState('');
  const [customHolidayDate, setCustomHolidayDate] = useState('');
  const [selectedStrategyName, setSelectedStrategyName] = useState('');

  const annualTotal = plannerState.accrualRate * 12;

  const activeHolidays = useMemo(
    () =>
      getActiveHolidays(
        DEFAULT_FEDERAL_HOLIDAYS,
        plannerState.observedHolidays,
        plannerState.customHolidays
      ),
    [plannerState.observedHolidays, plannerState.customHolidays]
  );

  const plannerResult = useMemo(
    () =>
      calculateOptimalPTO({
        year: YEAR,
        budget: Math.floor(annualTotal),
        aggressiveness: plannerState.aggressiveness,
        activeHolidays
      }),
    [annualTotal, plannerState.aggressiveness, activeHolidays]
  );

  const metrics = useMemo(
    () => calculateOverviewMetrics(YEAR, annualTotal, activeHolidays, plannerResult.suggestedPTO),
    [annualTotal, activeHolidays, plannerResult.suggestedPTO]
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plannerState));
  }, [plannerState]);

  useEffect(() => {
    const hasSelected = plannerResult.strategies.some(
      (strategy) => strategy.name === selectedStrategyName
    );

    if (!hasSelected) {
      setSelectedStrategyName(plannerResult.strategies[0]?.name ?? '');
    }
  }, [plannerResult.strategies, selectedStrategyName]);

  useEffect(() => {
    const onSlashFocus = (event: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (event.key === '/' && activeTag !== 'input' && activeTag !== 'textarea') {
        event.preventDefault();
        document.getElementById('accrual-rate')?.focus();
      }
    };

    document.addEventListener('keydown', onSlashFocus);
    return () => document.removeEventListener('keydown', onSlashFocus);
  }, []);

  const aggressivenessLabel = ['Chill', 'Balanced', 'Max Out'][plannerState.aggressiveness - 1];

  const energyLine = useMemo(() => {
    const top = plannerResult.strategies[0];
    if (!top) {
      return 'Increase accrual or enable more holidays to generate vacation plays.';
    }

    return `${top.name} is strongest: ${top.ptoDays} PTO day(s) unlock ${top.vacationDays} off day(s) with a ${metrics.yieldScore.toFixed(1)}x portfolio yield.`;
  }, [plannerResult.strategies, metrics.yieldScore]);

  return (
    <>
      <div className="atmosphere" aria-hidden="true">
        <div className="sun" />
        <div className="mesh mesh-a" />
        <div className="mesh mesh-b" />
        <div className="grain" />
      </div>

      <div className="site-shell">
        <header className="hero">
          <p className="eyebrow">PTO Escape Atelier</p>
          <h1>Plan Longer Vacations With the Leave You Already Have</h1>
          <p className="hero-copy">
            Transform routine leave days into strategic long breaks. Build your 2026 escape seasons
            with ranked recommendations and a visual planning canvas.
          </p>
          <HeroMetrics metrics={metrics} />
        </header>

        <div className="workspace-grid">
          <ControlRail
            accrualRate={plannerState.accrualRate}
            annualTotal={annualTotal}
            aggressiveness={plannerState.aggressiveness}
            aggressivenessLabel={aggressivenessLabel}
            observedHolidayIds={plannerState.observedHolidays}
            defaultHolidays={DEFAULT_FEDERAL_HOLIDAYS}
            customHolidays={plannerState.customHolidays}
            customHolidayName={customHolidayName}
            customHolidayDate={customHolidayDate}
            ptoUsed={plannerResult.suggestedPTO.length}
            ptoRemaining={Math.max(annualTotal - plannerResult.suggestedPTO.length, 0)}
            onAccrualChange={(value) =>
              setPlannerState((current) => ({
                ...current,
                accrualRate: Math.max(0, value)
              }))
            }
            onAggressivenessChange={(value) =>
              setPlannerState((current) => ({
                ...current,
                aggressiveness: Math.min(3, Math.max(1, value))
              }))
            }
            onPresetSelect={(value) =>
              setPlannerState((current) => ({
                ...current,
                aggressiveness: value
              }))
            }
            onToggleHoliday={(id, checked) =>
              setPlannerState((current) => {
                if (checked) {
                  if (current.observedHolidays.includes(id)) {
                    return current;
                  }
                  return {
                    ...current,
                    observedHolidays: [...current.observedHolidays, id]
                  };
                }

                return {
                  ...current,
                  observedHolidays: current.observedHolidays.filter((holidayId) => holidayId !== id)
                };
              })
            }
            onCustomHolidayNameChange={setCustomHolidayName}
            onCustomHolidayDateChange={setCustomHolidayDate}
            onAddCustomHoliday={() => {
              const name = customHolidayName.trim();
              const date = customHolidayDate;
              if (!name || !date) {
                return;
              }

              setPlannerState((current) => ({
                ...current,
                customHolidays: [
                  ...current.customHolidays,
                  {
                    id: `c${Date.now()}`,
                    name,
                    date
                  }
                ]
              }));

              setCustomHolidayName('');
              setCustomHolidayDate('');
            }}
            onRemoveCustomHoliday={(id) =>
              setPlannerState((current) => ({
                ...current,
                customHolidays: current.customHolidays.filter((holiday) => holiday.id !== id)
              }))
            }
          />

          <main className="plan-stage">
            <StrategyStudio
              strategies={plannerResult.strategies}
              selectedStrategyName={selectedStrategyName}
              energyLine={energyLine}
              onSelectStrategy={setSelectedStrategyName}
            />
            <CalendarCanvas
              year={YEAR}
              activeHolidays={activeHolidays}
              suggestedPTO={plannerResult.suggestedPTO}
              selectedStrategyName={selectedStrategyName}
              strategies={plannerResult.strategies}
            />
          </main>
        </div>
      </div>
    </>
  );
}
