/**
 * Seed initial sample data for NUTRACK if local storage is empty.
 * Provides realistic Indonesian fitness meals, user profile, and history.
 */

import type { UserProfile, NutritionTarget, FoodEntry, SavedFood } from '@/types';
import * as storage from './storage';
import { calculateNutritionTargets } from '../nutrition/calculator';
import { toDateString } from '../utils';

export const STARTER_SAVED_FOODS: Omit<SavedFood, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    foodName: 'Dada Ayam Panggang',
    defaultQuantity: 150,
    servingUnit: 'gram',
    caloriesKcal: 247,
    proteinG: 46.5,
    carbsG: 0,
    fatG: 5.4,
    notes: 'Dada ayam tanpa kulit, dipanggang dengan sedikit olive oil',
  },
  {
    foodName: 'Nasi Putih Pulen',
    defaultQuantity: 150,
    servingUnit: 'gram',
    caloriesKcal: 195,
    proteinG: 3.8,
    carbsG: 42.8,
    fatG: 0.4,
    notes: '1 mangkuk sedang nasi putih matang',
  },
  {
    foodName: 'Telur Rebus Utuh',
    defaultQuantity: 2,
    servingUnit: 'butir',
    caloriesKcal: 155,
    proteinG: 12.6,
    carbsG: 1.1,
    fatG: 10.6,
    notes: '2 butir telur ayam rebus matang',
  },
  {
    foodName: 'Tempe Bacem Panggang',
    defaultQuantity: 100,
    servingUnit: 'gram',
    caloriesKcal: 193,
    proteinG: 19.0,
    carbsG: 9.4,
    fatG: 11.0,
    notes: 'Tempe berbumbu manis dipanggang tanpa minyak banyak',
  },
  {
    foodName: 'Oatmeal & Susu Skim',
    defaultQuantity: 60,
    servingUnit: 'gram',
    caloriesKcal: 230,
    proteinG: 10.5,
    carbsG: 40.0,
    fatG: 3.2,
    notes: 'Rolled oats dimasak dengan 200ml susu rendah lemak',
  },
  {
    foodName: 'Pisang Cavendish',
    defaultQuantity: 1,
    servingUnit: 'buah',
    caloriesKcal: 105,
    proteinG: 1.3,
    carbsG: 27.0,
    fatG: 0.3,
    notes: 'Pisang ukuran sedang (sekitar 118 gram)',
  },
  {
    foodName: 'Whey Protein Shake',
    defaultQuantity: 1,
    servingUnit: 'scoop (32g)',
    caloriesKcal: 120,
    proteinG: 24.0,
    carbsG: 2.0,
    fatG: 1.5,
    notes: '1 scoop dilarutkan dalam 250ml air dingin',
  },
  {
    foodName: 'Tumis Kangkung Terasi',
    defaultQuantity: 150,
    servingUnit: 'gram',
    caloriesKcal: 95,
    proteinG: 3.0,
    carbsG: 5.5,
    fatG: 7.0,
    notes: 'Kangkung tumis dengan cabai dan terasi',
  },
];

