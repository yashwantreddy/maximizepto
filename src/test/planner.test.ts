import { describe, expect, it } from 'vitest';
import { DEFAULT_FEDERAL_HOLIDAYS, YEAR } from '../data/holidays';
import { calculateOptimalPTO, calculateOverviewMetrics } from '../lib/planner';

describe('planner engine', () => {
  it('builds ranked strategies for a standard 18-day PTO budget', () => {
    const result = calculateOptimalPTO({
      year: YEAR,
      budget: 18,
      aggressiveness: 2,
      activeHolidays: DEFAULT_FEDERAL_HOLIDAYS
    });

    expect(result.suggestedPTO.length).toBeGreaterThan(0);
    expect(result.strategies.length).toBeGreaterThan(0);
    expect(result.strategies[0].yieldScore).toBeGreaterThan(0);
  });

  it('computes overview metrics with non-negative risk inputs', () => {
    const result = calculateOptimalPTO({
      year: YEAR,
      budget: 12,
      aggressiveness: 3,
      activeHolidays: DEFAULT_FEDERAL_HOLIDAYS
    });

    const metrics = calculateOverviewMetrics(YEAR, 18, DEFAULT_FEDERAL_HOLIDAYS, result.suggestedPTO);

    expect(metrics.yieldScore).toBeGreaterThanOrEqual(0);
    expect(metrics.longestBreak).toBeGreaterThanOrEqual(0);
    expect(['Low', 'Medium', 'High']).toContain(metrics.unusedRisk);
  });
});
