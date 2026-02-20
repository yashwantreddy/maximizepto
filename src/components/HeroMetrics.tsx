import type { OverviewMetrics } from '../types';

interface HeroMetricsProps {
  metrics: OverviewMetrics;
}

export function HeroMetrics({ metrics }: HeroMetricsProps) {
  return (
    <div className="hero-metrics">
      <article className="hero-card">
        <p>Vacation Yield</p>
        <h2>{metrics.yieldScore.toFixed(1)}x</h2>
      </article>
      <article className="hero-card">
        <p>Longest Break</p>
        <h2>{metrics.longestBreak} days</h2>
      </article>
      <article className="hero-card">
        <p>Micro Breaks</p>
        <h2>{metrics.microBreaks}</h2>
      </article>
      <article className="hero-card">
        <p>Utilization</p>
        <h2>{metrics.utilizationRate.toFixed(1)}%</h2>
      </article>
      <article className="hero-card">
        <p>Unused PTO Risk</p>
        <h2>{metrics.unusedRisk}</h2>
      </article>
    </div>
  );
}