export function seedInitialDataIfEmpty(): boolean {
  if (typeof window === 'undefined') return false;

  const existingProfile = storage.getProfile();
  if (existingProfile) {
    return false; // already initialized
  }

  // 1. Create Default Profile
  const sampleProfile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
    displayName: 'Alex Wijaya',
    sex: 'male',
    age: 26,
    weightKg: 70,
    heightCm: 175,
    bodyFatPercent: 15,
    activityLevel: 'moderate',
    goal: 'lean_bulk',
  };

  const profile = storage.saveProfile(sampleProfile);

  // 2. Calculate Targets
  const calc = calculateNutritionTargets(profile);
  const todayStr = toDateString(new Date());

  storage.saveNutritionTarget({
    userId: profile.id,
    effectiveDate: todayStr,
    bmrKcal: calc.bmrKcal,
    tdeeKcal: calc.tdeeKcal,
    calorieTargetKcal: calc.calorieTargetKcal,
    proteinTargetG: calc.proteinTargetG,
    carbsTargetG: calc.carbsTargetG,
    fatTargetG: calc.fatTargetG,
    calculationVersion: '1.0.0',
    goal: profile.goal,
  });

  // 3. Populate Saved Foods
  STARTER_SAVED_FOODS.forEach(food => {
    storage.createSavedFood({
      ...food,
      userId: profile.id,
    });
  });

  // 4. Populate Sample Food Logs for the past 5 days + today
  const sampleDays = [
    { offset: 0, entries: [
      { mealType: 'breakfast', foodName: 'Oatmeal & Susu Skim', quantity: 60, servingUnit: 'gram', caloriesKcal: 230, proteinG: 10.5, carbsG: 40.0, fatG: 3.2, source: 'saved' as const, aiEstimated: false },
      { mealType: 'breakfast', foodName: 'Telur Rebus Utuh', quantity: 2, servingUnit: 'butir', caloriesKcal: 155, proteinG: 12.6, carbsG: 1.1, fatG: 10.6, source: 'saved' as const, aiEstimated: false },
      { mealType: 'lunch', foodName: 'Nasi Putih Pulen', quantity: 150, servingUnit: 'gram', caloriesKcal: 195, proteinG: 3.8, carbsG: 42.8, fatG: 0.4, source: 'saved' as const, aiEstimated: false },
      { mealType: 'lunch', foodName: 'Dada Ayam Panggang', quantity: 150, servingUnit: 'gram', caloriesKcal: 247, proteinG: 46.5, carbsG: 0, fatG: 5.4, source: 'saved' as const, aiEstimated: false },
      { mealType: 'lunch', foodName: 'Tumis Kangkung Terasi', quantity: 150, servingUnit: 'gram', caloriesKcal: 95, proteinG: 3.0, carbsG: 5.5, fatG: 7.0, source: 'saved' as const, aiEstimated: false },
      { mealType: 'snack', foodName: 'Whey Protein Shake', quantity: 1, servingUnit: 'scoop', caloriesKcal: 120, proteinG: 24.0, carbsG: 2.0, fatG: 1.5, source: 'saved' as const, aiEstimated: false },
      { mealType: 'snack', foodName: 'Pisang Cavendish', quantity: 1, servingUnit: 'buah', caloriesKcal: 105, proteinG: 1.3, carbsG: 27.0, fatG: 0.3, source: 'saved' as const, aiEstimated: false },
      { mealType: 'dinner', foodName: 'Nasi Merah & Ikan Salmon Grill', quantity: 1, servingUnit: 'porsi', caloriesKcal: 520, proteinG: 38.0, carbsG: 45.0, fatG: 18.0, source: 'scanner' as const, aiEstimated: true, estimationNotes: 'Dideteksi dari foto makan malam' },
    ]},
    { offset: 1, entries: [
      { mealType: 'breakfast', foodName: 'Roti Gandum & Selai Kacang', quantity: 2, servingUnit: 'lembar', caloriesKcal: 310, proteinG: 12.0, carbsG: 34.0, fatG: 14.0, source: 'manual' as const, aiEstimated: false },
      { mealType: 'lunch', foodName: 'Nasi Putih + Ayam Bakar Dada + Lalapan', quantity: 1, servingUnit: 'porsi', caloriesKcal: 580, proteinG: 48.0, carbsG: 55.0, fatG: 16.0, source: 'scanner' as const, aiEstimated: true },
      { mealType: 'snack', foodName: 'Yogurt Greek & Madu', quantity: 1, servingUnit: 'cup', caloriesKcal: 180, proteinG: 15.0, carbsG: 20.0, fatG: 4.0, source: 'manual' as const, aiEstimated: false },
      { mealType: 'dinner', foodName: 'Steak Daging Sapi Sirloin 150g', quantity: 1, servingUnit: 'porsi', caloriesKcal: 620, proteinG: 42.0, carbsG: 22.0, fatG: 38.0, source: 'manual' as const, aiEstimated: false },
    ]},
    { offset: 2, entries: [
      { mealType: 'breakfast', foodName: 'Oatmeal & Pisang', quantity: 1, servingUnit: 'mangkuk', caloriesKcal: 320, proteinG: 9.0, carbsG: 62.0, fatG: 4.0, source: 'manual' as const, aiEstimated: false },
      { mealType: 'lunch', foodName: 'Gado-gado Komplit Telur', quantity: 1, servingUnit: 'porsi', caloriesKcal: 490, proteinG: 22.0, carbsG: 48.0, fatG: 24.0, source: 'scanner' as const, aiEstimated: true },
      { mealType: 'dinner', foodName: 'Nasi Putih & Dada Ayam Rebus & Brokoli', quantity: 1, servingUnit: 'porsi', caloriesKcal: 510, proteinG: 45.0, carbsG: 50.0, fatG: 8.0, source: 'manual' as const, aiEstimated: false },
      { mealType: 'snack', foodName: 'Whey Protein Shake', quantity: 1, servingUnit: 'scoop', caloriesKcal: 120, proteinG: 24.0, carbsG: 2.0, fatG: 1.5, source: 'saved' as const, aiEstimated: false },
    ]},
    { offset: 3, entries: [
      { mealType: 'breakfast', foodName: 'Telur Orak Arik 3 Butir + Roti', quantity: 1, servingUnit: 'porsi', caloriesKcal: 380, proteinG: 22.0, carbsG: 28.0, fatG: 18.0, source: 'manual' as const, aiEstimated: false },
      { mealType: 'lunch', foodName: 'Soto Ayam Lamongan Nasi Separuh', quantity: 1, servingUnit: 'mangkuk', caloriesKcal: 450, proteinG: 32.0, carbsG: 44.0, fatG: 14.0, source: 'scanner' as const, aiEstimated: true },
      { mealType: 'dinner', foodName: 'Tempe & Tahu Panggang Sambal Matah', quantity: 1, servingUnit: 'porsi', caloriesKcal: 420, proteinG: 28.0, carbsG: 32.0, fatG: 20.0, source: 'manual' as const, aiEstimated: false },
      { mealType: 'snack', foodName: 'Apel Fuji', quantity: 1, servingUnit: 'buah', caloriesKcal: 95, proteinG: 0.5, carbsG: 25.0, fatG: 0.3, source: 'manual' as const, aiEstimated: false },
    ]},
    { offset: 4, entries: [
      { mealType: 'breakfast', foodName: 'Oatmeal & Susu Skim', quantity: 60, servingUnit: 'gram', caloriesKcal: 230, proteinG: 10.5, carbsG: 40.0, fatG: 3.2, source: 'saved' as const, aiEstimated: false },
      { mealType: 'lunch', foodName: 'Nasi Padang Ayam Pop + Daun Singkong', quantity: 1, servingUnit: 'porsi', caloriesKcal: 680, proteinG: 38.0, carbsG: 68.0, fatG: 26.0, source: 'scanner' as const, aiEstimated: true },
      { mealType: 'dinner', foodName: 'Sup Ayam Jagung & Telur', quantity: 1, servingUnit: 'mangkuk', caloriesKcal: 340, proteinG: 26.0, carbsG: 30.0, fatG: 9.0, source: 'manual' as const, aiEstimated: false },
    ]},
  ];

  sampleDays.forEach(day => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - day.offset);
    const dateStr = toDateString(targetDate);

    day.entries.forEach(e => {
      storage.createFoodEntry({
        userId: profile.id,
        consumptionDate: dateStr,
        mealType: e.mealType as any,
        foodName: e.foodName,
        quantity: e.quantity,
        servingUnit: e.servingUnit,
        caloriesKcal: e.caloriesKcal,
        proteinG: e.proteinG,
        carbsG: e.carbsG,
        fatG: e.fatG,
        source: e.source,
        aiEstimated: e.aiEstimated,
        estimationNotes: (e as any).estimationNotes,
      });
    });
  });

  return true;
}
