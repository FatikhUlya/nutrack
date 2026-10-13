'use client';

import { clamp, formatNumber } from '@/lib/utils';
import type { NutritionTarget } from '@/types';

interface MacroBreakdownCardProps {
  proteinG: number;
  carbsG: number;
  fatG: number;
  target: NutritionTarget | null;
}

// Mini donut ring for each macro (matching reference UI)
function MacroRing({
  percent,
  color,
  size = 56,
}: {
  percent: number;
  color: string;
  size?: number;
}) {
  const sw = 5;
  const radius = (size - sw) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = clamp(percent, 0, 100);
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#E0EDE0" strokeWidth={sw} />
      <circle
        cx={center} cy={center} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
        className="progress-ring-fill"
      />
    </svg>
  );
}

export function MacroBreakdownCard({
  proteinG,
  carbsG,
  fatG,
  target,
}: MacroBreakdownCardProps) {
  const proteinTarget = target?.proteinTargetG ?? 140;
  const carbsTarget = target?.carbsTargetG ?? 220;
  const fatTarget = target?.fatTargetG ?? 70;

  const macros = [
    {
      name: 'Karbo',
      label: 'CARB',
      consumed: carbsG,
      target: carbsTarget,
      unit: 'g',
      color: '#60A5FA',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-500',
      borderColor: 'border-blue-100',
    },
    {
      name: 'Protein',
      label: 'PROTEIN',
      consumed: proteinG,
      target: proteinTarget,
      unit: 'g',
      color: '#A78BFA',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-500',
      borderColor: 'border-violet-100',
    },
    {
      name: 'Lemak',
      label: 'FAT',
      consumed: fatG,
      target: fatTarget,
      unit: 'g',
      color: '#F97316',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-500',
      borderColor: 'border-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 animate-fade-in-up">
      {macros.map(m => {
        const percent = m.target > 0 ? (m.consumed / m.target) * 100 : 0;
        const remaining = Math.max(0, m.target - m.consumed);
        const isOver = m.consumed > m.target;

        return (
          <div
            key={m.name}
            className={`flex flex-col items-center rounded-2xl bg-white border ${m.borderColor} shadow-card p-3 sm:p-4 transition-all hover:shadow-elevated`}
          >
            {/* Mini ring */}
            <div className="relative mb-2">
              <MacroRing percent={percent} color={m.color} size={52} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-[9px] font-black ${m.textColor}`}>
                  {Math.round(Math.min(percent, 100))}%
                </span>
              </div>
            </div>

            {/* Consumed */}
            <div className={`text-base font-extrabold ${m.textColor}`}>
              {Math.round(m.consumed)}<span className="text-xs font-semibold">g</span>
            </div>

            {/* Label */}
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-0.5">
              {m.label}
            </div>

            {/* Remaining */}
            <div className="mt-1.5 text-center">
              {isOver ? (
                <span className="text-[10px] font-semibold text-danger">
                  +{Math.round(m.consumed - m.target)}g lebih
                </span>
              ) : (
                <span className="text-[10px] font-medium text-text-muted">
                  sisa {Math.round(remaining)}g
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 rounded-full bg-border mt-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(percent, 100)}%`,
                  backgroundColor: isOver ? '#EF4444' : m.color,
                }}
              />
            </div>

            <div className="text-[9px] text-text-muted mt-1 font-medium">
              / {m.target}{m.unit}
            </div>
          </div>
        );
      })}
    </div>
  );
}
