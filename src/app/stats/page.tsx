'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { FoodScannerModal } from '@/components/scanner/FoodScannerModal';
import { FoodEntryModal } from '@/components/food/FoodEntryModal';
import { ToastContainer } from '@/components/ui/Toast';

const StatsView = dynamic(
  () => import('@/components/stats/StatsView').then((mod) => mod.StatsView),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6 font-sans text-[#F4F5F6] animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#202326] p-5 rounded-3xl border border-[#2D3134]">
          <div className="space-y-2">
            <div className="h-6 w-52 bg-[#292D30] rounded-xl" />
            <div className="h-3 w-40 bg-[#292D30] rounded-lg" />
          </div>
          <div className="h-10 w-64 bg-[#292D30] rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#202326] rounded-3xl border border-[#2D3134]" />
          ))}
        </div>
      </div>
    ),
  }
);
import { useNutritionTargets } from '@/hooks/useNutritionTargets';
import { useFoodDiary } from '@/hooks/useFoodDiary';
import { useToast } from '@/hooks/useToast';
import { today } from '@/lib/utils';
import type { CreateFoodEntryInput } from '@/types';

export default function StatsPage() {
  const router = useRouter();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

  const { activeTarget } = useNutritionTargets(today());
  const { addEntry } = useFoodDiary(today());
  const { toasts, removeToast, showSuccess } = useToast();

  const handleSelectDate = (date: string) => {
    // Navigate to dashboard for that date
    router.push(`/?date=${date}`);
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

      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-6">
        <StatsView
          activeTarget={activeTarget}
          onSelectDate={handleSelectDate}
        />
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
