'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FoodEntry, CreateFoodEntryInput, UpdateFoodEntryInput, MealType } from '@/types';
import * as storage from '@/lib/database/storage';
import { today } from '@/lib/utils';

export function useFoodDiary(date?: string) {
  const targetDate = date ?? today();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(() => {
    setEntries(storage.getFoodEntriesByDate(targetDate));
    setIsLoading(false);
  }, [targetDate]);

  useEffect(() => {
    setIsLoading(true);
    reload();
  }, [reload]);

  const addEntry = useCallback(
    (input: CreateFoodEntryInput) => {
      const userId = 'local'; // placeholder until auth is added
      const entry = storage.createFoodEntry({ ...input, userId });
      setEntries(prev => [...prev, entry]);
      return entry;
    },
    [],
  );

  const updateEntry = useCallback(
    (id: string, updates: UpdateFoodEntryInput) => {
      const updated = storage.updateFoodEntry(id, updates);
      if (updated) {
        setEntries(prev => prev.map(e => (e.id === id ? updated : e)));
      }
      return updated;
    },
    [],
  );

  const deleteEntry = useCallback((id: string) => {
    const deleted = storage.deleteFoodEntry(id);
    if (deleted) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
    return deleted;
  }, []);

  // Aggregate totals
  const totals = entries.reduce(
    (acc, e) => ({
      caloriesKcal: acc.caloriesKcal + e.caloriesKcal,
      proteinG: acc.proteinG + e.proteinG,
      carbsG: acc.carbsG + e.carbsG,
      fatG: acc.fatG + e.fatG,
    }),
    { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  // Grouped by meal type
  const byMeal = entries.reduce<Record<MealType, FoodEntry[]>>(
    (acc, e) => {
      acc[e.mealType] = [...(acc[e.mealType] ?? []), e];
      return acc;
    },
    { breakfast: [], lunch: [], dinner: [], snack: [] },
  );

  return {
    entries,
    totals,
    byMeal,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
    reload,
  };
}
