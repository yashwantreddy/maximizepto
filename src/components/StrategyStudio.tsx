import { useMemo } from 'react';
import { formatDateRange } from '../lib/planner';
import type { Strategy } from '../types';

interface StrategyStudioProps {
  strategies: Strategy[];
  selectedStrategyName: string;
  energyLine: string;
  onSelectStrategy: (name: string) => void;
}

export function StrategyStudio({
  strategies,
  selectedStrategyName,
  energyLine,
  onSelectStrategy
}: StrategyStudioProps) {
  const chronologicalStrategies = useMemo(() => {
    return strategies
      .slice()
      .sort((a, b) => {
        const aFirst = a.dates[0] ?? '9999-12-31';
        const bFirst = b.dates[0] ?? '9999-12-31';

        if (aFirst !== bFirst) {
          return aFirst.localeCompare(bFirst);
        }

        return a.name.localeCompare(b.name);
      });
  }, [strategies]);

  return (
    <section className="panel studio-panel">
      <div className="studio-header">
        <div>
          <p className="eyebrow">Strategy Studio</p>
          <h3>Recommended Escape Windows</h3>
        </div>
        <p className="energy-line">{energyLine}</p>
      </div>

      <div className="suggestions-list">
        {!chronologicalStrategies.length ? (
          <div className="empty-state">
            No strategy windows yet. Increase accrual, enable holidays, or switch to a bolder
            intensity level.
          </div>
        ) : (
          chronologicalStrategies.map((strategy) => {
            const active = strategy.name === selectedStrategyName;
            return (
              <article
                key={strategy.name}
                className={`suggestion-card ${active ? 'active' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                onClick={() => onSelectStrategy(strategy.name)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectStrategy(strategy.name);
                  }
                }}
              >
                <div className="suggestion-top">
                  <h4>{strategy.name}</h4>
                  <span className="badge pto">{strategy.ptoDays} PTO</span>
                </div>
                <p className="suggestion-body">
                  Apply these {strategy.ptoDays} PTO day(s) to secure a {strategy.longest}-day
                  headline break.
                </p>
                <div className="suggestion-meta">
                  <span className="badge yield">Yield {strategy.yieldScore.toFixed(1)}x</span>
                  <span className="meta-pill">Take PTO: {formatDateRange(strategy.dates)}</span>
                  <span className="meta-pill">{strategy.vacationDays} total day(s) off</span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
