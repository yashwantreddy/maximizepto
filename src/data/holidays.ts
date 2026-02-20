import type { Holiday } from '../types';

export const YEAR = 2026;

export const DEFAULT_FEDERAL_HOLIDAYS: Holiday[] = [
  { id: 'h1', date: '2026-01-01', name: "New Year's Day" },
  { id: 'h2', date: '2026-01-19', name: 'Martin Luther King, Jr. Day' },
  { id: 'h3', date: '2026-02-16', name: "Presidents' Day" },
  { id: 'h4', date: '2026-05-25', name: 'Memorial Day' },
  { id: 'h5', date: '2026-06-19', name: 'Juneteenth' },
  { id: 'h6', date: '2026-07-03', name: 'Independence Day (Observed)' },
  { id: 'h7', date: '2026-09-07', name: 'Labor Day' },
  { id: 'h8', date: '2026-10-12', name: 'Columbus Day' },
  { id: 'h9', date: '2026-11-11', name: 'Veterans Day' },
  { id: 'h10', date: '2026-11-26', name: 'Thanksgiving Day' },
  { id: 'h11', date: '2026-12-25', name: 'Christmas Day' }
];

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
] as const;

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
