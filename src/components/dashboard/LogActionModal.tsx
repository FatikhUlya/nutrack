'use client';

import { useState } from 'react';
import {
  X,
  Utensils,
  Scale,
  Plus,
} from 'lucide-react';
import type { MealType, FoodEntry, NutritionTarget } from '@/types';
import { saveWeightEntry } from '@/lib/database/storage';
import { today } from '@/lib/utils';

interface LogActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: FoodEntry[];
  target: NutritionTarget | null;
  onSelectMeal: (mealType: MealType) => void;
  onUpdateWeight?: (weightKg: number) => void;
  currentWeightKg?: number;
}

type LogTab = 'meal' | 'weight';

export function LogActionModal({
  isOpen,
  onClose,
  entries,
  target,
  onSelectMeal,
  onUpdateWeight,
  currentWeightKg = 70,
}: LogActionModalProps) {
  const [activeTab, setActiveTab] = useState<LogTab>('meal');
  const [weight, setWeight] = useState<number>(currentWeightKg);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const targetCalories = target?.calorieTargetKcal ?? 2000;
  const mealBudgets: Record<MealType, number> = {
    breakfast: Math.round(targetCalories * 0.25),
    lunch: Math.round(targetCalories * 0.35),
    dinner: Math.round(targetCalories * 0.30),
    snack: Math.round(targetCalories * 0.10),
  };

  const mealConsumed: Record<MealType, number> = {
    breakfast: entries.filter((e) => e.mealType === 'breakfast').reduce((s, e) => s + e.caloriesKcal, 0),
    lunch: entries.filter((e) => e.mealType === 'lunch').reduce((s, e) => s + e.caloriesKcal, 0),
    dinner: entries.filter((e) => e.mealType === 'dinner').reduce((s, e) => s + e.caloriesKcal, 0),
    snack: entries.filter((e) => e.mealType === 'snack').reduce((s, e) => s + e.caloriesKcal, 0),
  };

  const getMealCardStatus = (meal: MealType) => {
    const budget = mealBudgets[meal];
    const consumed = mealConsumed[meal];
    const diff = consumed - budget;

    if (diff > 0) {
      return {
        isOver: true,
        text: `${diff}kcal over`,
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        textColor: 'text-[#FF6B73]',
      };
    } else {
      const remaining = Math.abs(diff);
      return {
        isOver: false,
        text: `${remaining}kcal left`,
        bg: 'bg-[#292D30]',
        border: 'border-[#383D41]',
        textColor: 'text-[#D6FF3F]',
      };
    }
  };

  const handleSaveWeight = () => {
    saveWeightEntry(weight, today());
    if (onUpdateWeight) onUpdateWeight(weight);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in font-sans">
      {/* Modal Container */}
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#202326] border border-[#2D3134] p-6 shadow-2xl flex flex-col animate-slide-up sm:animate-fade-in text-[#F4F5F6]">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-black text-[#F4F5F6]">Log</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#17191B] hover:bg-[#292D30] text-[#747C83] hover:text-[#F4F5F6] transition-all"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Segmented Control Tabs (Meal | Weight) */}
        <div className="flex items-center p-1 bg-[#17191B] border border-[#2D3134] rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('meal')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'meal'
                ? 'bg-[#292D30] text-[#D6FF3F] shadow-neon-glow'
                : 'text-[#747C83] hover:text-[#F4F5F6]'
            }`}
          >
            <Utensils className="h-3.5 w-3.5 text-[#D6FF3F]" />
            <span>Meal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('weight')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'weight'
                ? 'bg-[#292D30] text-[#65D99A] shadow-xs'
                : 'text-[#747C83] hover:text-[#F4F5F6]'
            }`}
          >
            <Scale className="h-3.5 w-3.5 text-[#65D99A]" />
            <span>Berat Badan</span>
          </button>
        </div>

        {/* ========================================= */}
        {/* TAB 1: MEAL 2x2 GRID                      */}
        {/* ========================================= */}
        {activeTab === 'meal' && (
          <div className="grid grid-cols-2 gap-3.5">
            {/* Breakfast */}
            {(() => {
              const status = getMealCardStatus('breakfast');
              return (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectMeal('breakfast');
                  }}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${status.bg} ${status.border}`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#D6FF3F] text-[#17191B] flex items-center justify-center mb-2.5 shadow-neon-glow font-black">
                    <Plus className="h-5 w-5 stroke-[3]" />
                  </div>
                  <span className="text-sm font-extrabold text-[#F4F5F6]">Sarapan</span>
                  <span className={`text-[11px] font-bold mt-0.5 ${status.textColor}`}>
                    {status.text}
                  </span>
                </button>
              );
            })()}

            {/* Snack */}
            {(() => {
              const status = getMealCardStatus('snack');
              return (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectMeal('snack');
                  }}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${status.bg} ${status.border}`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#D6FF3F] text-[#17191B] flex items-center justify-center mb-2.5 shadow-neon-glow font-black">
                    <Plus className="h-5 w-5 stroke-[3]" />
                  </div>
                  <span className="text-sm font-extrabold text-[#F4F5F6]">Camilan</span>
                  <span className={`text-[11px] font-bold mt-0.5 ${status.textColor}`}>
                    {status.text}
                  </span>
                </button>
              );
            })()}

            {/* Lunch */}
            {(() => {
              const status = getMealCardStatus('lunch');
              return (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectMeal('lunch');
                  }}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${status.bg} ${status.border}`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#D6FF3F] text-[#17191B] flex items-center justify-center mb-2.5 shadow-neon-glow font-black">
                    <Plus className="h-5 w-5 stroke-[3]" />
                  </div>
                  <span className="text-sm font-extrabold text-[#F4F5F6]">Makan Siang</span>
                  <span className={`text-[11px] font-bold mt-0.5 ${status.textColor}`}>
                    {status.text}
                  </span>
                </button>
              );
            })()}

            {/* Dinner */}
            {(() => {
              const status = getMealCardStatus('dinner');
              return (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectMeal('dinner');
                  }}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${status.bg} ${status.border}`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#D6FF3F] text-[#17191B] flex items-center justify-center mb-2.5 shadow-neon-glow font-black">
                    <Plus className="h-5 w-5 stroke-[3]" />
                  </div>
                  <span className="text-sm font-extrabold text-[#F4F5F6]">Makan Malam</span>
                  <span className={`text-[11px] font-bold mt-0.5 ${status.textColor}`}>
                    {status.text}
                  </span>
                </button>
              );
            })()}
          </div>
        )}

        {/* ========================================= */}
        {/* TAB 2: WEIGHT TRACKER (synced to profile) */}
        {/* ========================================= */}
        {activeTab === 'weight' && (
          <div className="flex flex-col items-center py-2 space-y-5">
            <div className="text-center">
              <div className="text-3xl font-black text-[#65D99A]">{weight.toFixed(1)} kg</div>
              <div className="text-xs font-semibold text-[#747C83] mt-1">
                Catat berat badan terkini · tersinkronisasi ke profil
              </div>
            </div>

            {/* Increment/Decrement */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setWeight((w) => Number((w - 0.5).toFixed(1)))}
                className="h-11 w-11 rounded-full bg-[#17191B] border border-[#383D41] flex items-center justify-center text-[#F4F5F6] hover:border-[#65D99A] font-bold text-lg transition-colors"
              >
                −
              </button>
              <input
                type="number"
                step="0.1"
                min="20"
                max="300"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                className="w-28 text-center font-black text-2xl py-2 bg-[#17191B] border border-[#383D41] text-[#F4F5F6] rounded-xl focus:border-[#D6FF3F] focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setWeight((w) => Number((w + 0.5).toFixed(1)))}
                className="h-11 w-11 rounded-full bg-[#17191B] border border-[#383D41] flex items-center justify-center text-[#F4F5F6] hover:border-[#65D99A] font-bold text-lg transition-colors"
              >
                +
              </button>
            </div>

            {/* Quick presets */}
            <div className="flex gap-2">
              {[-2, -1, +1, +2].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => setWeight((w) => Number((w + delta).toFixed(1)))}
                  className="px-3 py-1.5 rounded-lg bg-[#17191B] border border-[#383D41] text-[#A7ADB3] hover:border-[#65D99A] hover:text-[#65D99A] text-xs font-bold transition-colors"
                >
                  {delta > 0 ? `+${delta}` : delta} kg
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveWeight}
              disabled={saved}
              className={`w-full py-3 rounded-2xl font-bold text-sm shadow-neon-glow transition-all ${
                saved
                  ? 'bg-[#65D99A] text-[#17191B]'
                  : 'bg-[#D6FF3F] text-[#17191B] hover:bg-[#C7F02D]'
              }`}
            >
              {saved ? '✓ Tersimpan!' : 'Simpan Berat Badan'}
            </button>

            <p className="text-[10px] text-[#747C83] text-center">
              Data berat badan akan disimpan ke riwayat dan diperbarui di profil Anda
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
