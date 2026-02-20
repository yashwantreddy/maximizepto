import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActionBar } from './components/ActionBar';
import { CalendarCanvas } from './components/CalendarCanvas';
import { ControlRail } from './components/ControlRail';
import { HeroMetrics } from './components/HeroMetrics';
import { OnboardingModal } from './components/OnboardingModal';
import { ScenarioLab } from './components/ScenarioLab';
import { StrategyStudio } from './components/StrategyStudio';
import { formatDateRange } from './lib/planner';
import { DEFAULT_FEDERAL_HOLIDAYS, YEAR } from './data/holidays';
import { calculateOptimalPTO, calculateOverviewMetrics, getActiveHolidays } from './lib/planner';
import type { Holiday, PlannerState } from './types';

const STORAGE_KEY = 'pto-planner-state';
const ONBOARDING_KEY = 'pto-onboarding-complete-v1';
const AGGRESSIVENESS_LABELS = ['Chill', 'Balanced', 'Max Out'] as const;

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
  const [actionStatusMessage, setActionStatusMessage] = useState('Ready to export your plan.');
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return localStorage.getItem(ONBOARDING_KEY) !== 'true';
  });
  const [comparisonAggressiveness, setComparisonAggressiveness] = useState(
    plannerState.aggressiveness === 3 ? 2 : 3
  );

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

  const comparisonPlannerResult = useMemo(
    () =>
      calculateOptimalPTO({
        year: YEAR,
        budget: Math.floor(annualTotal),
        aggressiveness: comparisonAggressiveness,
        activeHolidays
      }),
    [annualTotal, comparisonAggressiveness, activeHolidays]
  );

  const comparisonMetrics = useMemo(
    () =>
      calculateOverviewMetrics(
        YEAR,
        annualTotal,
        activeHolidays,
        comparisonPlannerResult.suggestedPTO
      ),
    [annualTotal, activeHolidays, comparisonPlannerResult.suggestedPTO]
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
    if (comparisonAggressiveness === plannerState.aggressiveness) {
      setComparisonAggressiveness(plannerState.aggressiveness === 3 ? 2 : 3);
    }
  }, [comparisonAggressiveness, plannerState.aggressiveness]);

  const aggressivenessLabel = AGGRESSIVENESS_LABELS[plannerState.aggressiveness - 1];
  const comparisonLabel = AGGRESSIVENESS_LABELS[comparisonAggressiveness - 1];

  const selectedStrategy = useMemo(
    () => plannerResult.strategies.find((strategy) => strategy.name === selectedStrategyName),
    [plannerResult.strategies, selectedStrategyName]
  );

  const energyLine = useMemo(() => {
    const top = plannerResult.strategies[0];
    if (!top) {
      return 'Increase accrual or enable more holidays to generate vacation plays.';
    }

    return `${top.name} is strongest: ${top.ptoDays} PTO day(s) unlock ${top.vacationDays} off day(s) with a ${metrics.yieldScore.toFixed(1)}x portfolio yield.`;
  }, [plannerResult.strategies, metrics.yieldScore]);

  const managerSummary = useMemo(() => {
    const top = plannerResult.strategies[0];
    const selectedRange = selectedStrategy ? formatDateRange(selectedStrategy.dates) : 'n/a';
    const holidayCount = activeHolidays.length;

    return [
      `2026 PTO Plan Summary`,
      `Strategy level: ${aggressivenessLabel}`,
      `Annual PTO available: ${annualTotal.toFixed(1)} days`,
      `Recommended PTO usage: ${plannerResult.suggestedPTO.length} days`,
      `Utilization: ${metrics.utilizationRate.toFixed(1)}%`,
      `Vacation yield: ${metrics.yieldScore.toFixed(1)}x`,
      `Longest break: ${metrics.longestBreak} days`,
      `Active holidays: ${holidayCount}`,
      top
        ? `Top strategy: ${top.name} (${top.ptoDays} PTO day(s) -> ${top.vacationDays} off day(s))`
        : 'Top strategy: none generated',
      selectedStrategy ? `Selected window: ${selectedRange}` : 'Selected window: none',
      `Generated from MaximizePTO Escape Atelier`
    ].join('\n');
  }, [
    activeHolidays.length,
    aggressivenessLabel,
    annualTotal,
    metrics.longestBreak,
    metrics.utilizationRate,
    metrics.yieldScore,
    plannerResult.strategies,
    plannerResult.suggestedPTO.length,
    selectedStrategy
  ]);

  const setActionStatus = useCallback((message: string) => {
    setActionStatusMessage(message);
  }, []);

  const handleExportCsv = useCallback(() => {
    if (!plannerResult.suggestedPTO.length) {
      setActionStatus('No PTO suggestions to export yet.');
      return;
    }

    const header = ['Date', 'Type', 'Strategy', 'Notes'];
    const selectedSet = new Set(selectedStrategy?.dates ?? []);
    const holidayByDate = activeHolidays.reduce<Record<string, string>>((map, holiday) => {
      map[holiday.date] = holiday.name;
      return map;
    }, {});

    const rows = plannerResult.suggestedPTO
      .slice()
      .sort()
      .map((date) => {
        const notes = holidayByDate[date] ? `Near ${holidayByDate[date]}` : 'Suggested PTO';
        const strategy = selectedSet.has(date) ? selectedStrategyName : '';
        return [date, 'PTO', strategy, notes];
      });

    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'maximizepto-2026-plan.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setActionStatus('CSV exported: maximizepto-2026-plan.csv');
  }, [
    activeHolidays,
    plannerResult.suggestedPTO,
    selectedStrategy,
    selectedStrategyName,
    setActionStatus
  ]);

  const copyTextToClipboard = useCallback(async (text: string): Promise<boolean> => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }, []);

  const handleCopyManagerSummary = useCallback((): void => {
    void (async () => {
      const copied = await copyTextToClipboard(managerSummary);
      if (copied) {
        setActionStatus('Manager summary copied to clipboard.');
        return;
      }

      const textarea = document.createElement('textarea');
      textarea.value = managerSummary;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);

      setActionStatus(success ? 'Manager summary copied to clipboard.' : 'Copy failed. Please try again.');
    })();
  }, [copyTextToClipboard, managerSummary, setActionStatus]);

  const handlePrintPlan = useCallback(() => {
    window.print();
    setActionStatus('Print dialog opened.');
  }, [setActionStatus]);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  }, []);

  const dismissOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  }, []);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      const activeTag = (activeElement?.tagName ?? '').toLowerCase();
      const isTyping =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        Boolean(activeElement?.isContentEditable);

      const key = event.key.toLowerCase();
      if (key === 'escape' && showOnboarding) {
        event.preventDefault();
        dismissOnboarding();
        return;
      }

      if (isTyping) {
        return;
      }

      if (event.key === '/') {
        event.preventDefault();
        document.getElementById('accrual-rate')?.focus();
        return;
      }

      if (event.key === '?') {
        event.preventDefault();
        setShowOnboarding((current) => !current);
        return;
      }

      if (key === 'g') {
        event.preventDefault();
        document.getElementById('calendar-canvas')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      if (key === 'e') {
        event.preventDefault();
        handleExportCsv();
        return;
      }

      if (key === 'm') {
        event.preventDefault();
        handleCopyManagerSummary();
      }
    };

    document.addEventListener('keydown', onShortcut);
    return () => document.removeEventListener('keydown', onShortcut);
  }, [dismissOnboarding, handleCopyManagerSummary, handleExportCsv, showOnboarding]);

  return (
    <>
      <a href="#planner-main" className="skip-link">
        Skip to planner workspace
      </a>

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

          <main className="plan-stage" id="planner-main">
            <ScenarioLab
              baseAggressiveness={plannerState.aggressiveness}
              baseLabel={aggressivenessLabel}
              baseMetrics={metrics}
              basePtoUsed={plannerResult.suggestedPTO.length}
              compareAggressiveness={comparisonAggressiveness}
              compareLabel={comparisonLabel}
              compareMetrics={comparisonMetrics}
              comparePtoUsed={comparisonPlannerResult.suggestedPTO.length}
              onCompareAggressivenessChange={setComparisonAggressiveness}
            />
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
            <ActionBar
              onExportCsv={handleExportCsv}
              onCopyManagerSummary={handleCopyManagerSummary}
              onPrintPlan={handlePrintPlan}
              statusMessage={actionStatusMessage}
            />
          </main>
        </div>
      </div>
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={dismissOnboarding}
        onComplete={completeOnboarding}
      />
    </>
  );
}
