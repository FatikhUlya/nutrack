'use client';

import { cn, clamp } from '@/lib/utils';

interface ProgressRingProps {
  value: number;         // 0–100 (can exceed 100 for over-target)
  size?: number;         // diameter in px
  strokeWidth?: number;
  color?: string;        // hex color string
  trackColor?: string;
  label?: string;
  sublabel?: string;
  showPercentage?: boolean;
  overTarget?: boolean;
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  color = '#D6FF3F',
  trackColor = '#292D30',
  label,
  sublabel,
  showPercentage = false,
  overTarget = false,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = clamp(value, 0, 100);
  const offset = circumference - (clampedValue / 100) * circumference;

  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label ? `${label}: ${Math.round(value)}%` : `Progress: ${Math.round(value)}%`}
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress fill */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={overTarget ? '#FF6B73' : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          className="progress-ring-fill"
        />
        {/* Over-target indicator arc */}
        {overTarget && value > 100 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#FF6B73"
            strokeWidth={strokeWidth}
            strokeOpacity={0.3}
            strokeDasharray={`${(clamp(value - 100, 0, 50) / 50) * circumference} ${circumference}`}
            strokeDashoffset={0}
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
        {showPercentage && (
          <span
            className={cn(
              'font-bold leading-none',
              size >= 120 ? 'text-2xl' : 'text-lg',
            )}
          >
            {Math.round(clamp(value, 0, 999))}%
          </span>
        )}
        {label && (
          <span
            className={cn(
              'font-bold leading-tight',
              size >= 120 ? 'text-base' : 'text-sm',
            )}
          >
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-xs text-text-muted leading-tight mt-0.5">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
