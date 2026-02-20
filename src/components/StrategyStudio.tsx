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
        {!strategies.length ? (
          <div className="empty-state">
            No strategy windows yet. Increase accrual, enable holidays, or switch to a bolder
            intensity level.
          </div>
        ) : (
          strategies.map((strategy) => {
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
                  Spend {strategy.ptoDays} PTO day(s) to access {strategy.vacationDays} total off day(s), with a
                  longest break of {strategy.longest} day(s).
                </p>
                <div className="suggestion-meta">
                  <span className="badge yield">Yield {strategy.yieldScore.toFixed(1)}x</span>
                  <span className="meta-pill">Window {formatDateRange(strategy.dates)}</span>
                  <span className="meta-pill">{strategy.micro} micro-break(s)</span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
