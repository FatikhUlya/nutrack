'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, NumberInput } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { useSavedFoods } from '@/hooks/useSavedFoods';
import { formatNumber } from '@/lib/utils';
import type { SavedFood, MealType } from '@/types';
import {
  Bookmark,
  Plus,
  Search,
  Trash2,
  Edit2,
  PlusCircle,
  Utensils,
} from 'lucide-react';

interface SavedFoodsManagerProps {
  onLogFood?: (food: SavedFood, mealType: MealType) => void;
}

export function SavedFoodsManager({ onLogFood }: SavedFoodsManagerProps) {
  const { savedFoods, addSavedFood, updateFood, deleteFood } = useSavedFoods();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<SavedFood | null>(null);

  // Form states for creating / editing
  const [foodName, setFoodName] = useState('');
  const [defaultQuantity, setDefaultQuantity] = useState<number | string>(100);
  const [servingUnit, setServingUnit] = useState('gram');
  const [caloriesKcal, setCaloriesKcal] = useState<number | string>(0);
  const [proteinG, setProteinG] = useState<number | string>(0);
  const [carbsG, setCarbsG] = useState<number | string>(0);
  const [fatG, setFatG] = useState<number | string>(0);
  const [notes, setNotes] = useState('');

  // Quick log dialog
  const [quickLogFood, setQuickLogFood] = useState<SavedFood | null>(null);

  const openCreateModal = () => {
    setEditingFood(null);
    setFoodName('');
    setDefaultQuantity(100);
    setServingUnit('gram');
    setCaloriesKcal(0);
    setProteinG(0);
    setCarbsG(0);
    setFatG(0);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (food: SavedFood) => {
    setEditingFood(food);
    setFoodName(food.foodName);
    setDefaultQuantity(food.defaultQuantity);
    setServingUnit(food.servingUnit);
    setCaloriesKcal(food.caloriesKcal);
    setProteinG(food.proteinG);
    setCarbsG(food.carbsG);
    setFatG(food.fatG);
    setNotes(food.notes ?? '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) return;

    if (editingFood) {
      updateFood(editingFood.id, {
        foodName: foodName.trim(),
        defaultQuantity: Number(defaultQuantity) || 100,
        servingUnit: servingUnit.trim(),
        caloriesKcal: Number(caloriesKcal) || 0,
        proteinG: Number(proteinG) || 0,
        carbsG: Number(carbsG) || 0,
        fatG: Number(fatG) || 0,
        notes: notes.trim() || undefined,
      });
    } else {
      addSavedFood({
        foodName: foodName.trim(),
        defaultQuantity: Number(defaultQuantity) || 100,
        servingUnit: servingUnit.trim(),
        caloriesKcal: Number(caloriesKcal) || 0,
        proteinG: Number(proteinG) || 0,
        carbsG: Number(carbsG) || 0,
        fatG: Number(fatG) || 0,
        notes: notes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const filteredFoods = savedFoods.filter(f =>
    f.foodName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Cari makanan tersimpan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button
          variant="primary"
          onClick={openCreateModal}
          className="gap-2 font-bold shrink-0"
        >
          <Plus className="h-4 w-4" />
          Tambah Makanan Baru
        </Button>
      </div>

      {/* Foods Grid */}
      {filteredFoods.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <Bookmark className="h-10 w-10 text-text-muted mb-3" />
          <h4 className="text-sm font-bold text-text-primary">
            {searchQuery ? 'Makanan Tidak Ditemukan' : 'Belum Ada Makanan Tersimpan'}
          </h4>
          <p className="mt-1 text-xs text-text-secondary max-w-sm">
            {searchQuery
              ? `Tidak ada hasil untuk pencarian "${searchQuery}". Coba kata kunci lain.`
              : 'Simpan makanan favorit atau menu harian Anda agar lebih cepat dicatat ke dalam buku harian.'}
          </p>
          {!searchQuery && (
            <Button
              variant="secondary"
              size="sm"
              onClick={openCreateModal}
              className="mt-4 gap-1.5"
            >
              <Plus className="h-4 w-4" /> Buat Sekarang
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFoods.map(food => (
            <Card
              key={food.id}
              className="flex flex-col justify-between border border-border bg-surface p-4 shadow-sm hover:border-border/80 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-text-primary">
                    {food.foodName}
                  </h4>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(food)}
                      className="rounded-lg p-1 text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors"
                      title="Ubah Makanan"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteFood(food.id)}
                      className="rounded-lg p-1 text-text-muted hover:bg-danger/10 hover:text-danger transition-colors"
                      title="Hapus Makanan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-1 text-xs text-text-muted">
                  Porsi standar: {food.defaultQuantity} {food.servingUnit}
                </div>

                {/* Macro Chips */}
                <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl bg-surface-elevated p-2 text-center">
                  <div>
                    <span className="text-[10px] text-text-muted block">Kalori</span>
                    <span className="text-xs font-bold text-accent">
                      {Math.round(food.caloriesKcal)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Protein</span>
                    <span className="text-xs font-bold text-protein">
                      {Math.round(food.proteinG)}g
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Karbo</span>
                    <span className="text-xs font-bold text-carb">
                      {Math.round(food.carbsG)}g
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Lemak</span>
                    <span className="text-xs font-bold text-fat">
                      {Math.round(food.fatG)}g
                    </span>
                  </div>
                </div>

                {food.notes && (
                  <p className="mt-2 text-[11px] text-text-muted italic line-clamp-1">
                    {food.notes}
                  </p>
                )}
              </div>

              {/* Action Button */}
              {onLogFood && (
                <div className="mt-4 pt-3 border-t border-border/60">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setQuickLogFood(food)}
                    className="w-full gap-1.5 text-xs font-semibold"
                  >
                    <PlusCircle className="h-3.5 w-3.5 text-accent" />
                    Catat ke Hari Ini
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFood ? 'Ubah Makanan Tersimpan' : 'Tambah Makanan Tersimpan'}
        description="Simpan makanan beserta rincian makronutriennya"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nama Makanan"
            value={foodName}
            onChange={e => setFoodName(e.target.value)}
            placeholder="Contoh: Dada Ayam Rebus"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              label="Jumlah Standar"
              value={defaultQuantity}
              onChange={val => setDefaultQuantity(val)}
              min={1}
              required
            />
            <Input
              label="Satuan Porsi"
              value={servingUnit}
              onChange={e => setServingUnit(e.target.value)}
              placeholder="gram, porsi, buah..."
              required
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-border bg-surface-elevated p-3">
            <NumberInput
              label="Kalori (kcal)"
              value={caloriesKcal}
              onChange={val => setCaloriesKcal(val)}
              required
            />
            <NumberInput
              label="Protein (g)"
              value={proteinG}
              onChange={val => setProteinG(val)}
            />
            <NumberInput
              label="Karbo (g)"
              value={carbsG}
              onChange={val => setCarbsG(val)}
            />
            <NumberInput
              label="Lemak (g)"
              value={fatG}
              onChange={val => setFatG(val)}
            />
          </div>

          <Input
            label="Catatan (Opsional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Contoh: Tanpa kulit, rebus matang"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan Makanan
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Quick Log Meal Picker Dialog */}
      {quickLogFood && (
        <Dialog
          isOpen={Boolean(quickLogFood)}
          onClose={() => setQuickLogFood(null)}
          title="Pilih Waktu Makan"
          description={`Tambahkan "${quickLogFood.foodName}" ke buku harian:`}
          maxWidth="sm"
        >
          <div className="grid grid-cols-2 gap-2.5 py-2">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(type => (
              <Button
                key={type}
                variant="secondary"
                onClick={() => {
                  if (onLogFood && quickLogFood) {
                    onLogFood(quickLogFood, type);
                    setQuickLogFood(null);
                  }
                }}
                className="py-3 text-xs font-bold"
              >
                {type === 'breakfast' && 'Sarapan'}
                {type === 'lunch' && 'Makan Siang'}
                {type === 'dinner' && 'Makan Malam'}
                {type === 'snack' && 'Camilan'}
              </Button>
            ))}
          </div>
        </Dialog>
      )}
    </div>
  );
}
