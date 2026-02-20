import type { OverviewMetrics } from '../types';

interface ScenarioLabProps {
  baseAggressiveness: number;
  baseLabel: string;
  baseMetrics: OverviewMetrics;
  basePtoUsed: number;
  compareAggressiveness: number;
  compareLabel: string;
  compareMetrics: OverviewMetrics;
  comparePtoUsed: number;
  onCompareAggressivenessChange: (value: number) => void;
}

function formatSigned(value: number, digits = 1): string {
  if (value > 0) {
    return `+${value.toFixed(digits)}`;
  }

  if (value < 0) {
    return value.toFixed(digits);
  }

  return '0.0';
}

export function ScenarioLab({
  baseAggressiveness,
  baseLabel,
  baseMetrics,
  basePtoUsed,
  compareAggressiveness,
  compareLabel,
  compareMetrics,
  comparePtoUsed,
  onCompareAggressivenessChange
}: ScenarioLabProps) {
  const vacationDelta = compareMetrics.vacationDays - baseMetrics.vacationDays;
  const longestDelta = compareMetrics.longestBreak - baseMetrics.longestBreak;
  const yieldDelta = compareMetrics.yieldScore - baseMetrics.yieldScore;
  const utilizationDelta = compareMetrics.utilizationRate - baseMetrics.utilizationRate;

  return (
    <section className="panel scenario-panel">
      <div className="scenario-head">
        <div>
          <p className="eyebrow">What-If Lab</p>
          <h3>Scenario Comparison</h3>
        </div>

        <div className="scenario-levels" role="group" aria-label="Compare with strategy level">
          {[1, 2, 3].map((level) => {
            const sameAsBase = level === baseAggressiveness;
            const active = level === compareAggressiveness;
            return (
              <button
                key={level}
                type="button"
                disabled={sameAsBase}
                className={`scenario-level-btn ${active ? 'active' : ''}`}
                onClick={() => onCompareAggressivenessChange(level)}
              >
                {level === 1 ? 'Chill' : level === 2 ? 'Balanced' : 'Max Out'}
              </button>
            );
          })}
        </div>
      </div>

      <div className="scenario-grid">
        <article className="scenario-card base">
          <p className="scenario-tag">Current {baseLabel}</p>
          <h4>{basePtoUsed} PTO day(s) used</h4>
          <ul>
            <li>Vacation yield {baseMetrics.yieldScore.toFixed(1)}x</li>
            <li>Longest break {baseMetrics.longestBreak} day(s)</li>
            <li>Utilization {baseMetrics.utilizationRate.toFixed(1)}%</li>
          </ul>
        </article>

        <article className="scenario-card compare">
          <p className="scenario-tag">What-if {compareLabel}</p>
          <h4>{comparePtoUsed} PTO day(s) used</h4>
          <ul>
            <li>Vacation yield {compareMetrics.yieldScore.toFixed(1)}x</li>
            <li>Longest break {compareMetrics.longestBreak} day(s)</li>
            <li>Utilization {compareMetrics.utilizationRate.toFixed(1)}%</li>
          </ul>
        </article>
      </div>

      <div className="delta-row" aria-live="polite">
        <p className={`delta-pill ${vacationDelta >= 0 ? 'positive' : 'negative'}`}>
          Off days {formatSigned(vacationDelta, 0)}
        </p>
        <p className={`delta-pill ${longestDelta >= 0 ? 'positive' : 'negative'}`}>
          Longest break {formatSigned(longestDelta, 0)} days
        </p>
        <p className={`delta-pill ${yieldDelta >= 0 ? 'positive' : 'negative'}`}>
          Yield {formatSigned(yieldDelta)}x
        </p>
        <p className={`delta-pill ${utilizationDelta >= 0 ? 'positive' : 'negative'}`}>
          Utilization {formatSigned(utilizationDelta)}%
        </p>
      </div>
    </section>
  );
}
