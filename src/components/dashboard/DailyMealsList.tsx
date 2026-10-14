'use client';

import { Plus } from 'lucide-react';
import { FoodIllustration, resolveFoodType } from '@/components/ui/FoodIllustration';
import type { MealType, FoodEntry, NutritionTarget } from '@/types';
import { MEAL_TYPE_LABELS } from '@/types';

interface DailyMealsListProps {
  entries: FoodEntry[];
  target: NutritionTarget | null;
  onSelectMealDetail: (mealType: MealType) => void;
  onQuickAdd: (mealType: MealType) => void;
}

const MEAL_CONFIG: Record<
  MealType,
  {
    titleColor: string;
    defaultIllustration: string;
    portionKcal: number;
  }
> = {
  breakfast: {
    titleColor: 'text-[#FFBF69]',
    defaultIllustration: 'hotdog',
    portionKcal: 450,
  },
  lunch: {
    titleColor: 'text-[#D6FF3F]',
    defaultIllustration: 'pizza',
    portionKcal: 600,
  },
  dinner: {
    titleColor: 'text-[#C4B5FD]',
    defaultIllustration: 'steak',
    portionKcal: 550,
  },
  snack: {
    titleColor: 'text-[#67E8F9]',
    defaultIllustration: 'donut',
    portionKcal: 250,
  },
};

export function DailyMealsList({
  entries,
  target,
  onSelectMealDetail,
  onQuickAdd,
}: DailyMealsListProps) {
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  // Proporsi alokasi kalori harian: 25% sarapan, 35% siang, 30% malam, 10% camilan
  const totalDailyTarget = target?.calorieTargetKcal ?? 1850;
  const mealTargetMap: Record<MealType, number> = {
    breakfast: Math.round(totalDailyTarget * 0.25),
    lunch: Math.round(totalDailyTarget * 0.35),
    dinner: Math.round(totalDailyTarget * 0.30),
    snack: Math.round(totalDailyTarget * 0.10),
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-extrabold text-[#F4F5F6]">Daily meals</h3>
      </div>

      <div className="space-y-3">
        {mealTypes.map((mealType) => {
          const config = MEAL_CONFIG[mealType];
          const portionTarget = mealTargetMap[mealType];
          const mealEntries = entries.filter((e) => e.mealType === mealType);
          const totalCal = mealEntries.reduce((s, e) => s + e.caloriesKcal, 0);

          let foodSummary = 'Belum ada makanan dicatat';
          let illustration = config.defaultIllustration;

          if (mealEntries.length > 0) {
            foodSummary = mealEntries.map((e) => e.foodName).slice(0, 2).join(', ');
            if (mealEntries.length > 2) {
              foodSummary += ` +${mealEntries.length - 2} lainnya`;
            }
            illustration = resolveFoodType(mealEntries[0].foodName, config.defaultIllustration as any);
          }

          return (
            <div
              key={mealType}
              onClick={() => onSelectMealDetail(mealType)}
              className="relative overflow-hidden rounded-2xl bg-[#202326] p-4 shadow-card border border-[#2D3134] flex items-center justify-between gap-4 cursor-pointer hover:bg-[#292D30] hover:border-[#D6FF3F]/40 active:scale-[0.99] transition-all group"
            >
              {/* Left Details */}
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-bold uppercase tracking-wider ${config.titleColor}`}>
                  {MEAL_TYPE_LABELS[mealType]}
                </span>
                <h4 className="text-sm font-bold text-[#F4F5F6] mt-0.5 truncate">
                  {foodSummary}
                </h4>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-base font-black text-[#F4F5F6]">
                    {totalCal}
                  </span>
                  <span className="text-xs font-semibold text-[#747C83]">
                    / {portionTarget} KCAL
                  </span>
                </div>
              </div>

              {/* Right: 3D Food Illustration & Quick Add */}
              <div className="flex items-center gap-2.5">
                <div className="w-16 h-16 rounded-2xl bg-[#292D30] border border-[#383D41] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FoodIllustration name={illustration} size={48} />
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAdd(mealType);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D6FF3F]/15 text-[#D6FF3F] hover:bg-[#D6FF3F] hover:text-[#17191B] border border-[#D6FF3F]/30 active:scale-95 transition-all shadow-xs"
                  aria-label={`Tambah makanan ke ${mealType}`}
                >
                  <Plus className="h-5 w-5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
