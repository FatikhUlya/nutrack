'use client';

import {
  ArrowLeft,
  MoreHorizontal,
  Zap,
  Plus,
  Trash2,
} from 'lucide-react';
import { FoodIllustration } from '@/components/ui/FoodIllustration';
import type { MealType, FoodEntry, NutritionTarget } from '@/types';
import { MEAL_TYPE_LABELS } from '@/types';

interface MealDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType;
  entries: FoodEntry[];
  target: NutritionTarget | null;
  onAddMore: (mealType: MealType) => void;
  onDeleteEntry: (id: string) => void;
}

export function MealDetailModal({
  isOpen,
  onClose,
  mealType,
  entries,
  target,
  onAddMore,
  onDeleteEntry,
}: MealDetailModalProps) {
  if (!isOpen) return null;

  const title = MEAL_TYPE_LABELS[mealType];

  const totalDailyTarget = target?.calorieTargetKcal ?? 1850;
  const ratioPercentages: Record<MealType, { pct: number; minPct: number }> = {
    breakfast: { pct: 0.25, minPct: 0.20 },
    lunch: { pct: 0.35, minPct: 0.30 },
    dinner: { pct: 0.30, minPct: 0.25 },
    snack: { pct: 0.10, minPct: 0.05 },
  };

  const ratio = ratioPercentages[mealType];
  const mealTargetCal = Math.round(totalDailyTarget * ratio.pct);
  const recommendedRange = {
    min: Math.round(totalDailyTarget * ratio.minPct),
    max: mealTargetCal,
  };

  const totalCalories = entries.reduce((s, e) => s + e.caloriesKcal, 0);
  const totalProtein = entries.reduce((s, e) => s + e.proteinG, 0);
  const totalCarbs = entries.reduce((s, e) => s + e.carbsG, 0);
  const totalFat = entries.reduce((s, e) => s + e.fatG, 0);

  const targetProteinG = target ? Math.round(target.proteinTargetG * ratio.pct) : Math.round((mealTargetCal * 0.3) / 4);
  const targetCarbsG = target ? Math.round(target.carbsTargetG * ratio.pct) : Math.round((mealTargetCal * 0.45) / 4);
  const targetFatG = target ? Math.round(target.fatTargetG * ratio.pct) : Math.round((mealTargetCal * 0.25) / 9);

  // Mini circular progress ring component
  const MiniRing = ({
    value,
    targetVal,
    color,
    label,
  }: {
    value: number;
    targetVal: number;
    color: string;
    label: string;
  }) => {
    const size = 38;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * radius;
    const pct = Math.min(100, Math.round((value / Math.max(1, targetVal)) * 100));
    const offset = circ - (pct / 100) * circ;

    return (
      <div className="flex items-center gap-2">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="rotate-[-90deg]">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#292D30"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div>
          <div className="text-xs font-black text-[#F4F5F6] leading-none">
            {Math.round(value)}g
          </div>
          <div className="text-[9px] font-extrabold uppercase text-[#747C83] mt-0.5 tracking-wider">
            {label}
          </div>
        </div>
      </div>
    );
  };

  // Main donut ring
  const donutSize = 140;
  const donutStroke = 12;
  const donutRadius = (donutSize - donutStroke) / 2;
  const donutCirc = 2 * Math.PI * donutRadius;
  const calPct = Math.min(100, Math.round((totalCalories / mealTargetCal) * 100));
  const donutOffset = donutCirc - (calPct / 100) * donutCirc;

  // Grade evaluation
  const isHealthy = totalProtein >= 20 && totalFat <= 25;
  const grade = isHealthy ? 'B' : totalCalories > mealTargetCal ? 'C' : 'A';
  const gradeColor = grade === 'A' ? '#D6FF3F' : grade === 'B' ? '#65D99A' : '#FFBF69';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in font-sans">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-3xl bg-[#202326] border border-[#2D3134] flex flex-col overflow-hidden shadow-2xl text-[#F4F5F6]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-[#2D3134]">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#292D30] active:scale-95 transition-all text-[#D6FF3F]"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
          </button>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#292D30] text-[#747C83]"
            aria-label="Menu"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Title & Portion Subtitle */}
        <div className="px-6 pt-3 pb-3">
          <h2 className="text-2xl font-black text-[#F4F5F6] tracking-tight">
            {title}
          </h2>
          <p className="text-xs font-semibold text-[#A7ADB3] mt-0.5">
            Recommended portion: {recommendedRange.min}-{recommendedRange.max} kcal
          </p>
        </div>

        {/* Hero Donut Gauge + Macro Rings Row */}
        <div className="px-6 pb-5 pt-2 flex items-center justify-between gap-4 bg-[#17191B] border-y border-[#2D3134]">
          {/* Main Calorie Ring */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg width={donutSize} height={donutSize} className="rotate-[-90deg]">
              <circle
                cx={donutSize / 2}
                cy={donutSize / 2}
                r={donutRadius}
                fill="none"
                stroke="#292D30"
                strokeWidth={donutStroke}
              />
              <circle
                cx={donutSize / 2}
                cy={donutSize / 2}
                r={donutRadius}
                fill="none"
                stroke="#D6FF3F"
                strokeWidth={donutStroke}
                strokeDasharray={donutCirc}
                strokeDashoffset={donutOffset}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 8px rgba(214, 255, 63, 0.5))' }}
              />
            </svg>

            {/* Inside Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Zap className="h-5 w-5 text-[#D6FF3F] mb-0.5" fill="currentColor" />
              <div className="text-2xl font-black text-[#F4F5F6] leading-none">
                {totalCalories}
              </div>
              <div className="text-[10px] font-extrabold text-[#747C83] tracking-wider mt-0.5">
                /{mealTargetCal} KCAL
              </div>
            </div>
          </div>

          {/* 3 Macro Mini Rings (CARB, PROTEIN, FAT) */}
          <div className="flex flex-col gap-3">
            <MiniRing
              value={totalCarbs}
              targetVal={targetCarbsG}
              color="#67E8F9"
              label="CARB"
            />
            <MiniRing
              value={totalProtein}
              targetVal={targetProteinG}
              color="#77B7FF"
              label="PROTEIN"
            />
            <MiniRing
              value={totalFat}
              targetVal={targetFatG}
              color="#C4B5FD"
              label="FAT"
            />
          </div>
        </div>

        {/* Bottom Section for "Food taken" and "Nutrition quality" */}
        <div className="flex-1 bg-[#202326] p-6 overflow-y-auto space-y-5">
          {/* Section: Food Taken */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-[#F4F5F6]">Food taken</h3>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAddMore(mealType);
                }}
                className="flex items-center gap-1 text-xs font-bold text-[#D6FF3F] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah</span>
              </button>
            </div>

            {entries.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#747C83] bg-[#17191B] rounded-2xl border border-dashed border-[#2D3134]">
                Belum ada makanan dicatat untuk {title.toLowerCase()}.
              </div>
            ) : (
              <div className="divide-y divide-[#2D3134]">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#17191B] flex items-center justify-center border border-[#383D41] shrink-0">
                        <FoodIllustration name={entry.foodName} size={32} />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-[#F4F5F6]">
                          {entry.foodName}
                        </h4>
                        <p className="text-[11px] text-[#747C83] mt-0.5">
                          {entry.caloriesKcal}kcal · {entry.quantity} {entry.servingUnit}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteEntry(entry.id)}
                      className="p-1.5 text-[#747C83] hover:text-[#FF6B73] rounded-lg transition-all"
                      aria-label="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Nutrition Quality Badge & Description */}
          <div className="pt-2 border-t border-[#2D3134]">
            <h3 className="text-sm font-extrabold text-[#F4F5F6] mb-3">
              Nutrition quality
            </h3>
            <div className="flex items-start gap-3.5 bg-[#17191B] p-3.5 rounded-2xl border border-[#2D3134]">
              <div
                className="w-11 h-11 shrink-0 rounded-full border-2 flex items-center justify-center font-black text-lg shadow-neon-glow"
                style={{
                  borderColor: gradeColor,
                  color: gradeColor,
                  backgroundColor: `${gradeColor}20`,
                }}
              >
                {grade}
              </div>

              <p className="text-xs text-[#A7ADB3] leading-relaxed">
                {grade === 'B' || grade === 'A'
                  ? 'Healthy if taken in moderation. Nutrient-packed with good protein balance to fuel your body throughout the day.'
                  : 'Neutral as it contains rich carbs or fats. Ensure remaining meals today are balanced with lean protein and veggies.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
