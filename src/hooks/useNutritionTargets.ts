'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NutritionTarget } from '@/types';
import * as storage from '@/lib/database/storage';
import { today } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export function useNutritionTargets(date?: string) {
  const targetDate = date ?? today();
  const [activeTarget, setActiveTarget] = useState<NutritionTarget | null>(null);
  const [allTargets, setAllTargets] = useState<NutritionTarget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();

  const reload = useCallback(() => {
    setActiveTarget(storage.getActiveNutritionTarget(targetDate));
    setAllTargets(storage.getNutritionTargets());
    setIsLoading(false);
  }, [targetDate]);

  useEffect(() => {
    reload();
  }, [reload, user?.id]); // Reload saat user login atau berubah

  const saveTarget = useCallback(
    (target: Omit<NutritionTarget, 'id' | 'createdAt'>) => {
      const saved = storage.saveNutritionTarget(target);
      reload();
      return saved;
    },
    [reload],
  );

  return {
    activeTarget,
    allTargets,
    isLoading,
    saveTarget,
    reload,
  };
}
