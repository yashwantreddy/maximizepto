export interface Holiday {
  id: string;
  name: string;
  date: string;
}

export interface Strategy {
  name: string;
  dates: string[];
  ptoDays: number;
  vacationDays: number;
  longest: number;
  micro: number;
  yieldScore: number;
  rank: number;
}

export interface PlannerResult {
  suggestedPTO: string[];
  strategies: Strategy[];
}

export interface OverviewMetrics {
  yieldScore: number;
  longestBreak: number;
  microBreaks: number;
  unusedRisk: 'Low' | 'Medium' | 'High';
  vacationDays: number;
  utilizationRate: number;
}

export interface BreakWindow {
  start: string;
  end: string;
  length: number;
}

export interface PlannerState {
  accrualRate: number;
  aggressiveness: number;
  observedHolidays: string[];
  customHolidays: Holiday[];
}
