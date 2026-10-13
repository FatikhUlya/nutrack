'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { SavedFoodsManager } from '@/components/saved/SavedFoodsManager';
import { FoodScannerModal } from '@/components/scanner/FoodScannerModal';
import { FoodEntryModal } from '@/components/food/FoodEntryModal';
import { ToastContainer } from '@/components/ui/Toast';
import { useFoodDiary } from '@/hooks/useFoodDiary';
import { useToast } from '@/hooks/useToast';
import { today } from '@/lib/utils';
import type { SavedFood, MealType, CreateFoodEntryInput } from '@/types';
import { Bookmark } from 'lucide-react';

export default function SavedFoodsPage() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

  const { addEntry } = useFoodDiary(today());
  const { toasts, removeToast, showSuccess } = useToast();

  const handleLogSavedFood = (food: SavedFood, mealType: MealType) => {
    addEntry({
      consumptionDate: today(),
      mealType,
      foodName: food.foodName,
      quantity: food.defaultQuantity,
      servingUnit: food.servingUnit,
      caloriesKcal: food.caloriesKcal,
      proteinG: food.proteinG,
      carbsG: food.carbsG,
      fatG: food.fatG,
      source: 'saved',
      aiEstimated: false,
      notes: food.notes,
    });

    showSuccess('Berhasil Dicatat', `${food.foodName} ditambahkan ke ${mealType} hari ini.`);
  };

  const handleSaveScannedItems = (items: CreateFoodEntryInput[]) => {
    items.forEach(item => addEntry(item));
    showSuccess('AI Scan Berhasil', `${items.length} item makanan dicatat.`);
  };

  const handleSaveFood = (input: CreateFoodEntryInput) => {
    addEntry(input);
    showSuccess('Makanan Dicatat', `${input.foodName} berhasil dicatat.`);
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary pb-24 md:pb-12">
      <Navbar
        onOpenQuickAdd={() => setIsEntryModalOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 space-y-6">
        <div className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-accent" />
            <h1 className="text-xl font-bold text-text-primary">Koleksi Makanan Tersimpan</h1>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Kelola database makanan favorit dan cepat catat ke dalam buku harian nutrisi
          </p>
        </div>

        <SavedFoodsManager onLogFood={handleLogSavedFood} />
      </main>

      <FoodEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        consumptionDate={today()}
        onSave={handleSaveFood}
      />

      <FoodScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        consumptionDate={today()}
        onSaveItems={handleSaveScannedItems}
      />

      <BottomNav
        onOpenLogModal={() => setIsEntryModalOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenMealSelection={() => setIsEntryModalOpen(true)}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
