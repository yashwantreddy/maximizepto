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
    expect(metrics.utilizationRate).toBeGreaterThanOrEqual(0);
    expect(metrics.utilizationRate).toBeLessThanOrEqual(100);
    expect(['Low', 'Medium', 'High']).toContain(metrics.unusedRisk);
  });

  it('computes per-strategy totals only from windows that include that strategy PTO', () => {
    const result = calculateOptimalPTO({
      year: YEAR,
      budget: 1,
      aggressiveness: 1,
      activeHolidays: [
        { id: 'x1', date: '2026-01-01', name: 'New Year Seed' },
        { id: 'x2', date: '2026-07-03', name: 'Summer Friday Seed' }
      ]
    });

    expect(result.strategies).toHaveLength(1);
    expect(result.suggestedPTO).toEqual(['2026-01-02']);
    expect(result.strategies[0].vacationDays).toBe(4);
    expect(result.strategies[0].longest).toBe(4);
  });
});
