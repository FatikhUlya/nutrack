'use client';

import { Plus, Trash2, Edit3, Sparkles, Coffee, Sun, Moon, Apple } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { FoodEntry, MealType } from '@/types';
import { MEAL_TYPE_LABELS } from '@/types';

interface MealSectionProps {
  mealType: MealType;
  entries: FoodEntry[];
  onAddFood: (mealType: MealType) => void;
  onEditFood?: (entry: FoodEntry) => void;
  onDeleteFood?: (id: string) => void;
}

const MEAL_ICONS: Record<MealType, React.ElementType> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Apple,
};

const MEAL_COLORS: Record<MealType, { bg: string; text: string; border: string; iconBg: string }> = {
  breakfast: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-100',
    iconBg: 'bg-orange-100',
  },
  lunch: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    border: 'border-yellow-100',
    iconBg: 'bg-yellow-100',
  },
  dinner: {
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    border: 'border-violet-100',
    iconBg: 'bg-violet-100',
  },
  snack: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-100',
    iconBg: 'bg-green-100',
  },
};

// Simple food emoji icons
const FOOD_EMOJIS = ['🍚', '🍗', '🥗', '🍜', '🥩', '🥦', '🍳', '🌮', '🍱', '🥙', '🍝', '🥐'];
function getFoodEmoji(name: string) {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return FOOD_EMOJIS[hash % FOOD_EMOJIS.length];
}

export function MealSection({
  mealType,
  entries,
  onAddFood,
  onEditFood,
  onDeleteFood,
}: MealSectionProps) {
  const Icon = MEAL_ICONS[mealType];
  const title = MEAL_TYPE_LABELS[mealType];
  const colors = MEAL_COLORS[mealType];

  const totalCalories = entries.reduce((s, e) => s + e.caloriesKcal, 0);
  const totalProtein = entries.reduce((s, e) => s + e.proteinG, 0);
  const totalCarbs = entries.reduce((s, e) => s + e.carbsG, 0);
  const totalFat = entries.reduce((s, e) => s + e.fatG, 0);

  return (
    <div className={`overflow-hidden rounded-2xl bg-white shadow-card border ${colors.border} transition-all hover:shadow-elevated`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3.5 ${colors.bg} border-b ${colors.border}`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors.iconBg}`}>
            <Icon className={`h-5 w-5 ${colors.text}`} />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${colors.text}`}>{title}</h3>
            <p className="text-[11px] text-text-muted">
              {entries.length === 0 ? 'Belum ada catatan' : `${entries.length} item`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {entries.length > 0 && (
            <div className="text-right">
              <div className={`text-sm font-extrabold ${colors.text}`}>
                {formatNumber(Math.round(totalCalories))} kcal
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-text-muted">
                <span>P:{Math.round(totalProtein)}g</span>
                <span>C:{Math.round(totalCarbs)}g</span>
                <span>F:{Math.round(totalFat)}g</span>
              </div>
            </div>
          )}

          <button
            onClick={() => onAddFood(mealType)}
            className={`flex h-8 w-8 items-center justify-center rounded-full ${colors.text} ${colors.iconBg} transition-all hover:scale-110 active:scale-95 border ${colors.border}`}
            aria-label={`Tambah ${title}`}
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Food Entries */}
      <div>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
            <div className="text-3xl mb-2 opacity-40">
              {mealType === 'breakfast' ? '🍳' : mealType === 'lunch' ? '🥗' : mealType === 'dinner' ? '🌙' : '🍎'}
            </div>
            <p className="text-xs text-text-muted">Belum ada makanan untuk {title.toLowerCase()}</p>
            <button
              onClick={() => onAddFood(mealType)}
              className="mt-2 text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Tambah sekarang
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {entries.map(entry => (
              <div
                key={entry.id}
                className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-bg/80"
              >
                {/* Food Icon + Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Emoji food icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg border border-border text-xl">
                    {getFoodEmoji(entry.foodName)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-text-primary truncate">
                        {entry.foodName}
                      </span>
                      {entry.aiEstimated && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] font-bold text-brand border border-brand/20 shrink-0">
                          <Sparkles className="h-2.5 w-2.5" />
                          AI
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-text-muted mt-0.5">
                      {entry.quantity} {entry.servingUnit}
                      {entry.weightGrams && ` · ${entry.weightGrams}g`}
                    </div>
                  </div>
                </div>

                {/* Calories + Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold text-text-primary">
                      {formatNumber(Math.round(entry.caloriesKcal))} <span className="text-[10px] font-normal text-text-muted">kcal</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-text-muted">
                      <span className="text-blue-400">C{Math.round(entry.carbsG)}g</span>
                      <span className="text-violet-400">P{Math.round(entry.proteinG)}g</span>
                      <span className="text-orange-400">F{Math.round(entry.fatG)}g</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEditFood && (
                      <button
                        onClick={() => onEditFood(entry)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-bg hover:text-text-primary transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {onDeleteFood && (
                      <button
                        onClick={() => onDeleteFood(entry.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-danger/10 hover:text-danger transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
