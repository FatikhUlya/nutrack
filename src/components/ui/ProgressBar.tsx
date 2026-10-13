'use client';

import { cn, clamp, statusBarColor } from '@/lib/utils';
import type { NutrientStatusLevel } from '@/types';

interface ProgressBarProps {
  value: number;         // current value
  max: number;           // max (target)
  status?: NutrientStatusLevel;
  color?: string;        // override color class
  height?: 'thin' | 'normal' | 'thick';
  showOverflow?: boolean;
  className?: string;
  animated?: boolean;
}

const heightMap = {
  thin: 'h-1',
  normal: 'h-2',
  thick: 'h-3',
};

export function ProgressBar({
  value,
  max,
  status = 'in_progress',
  color,
  height = 'normal',
  showOverflow = false,
  className,
  animated = true,
}: ProgressBarProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const clampedPercentage = clamp(percentage, 0, 100);
  const isOverflow = percentage > 100;

  const barColorClass = color ?? statusBarColor(status);

  return (
    <div
      className={cn(
        'w-full bg-surface-elevated rounded-full overflow-hidden',
        heightMap[height],
        className,
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
    >
      <div
        className={cn(
          'h-full rounded-full',
          barColorClass,
          animated && 'transition-all duration-500 ease-out',
          isOverflow && showOverflow && 'opacity-70',
        )}
        style={{ width: `${clampedPercentage}%` }}
      />
    </div>
  );
}

// ─── Labeled Progress Bar ─────────────────────────────────────────────────────

interface LabeledProgressBarProps extends ProgressBarProps {
  label: string;
  current: string;
  target: string;
}

export function LabeledProgressBar({
  label,
  current,
  target,
  ...barProps
}: LabeledProgressBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">{label}</span>
        <span className="text-xs text-text-muted">
          <span className="text-text-primary font-semibold">{current}</span>
          {' / '}
          {target}
        </span>
      </div>
      <ProgressBar {...barProps} />
    </div>
  );
}
