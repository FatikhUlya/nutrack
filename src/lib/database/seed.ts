/**
 * Starter food database & seed configuration for NUTRACK.
 */

import type { SavedFood } from '@/types';

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
  // Dummy seeding dinonaktifkan permanen — setiap akun baru mulai dengan buku harian bersih.
  return false;
}
