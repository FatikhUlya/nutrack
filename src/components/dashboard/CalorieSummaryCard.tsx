'use client';

import { Zap, Utensils, Flame } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { NutritionTarget } from '@/types';

interface CalorieSummaryCardProps {
  caloriesConsumed: number;
  target: NutritionTarget | null;
  proteinConsumed?: number;
  carbsConsumed?: number;
  fatConsumed?: number;
  caloriesBurned?: number;
}

export function CalorieSummaryCard({
  caloriesConsumed,
  target,
  proteinConsumed = 0,
  carbsConsumed = 0,
  fatConsumed = 0,
  caloriesBurned = 108,
}: CalorieSummaryCardProps) {
  const calorieTarget = target?.calorieTargetKcal ?? 2000;
  const proteinTarget = target?.proteinTargetG ?? 140;
  const carbsTarget = target?.carbsTargetG ?? 220;
  const fatTarget = target?.fatTargetG ?? 65;

  const caloriesLeft = Math.max(0, Math.round(calorieTarget - caloriesConsumed));
  const isOver = caloriesConsumed > calorieTarget;

  // Donut Gauge math
  const size = 164;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(100, (caloriesConsumed / calorieTarget) * 100);
  const offset = circumference - (percent / 100) * circumference;

  // Macro remaining calculations
  const carbsLeft = Math.max(0, Math.round(carbsTarget - carbsConsumed));
  const proteinLeft = Math.max(0, Math.round(proteinTarget - proteinConsumed));
  const fatLeft = Math.max(0, Math.round(fatTarget - fatConsumed));

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#202326] p-5 sm:p-6 shadow-card border border-[#2D3134]">
      {/* Top Main Section: EATEN | HERO RING GAUGE | BURNED */}
      <div className="flex items-center justify-between gap-3">
        {/* Left Column: EATEN */}
        <div className="flex-1 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/30 mb-2 shadow-xs">
            <Utensils className="h-5 w-5 text-[#FF6B73]" />
          </div>
          <span className="text-2xl font-black text-[#F4F5F6] tracking-tight leading-none">
            {formatNumber(Math.round(caloriesConsumed))}
          </span>
          <span className="text-[11px] font-extrabold uppercase text-[#747C83] tracking-wider mt-1.5">
            EATEN
          </span>
        </div>

        {/* Center Column: Big Donut Gauge Ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg width={size} height={size} className="rotate-[-90deg]">
            {/* Background Track Ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#292D30"
              strokeWidth={strokeWidth}
            />
            {/* Glowing Neon Progress Arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={isOver ? '#FF6B73' : '#D6FF3F'}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="progress-ring-fill transition-all duration-700 ease-out"
              style={{
                filter: isOver
                  ? 'drop-shadow(0 0 8px rgba(255, 107, 115, 0.6))'
                  : 'drop-shadow(0 0 10px rgba(214, 255, 63, 0.5))',
              }}
            />
          </svg>

          {/* Center Text inside ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#D6FF3F]/15 mb-1 border border-[#D6FF3F]/30 shadow-neon-glow">
              <Zap className="h-4 w-4 text-[#D6FF3F] fill-[#D6FF3F]" />
            </div>
            <div
              className={`text-2xl font-black tracking-tight leading-none ${
                isOver ? 'text-[#FF6B73]' : 'text-[#F4F5F6]'
              }`}
            >
              {formatNumber(isOver ? Math.round(caloriesConsumed - calorieTarget) : caloriesLeft)}
            </div>
            <div className="text-[10px] font-extrabold text-[#747C83] uppercase tracking-wider mt-1">
              {isOver ? 'KCAL OVER' : 'KCAL LEFT'}
            </div>
          </div>
        </div>

        {/* Right Column: BURNED */}
        <div className="flex-1 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 mb-2 shadow-xs">
            <Flame className="h-5 w-5 text-[#65D99A]" />
          </div>
          <span className="text-2xl font-black text-[#F4F5F6] tracking-tight leading-none">
            {formatNumber(caloriesBurned)}
          </span>
          <span className="text-[11px] font-extrabold uppercase text-[#747C83] tracking-wider mt-1.5">
            BURNED
          </span>
        </div>
      </div>

      {/* Bottom Row: 3 Macro Indicators (CARB, PROTEIN, FAT) */}
      <div className="mt-6 pt-5 border-t border-[#2D3134] grid grid-cols-3 gap-3">
        {/* CARB */}
        <div className="bg-[#292D30] rounded-2xl p-3 text-center border border-[#383D41] border-t-4 border-t-[#67E8F9] shadow-xs">
          <div className="text-[10px] font-extrabold uppercase text-[#747C83] tracking-wider">
            CARB
          </div>
          <div className="text-sm font-black text-[#F4F5F6] mt-1">
            {carbsLeft}g <span className="text-xs font-semibold text-[#747C83]">left</span>
          </div>
        </div>

        {/* PROTEIN */}
        <div className="bg-[#292D30] rounded-2xl p-3 text-center border border-[#383D41] border-t-4 border-t-[#77B7FF] shadow-xs">
          <div className="text-[10px] font-extrabold uppercase text-[#747C83] tracking-wider">
            PROTEIN
          </div>
          <div className="text-sm font-black text-[#F4F5F6] mt-1">
            {proteinLeft}g <span className="text-xs font-semibold text-[#747C83]">left</span>
          </div>
        </div>

        {/* FAT */}
        <div className="bg-[#292D30] rounded-2xl p-3 text-center border border-[#383D41] border-t-4 border-t-[#C4B5FD] shadow-xs">
          <div className="text-[10px] font-extrabold uppercase text-[#747C83] tracking-wider">
            FAT
          </div>
          <div className="text-sm font-black text-[#F4F5F6] mt-1">
            {fatLeft}g <span className="text-xs font-semibold text-[#747C83]">left</span>
          </div>
        </div>
      </div>
    </div>
  );
}
