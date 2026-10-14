/**
 * NUTRACK utility functions
 */

import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';

// ─── ID generation ────────────────────────────────────────────────────────────

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC-4122 v4 UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// ─── Date utilities ───────────────────────────────────────────────────────────

/** Returns YYYY-MM-DD string from a Date object */
export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Returns today as YYYY-MM-DD */
export function today(): string {
  return toDateString(new Date());
}

/** Format date for display: "Minggu, 11 Oktober 2026" */
export function formatDisplayDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'EEEE, d MMMM yyyy', { locale: id });
  } catch {
    return dateStr;
  }
}

/** Format date short: "11 Okt" */
export function formatShortDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'd MMM', { locale: id });
  } catch {
    return dateStr;
  }
}

/** Returns week range containing given date */
export function getWeekRange(dateStr: string): { start: string; end: string } {
  const date = parseISO(dateStr);
  return {
    start: toDateString(startOfWeek(date, { weekStartsOn: 1 })),
    end: toDateString(endOfWeek(date, { weekStartsOn: 1 })),
  };
}

/** Returns month range containing given date */
export function getMonthRange(dateStr: string): { start: string; end: string } {
  const date = parseISO(dateStr);
  return {
    start: toDateString(startOfMonth(date)),
    end: toDateString(endOfMonth(date)),
  };
}

/** Returns array of date strings between start and end (inclusive) */
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = parseISO(startDate);
  const end = parseISO(endDate);
  while (current <= end) {
    dates.push(toDateString(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// ─── Number formatting ────────────────────────────────────────────────────────

/** Format a number with thousands separator (Indonesian locale) */
export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

/** Format calories: "2.050 kcal" */
export function formatCalories(kcal: number): string {
  return `${formatNumber(Math.round(kcal))} kcal`;
}

/** Format grams: "130 g" */
export function formatGrams(g: number): string {
  return `${Math.round(g)} g`;
}

/** Format percentage: "73%" */
export function formatPercent(value: number): string {
  return `${Math.min(Math.round(value), 999)}%`;
}

// ─── Color utilities ──────────────────────────────────────────────────────────

import type { NutrientStatusLevel } from '@/types';

/** Returns a Tailwind text color class for a nutrient status */
export function statusTextColor(status: NutrientStatusLevel): string {
  switch (status) {
    case 'on_target':
      return 'text-success';
    case 'above_target':
      return 'text-warning';
    case 'over_limit':
      return 'text-danger';
    case 'below_target':
      return 'text-danger';
    case 'in_progress':
      return 'text-text-secondary';
    case 'no_data':
    default:
      return 'text-text-muted';
  }
}

/** Returns a CSS color string (hex) for a nutrient status — for SVG/canvas */
export function statusColor(status: NutrientStatusLevel): string {
  switch (status) {
    case 'on_target':
      return '#65D99A';
    case 'above_target':
      return '#FFBF69';
    case 'over_limit':
      return '#FF6B73';
    case 'below_target':
      return '#FFBF69';
    case 'in_progress':
      return '#D6FF3F';
    case 'no_data':
    default:
      return '#747C83';
  }
}

/** Returns Tailwind progress bar color class */
export function statusBarColor(status: NutrientStatusLevel): string {
  switch (status) {
    case 'on_target':
      return 'bg-success';
    case 'above_target':
      return 'bg-warning';
    case 'over_limit':
      return 'bg-danger';
    case 'below_target':
      return 'bg-warning';
    case 'in_progress':
    default:
      return 'bg-accent';
  }
}

/** Returns a human-readable label for a nutrient status */
export function statusLabel(status: NutrientStatusLevel): string {
  switch (status) {
    case 'on_target':
      return 'Sesuai target';
    case 'above_target':
      return 'Di atas target';
    case 'over_limit':
      return 'Melebihi batas';
    case 'below_target':
      return 'Di bawah target';
    case 'in_progress':
      return 'Sedang berjalan';
    case 'no_data':
    default:
      return 'Belum ada data';
  }
}

// ─── Clamp ────────────────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ─── cn (className concatenation) ────────────────────────────────────────────

/** Simple utility to merge class names (no tailwind-merge dependency) */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
