'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, NumberInput } from '@/components/ui/Input';
import { useSavedFoods } from '@/hooks/useSavedFoods';
import type { FoodEntry, CreateFoodEntryInput, MealType } from '@/types';
import { MEAL_TYPE_LABELS } from '@/types';
import { Sparkles, Bookmark, Calculator } from 'lucide-react';

interface FoodEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMealType?: MealType;
  editingEntry?: FoodEntry | null;
  consumptionDate: string;
  onSave: (entry: CreateFoodEntryInput, saveToFavorites?: boolean) => void;
}

export function FoodEntryModal({
  isOpen,
  onClose,
  defaultMealType = 'breakfast',
  editingEntry = null,
  consumptionDate,
  onSave,
}: FoodEntryModalProps) {
  const { savedFoods } = useSavedFoods();

  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [servingUnit, setServingUnit] = useState('porsi');
  const [weightGrams, setWeightGrams] = useState<number | string | undefined>(undefined);
  const [caloriesKcal, setCaloriesKcal] = useState<number | string>(0);
  const [proteinG, setProteinG] = useState<number | string>(0);
  const [carbsG, setCarbsG] = useState<number | string>(0);
  const [fatG, setFatG] = useState<number | string>(0);
  const [notes, setNotes] = useState('');
  const [saveToFavorites, setSaveToFavorites] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or fill form on open or editingEntry change
  useEffect(() => {
    if (editingEntry) {
      setMealType(editingEntry.mealType);
      setFoodName(editingEntry.foodName);
      setQuantity(editingEntry.quantity);
      setServingUnit(editingEntry.servingUnit);
      setWeightGrams(editingEntry.weightGrams);
      setCaloriesKcal(editingEntry.caloriesKcal);
      setProteinG(editingEntry.proteinG);
      setCarbsG(editingEntry.carbsG);
      setFatG(editingEntry.fatG);
      setNotes(editingEntry.notes ?? '');
      setSaveToFavorites(false);
    } else {
      setMealType(defaultMealType);
      setFoodName('');
      setQuantity(1);
      setServingUnit('porsi');
      setWeightGrams(undefined);
      setCaloriesKcal(0);
      setProteinG(0);
      setCarbsG(0);
      setFatG(0);
      setNotes('');
      setSaveToFavorites(false);
    }
    setErrors({});
  }, [isOpen, editingEntry, defaultMealType]);

  // Handle picking from saved foods
  const handleSelectSavedFood = (foodId: string) => {
    const item = savedFoods.find(f => f.id === foodId);
    if (!item) return;

    setFoodName(item.foodName);
    setQuantity(item.defaultQuantity);
    setServingUnit(item.servingUnit);
    setCaloriesKcal(item.caloriesKcal);
    setProteinG(item.proteinG);
    setCarbsG(item.carbsG);
    setFatG(item.fatG);
  };

  // Helper to calculate calories from macros: (P*4 + C*4 + F*9)
  const handleAutoCalcCalories = () => {
    const p = Number(proteinG) || 0;
    const c = Number(carbsG) || 0;
    const f = Number(fatG) || 0;
    const calc = Math.round(p * 4 + c * 4 + f * 9);
    setCaloriesKcal(calc);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!foodName.trim()) {
      newErrors.foodName = 'Nama makanan wajib diisi';
    }
    if (Number(quantity) <= 0) {
      newErrors.quantity = 'Jumlah harus lebih dari 0';
    }
    if (!servingUnit.trim()) {
      newErrors.servingUnit = 'Satuan wajib diisi';
    }
    if (Number(caloriesKcal) < 0) {
      newErrors.caloriesKcal = 'Kalori tidak boleh negatif';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(
      {
        consumptionDate,
        mealType,
        foodName: foodName.trim(),
        quantity: Number(quantity),
        servingUnit: servingUnit.trim(),
        weightGrams: weightGrams ? Number(weightGrams) : undefined,
        caloriesKcal: Number(caloriesKcal),
        proteinG: Number(proteinG),
        carbsG: Number(carbsG),
        fatG: Number(fatG),
        source: editingEntry ? editingEntry.source : 'manual',
        aiEstimated: editingEntry ? editingEntry.aiEstimated : false,
        estimationNotes: editingEntry?.estimationNotes,
        notes: notes.trim() ? notes.trim() : undefined,
      },
      saveToFavorites,
    );

    onClose();
  };

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={editingEntry ? 'Ubah Catatan Makanan' : 'Catat Makanan Baru'}
      description="Masukkan detail makanan dan nilai nutrisi yang dikonsumsi"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Meal Type Buttons */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
            Waktu Makan
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {mealTypes.map(type => (
              <button
                type="button"
                key={type}
                onClick={() => setMealType(type)}
                className={`rounded-xl border py-2 px-3 text-xs font-semibold transition-all ${
                  mealType === type
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border bg-surface-elevated text-text-secondary hover:border-border/80 hover:text-text-primary'
                }`}
              >
                {MEAL_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Pick from Saved Foods */}
        {!editingEntry && savedFoods.length > 0 && (
          <div className="rounded-xl border border-border/80 bg-surface-elevated/40 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-2">
              <Bookmark className="h-3.5 w-3.5 text-accent" />
              <span>Pilih Cepat dari Makanan Tersimpan:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {savedFoods.map(f => (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => handleSelectSavedFood(f.id)}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-text-secondary hover:border-accent hover:text-accent transition-colors"
                >
                  {f.foodName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Food Name */}
        <Input
          label="Nama Makanan"
          placeholder="Contoh: Dada Ayam Panggang, Nasi Putih..."
          value={foodName}
          onChange={e => setFoodName(e.target.value)}
          error={errors.foodName}
          required
        />

        {/* Quantity & Serving Unit */}
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="Jumlah"
            min={0.1}
            step={0.5}
            value={quantity}
            onChange={val => setQuantity(val)}
            error={errors.quantity}
            required
          />

          <Input
            label="Satuan Porsi"
            placeholder="porsi, gram, butir..."
            value={servingUnit}
            onChange={e => setServingUnit(e.target.value)}
            error={errors.servingUnit}
            required
          />
        </div>

        {/* Macros & Calories Grid */}
        <div className="rounded-xl border border-border bg-surface-elevated/60 p-3.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-text-primary">
              Kandungan Nutrisi
            </span>
            <button
              type="button"
              onClick={handleAutoCalcCalories}
              className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
              title="Hitung kalori otomatis dari Protein, Karbo, dan Lemak"
            >
              <Calculator className="h-3 w-3" />
              Hitung Kalori dari Makro
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <NumberInput
              label="Kalori (kcal)"
              min={0}
              step={1}
              value={caloriesKcal}
              onChange={val => setCaloriesKcal(val)}
              error={errors.caloriesKcal}
              required
            />

            <NumberInput
              label="Protein (g)"
              min={0}
              step={0.5}
              value={proteinG}
              onChange={val => setProteinG(val)}
            />

            <NumberInput
              label="Karbohidrat (g)"
              min={0}
              step={0.5}
              value={carbsG}
              onChange={val => setCarbsG(val)}
            />

            <NumberInput
              label="Lemak (g)"
              min={0}
              step={0.5}
              value={fatG}
              onChange={val => setFatG(val)}
            />
          </div>
        </div>

        {/* Save to Favorites Checkbox */}
        {!editingEntry && (
          <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={saveToFavorites}
              onChange={e => setSaveToFavorites(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-surface-elevated text-accent focus:ring-accent"
            />
            <span>Simpan makanan ini ke daftar &quot;Makanan Tersimpan&quot; saya</span>
          </label>
        )}

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary">
            {editingEntry ? 'Perbarui Catatan' : 'Simpan ke Buku Harian'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
