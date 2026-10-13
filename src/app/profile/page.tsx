'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { FoodScannerModal } from '@/components/scanner/FoodScannerModal';
import { FoodEntryModal } from '@/components/food/FoodEntryModal';
import { ConfirmationDialog } from '@/components/ui/Dialog';
import { ToastContainer } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { useProfile } from '@/hooks/useProfile';
import { useNutritionTargets } from '@/hooks/useNutritionTargets';
import { useFoodDiary } from '@/hooks/useFoodDiary';
import { useToast } from '@/hooks/useToast';
import { calculateNutritionTargets } from '@/lib/nutrition/calculator';
import { clearAllData } from '@/lib/database/storage';
import { seedInitialDataIfEmpty } from '@/lib/database/seed';
import { today } from '@/lib/utils';
import type { UserProfile, CreateFoodEntryInput } from '@/types';
import { User, Trash2, RotateCcw } from 'lucide-react';

export default function ProfilePage() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const { profile, saveProfile } = useProfile();
  const { saveTarget, reload: reloadTargets } = useNutritionTargets(today());
  const { addEntry, reload: reloadDiary } = useFoodDiary(today());
  const { toasts, removeToast, showSuccess, showWarning } = useToast();

  const handleSaveProfile = (data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    // 1. Save Profile
    const saved = saveProfile(data);

    // 2. Compute new nutrition target
    const calc = calculateNutritionTargets(saved);

    // 3. Save new nutrition target for today onward
    saveTarget({
      userId: saved.id,
      effectiveDate: today(),
      bmrKcal: calc.bmrKcal,
      tdeeKcal: calc.tdeeKcal,
      calorieTargetKcal: calc.calorieTargetKcal,
      proteinTargetG: calc.proteinTargetG,
      carbsTargetG: calc.carbsTargetG,
      fatTargetG: calc.fatTargetG,
      calculationVersion: '1.0.0',
      goal: saved.goal,
    });

    showSuccess('Profil & Target Disimpan', 'Target nutrisi baru telah diaktifkan untuk hari ini dan seterusnya.');
  };

  const handleResetData = () => {
    clearAllData();
    seedInitialDataIfEmpty();
    reloadDiary();
    reloadTargets();
    window.location.reload();
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-accent" />
              <h1 className="text-xl font-bold text-text-primary">Profil & Perhitungan Target</h1>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Atur parameter fisik Anda untuk menghitung BMR, TDEE, serta alokasi target makronutrien ilmiah
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsResetConfirmOpen(true)}
            className="text-xs text-text-muted hover:text-danger hover:bg-danger/10 gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset ke Data Demo
          </Button>
        </div>

        <ProfileForm
          initialProfile={profile}
          onSave={handleSaveProfile}
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

      <ConfirmationDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetData}
        title="Reset Semua Data?"
        message="Tindakan ini akan menghapus semua riwayat catatan makanan lokal Anda dan memuat ulang data profil demo awal."
        confirmText="Ya, Reset Data"
        cancelText="Batal"
        variant="destructive"
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
