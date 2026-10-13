'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { DateNavigator } from '@/components/dashboard/DateNavigator';
import { CalorieSummaryCard } from '@/components/dashboard/CalorieSummaryCard';
import { DailyMealsList } from '@/components/dashboard/DailyMealsList';
import { FoodScannerModal } from '@/components/scanner/FoodScannerModal';
import { FoodSearchModal } from '@/components/food/FoodSearchModal';
import { LogActionModal } from '@/components/dashboard/LogActionModal';
import { MealDetailModal } from '@/components/dashboard/MealDetailModal';
import { ToastContainer } from '@/components/ui/Toast';
import { useFoodDiary } from '@/hooks/useFoodDiary';
import { useNutritionTargets } from '@/hooks/useNutritionTargets';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/useToast';
import { seedInitialDataIfEmpty } from '@/lib/database/seed';
import { today } from '@/lib/utils';
import type { MealType, CreateFoodEntryInput } from '@/types';
import { Scan, Sparkles, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<string>(today());

  // Modal States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isFoodSearchOpen, setIsFoodSearchOpen] = useState(false);
  const [isMealDetailOpen, setIsMealDetailOpen] = useState(false);

  const [activeMealType, setActiveMealType] = useState<MealType>('breakfast');
  const [detailMealType, setDetailMealType] = useState<MealType>('lunch');

  const { toasts, removeToast, showSuccess, showError } = useToast();
  const { profile, updateProfile } = useProfile();
  const { activeTarget } = useNutritionTargets(selectedDate);
  const { entries, totals, byMeal, addEntry, deleteEntry } = useFoodDiary(selectedDate);

  useEffect(() => {
    seedInitialDataIfEmpty();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const dateParam = params.get('date');
      if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        setSelectedDate(dateParam);
      }
    }
  }, []);

  // Open Log Modal (from Central FAB or quick action)
  const handleOpenLogModal = () => {
    setIsLogModalOpen(true);
  };

  // Open Food Search for a specific meal (from Log Modal 2x2 grid or '+' button)
  const handleOpenFoodSearch = (mealType: MealType = 'breakfast') => {
    setActiveMealType(mealType);
    setIsFoodSearchOpen(true);
  };

  // Open Meal Detail view (from Daily Meals Card click)
  const handleOpenMealDetail = (mealType: MealType) => {
    setDetailMealType(mealType);
    setIsMealDetailOpen(true);
  };

  // Save items from FoodSearchModal or FoodScannerModal
  const handleSaveScannedItems = (items: CreateFoodEntryInput[]) => {
    try {
      items.forEach((item) => {
        addEntry(item);
      });
      showSuccess('Makanan Dicatat', `${items.length} item berhasil ditambahkan ke buku harian.`);
    } catch {
      showError('Gagal Menyimpan', 'Terjadi kesalahan saat menambahkan catatan makanan.');
    }
  };

  const handleDeleteFood = (id: string) => {
    try {
      deleteEntry(id);
      showSuccess('Dihapus', 'Item makanan telah dihapus.');
    } catch {
      showError('Gagal Menghapus', 'Gagal menghapus item makanan.');
    }
  };

  const handleUpdateWeight = (weightKg: number) => {
    if (profile) {
      updateProfile({ weightKg });
      showSuccess('Berat Badan Diperbarui', `Berat badan dicatat: ${weightKg} kg.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#17191B] text-[#F4F5F6] pb-28 md:pb-12 font-sans">
      {/* Desktop Top Navbar */}
      <Navbar
        onOpenQuickAdd={() => handleOpenFoodSearch('lunch')}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Main Container - Responsive layout (Phone frame on mobile, expanded dashboard on laptop) */}
      <main className="mx-auto max-w-md md:max-w-4xl lg:max-w-5xl px-4 sm:px-6 pt-4 space-y-4">
        {/* Date Navigator & App Header */}
        <DateNavigator
          currentDate={selectedDate}
          onDateChange={(d) => setSelectedDate(d)}
        />

        {/* Laptop / Desktop Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Main Hero Card Column */}
          <div className="md:col-span-7 lg:col-span-8 space-y-4">
            {/* Calorie Hero Gauge Card in Neon Dark Mode */}
            <CalorieSummaryCard
              caloriesConsumed={totals.caloriesKcal}
              proteinConsumed={totals.proteinG}
              carbsConsumed={totals.carbsG}
              fatConsumed={totals.fatG}
              target={activeTarget}
              caloriesBurned={108}
            />

            {/* Quick AI Camera Banner - Neon Glow Card */}
            <div
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-4 rounded-2xl bg-[#202326] p-4 cursor-pointer shadow-card border border-[#D6FF3F]/30 hover:border-[#D6FF3F] hover:shadow-neon-glow active:scale-[0.99] transition-all group"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D6FF3F]/15 border border-[#D6FF3F]/30 text-[#D6FF3F] group-hover:scale-105 transition-transform">
                <Scan className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-extrabold text-[#F4F5F6] flex items-center gap-1.5">
                  <span>AI Camera Food Scanner</span>
                  <Sparkles className="h-3.5 w-3.5 text-[#D6FF3F]" />
                </div>
                <div className="text-xs text-[#A7ADB3] truncate mt-0.5">
                  Foto makanan & biarkan Gemini AI menganalisis makronutrisi otomatis
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D6FF3F]/15 text-[#D6FF3F] group-hover:bg-[#D6FF3F] group-hover:text-[#17191B] transition-all">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>

            {/* Daily Meals List (Breakfast, Lunch, Dinner, Snack cards) */}
            <DailyMealsList
              entries={entries}
              target={activeTarget}
              onSelectMealDetail={handleOpenMealDetail}
              onQuickAdd={handleOpenFoodSearch}
            />
          </div>

          {/* Desktop Sidebar Column for quick targets & profile */}
          <div className="hidden md:block md:col-span-5 lg:col-span-4 space-y-4">
            <div className="bg-[#202326] rounded-3xl p-5 shadow-card border border-[#2D3134] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[#F4F5F6]">Target Nutrisi Harian</h3>
                <span className="text-[11px] font-bold text-[#D6FF3F] bg-[#D6FF3F]/15 px-2.5 py-0.5 rounded-full border border-[#D6FF3F]/30">
                  {profile?.goal ? profile.goal.toUpperCase() : 'MAINTENANCE'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-[#2D3134]">
                  <span className="text-[#A7ADB3] font-medium">Target Kalori</span>
                  <span className="font-extrabold text-[#D6FF3F]">{activeTarget?.calorieTargetKcal ?? 2000} kcal</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-[#2D3134]">
                  <span className="text-[#A7ADB3] font-medium">Target Protein</span>
                  <span className="font-extrabold text-[#77B7FF]">{activeTarget?.proteinTargetG ?? 140}g</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-[#2D3134]">
                  <span className="text-[#A7ADB3] font-medium">Target Karbohidrat</span>
                  <span className="font-extrabold text-[#67E8F9]">{activeTarget?.carbsTargetG ?? 220}g</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-[#A7ADB3] font-medium">Target Lemak</span>
                  <span className="font-extrabold text-[#C4B5FD]">{activeTarget?.fatTargetG ?? 65}g</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenLogModal}
                className="w-full py-3 rounded-2xl bg-[#D6FF3F] text-[#17191B] font-bold text-xs shadow-neon-glow hover:bg-[#C7F02D] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <span>Catat Makanan / Minuman</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}

      {/* 1. Camera AI Scanner Modal */}
      <FoodScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        consumptionDate={selectedDate}
        defaultMealType={activeMealType}
        onSaveItems={handleSaveScannedItems}
      />

      {/* 2. Log Bottom Sheet Modal (Meal 2x2 grid, Water, Weight) */}
      <LogActionModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        entries={entries}
        target={activeTarget}
        onSelectMeal={(m) => handleOpenFoodSearch(m)}
        onUpdateWeight={handleUpdateWeight}
        currentWeightKg={profile?.weightKg ?? 70}
      />

      {/* 3. Food Search & Recently Had Modal */}
      <FoodSearchModal
        isOpen={isFoodSearchOpen}
        onClose={() => setIsFoodSearchOpen(false)}
        mealType={activeMealType}
        consumptionDate={selectedDate}
        onAddEntries={handleSaveScannedItems}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* 4. Meal Detail View Modal */}
      <MealDetailModal
        isOpen={isMealDetailOpen}
        onClose={() => setIsMealDetailOpen(false)}
        mealType={detailMealType}
        entries={byMeal[detailMealType] || []}
        target={activeTarget}
        onAddMore={(m) => handleOpenFoodSearch(m)}
        onDeleteEntry={handleDeleteFood}
      />

      {/* 5. Docked Mobile Bottom Navigation Bar */}
      <BottomNav
        onOpenLogModal={handleOpenLogModal}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenMealSelection={() => handleOpenFoodSearch('lunch')}
      />

      {/* Toast Notification Popups */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
