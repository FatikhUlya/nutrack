'use client';

import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Mic,
  Scan,
  MoreHorizontal,
  Plus,
  Check,
} from 'lucide-react';
import { FoodIllustration } from '@/components/ui/FoodIllustration';
import { useSavedFoods } from '@/hooks/useSavedFoods';
import type { MealType, CreateFoodEntryInput } from '@/types';
import { MEAL_TYPE_LABELS } from '@/types';

interface FoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType;
  consumptionDate: string;
  onAddEntries: (entries: CreateFoodEntryInput[]) => void;
  onOpenScanner: () => void;
}

interface QuickFoodItem {
  id: string;
  name: string;
  caloriesKcal: number;
  portion: string;
  proteinG: number;
  carbsG: number;
  fatG: number;
  type: string;
}

const DEFAULT_POPULAR_FOODS: QuickFoodItem[] = [
  { id: 'f-hotdog', name: 'Hotdog', caloriesKcal: 100, portion: '1 hotdog · 100g', proteinG: 7, carbsG: 12, fatG: 8, type: 'hotdog' },
  { id: 'f-pizza', name: 'Pizza', caloriesKcal: 200, portion: '1 slice · 100g', proteinG: 10, carbsG: 24, fatG: 8, type: 'pizza' },
  { id: 'f-donut', name: 'Donut', caloriesKcal: 200, portion: '3 donuts · 100g', proteinG: 4, carbsG: 32, fatG: 11, type: 'donut' },
  { id: 'f-cake', name: 'Cake', caloriesKcal: 200, portion: '1 cake · 100g', proteinG: 3, carbsG: 35, fatG: 9, type: 'cake' },
  { id: 'f-popcorn', name: 'Popcorn', caloriesKcal: 200, portion: '1 portion · 100g', proteinG: 3, carbsG: 38, fatG: 7, type: 'popcorn' },
  { id: 'f-cookies', name: 'Cookies', caloriesKcal: 200, portion: '2 portion · 100g', proteinG: 4, carbsG: 30, fatG: 12, type: 'cookies' },
  { id: 'f-burger', name: 'Beef and cheese burger', caloriesKcal: 300, portion: '1 burger · 100g', proteinG: 13, carbsG: 28, fatG: 11, type: 'burger' },
  { id: 'f-ayam', name: 'Ayam Panggang Dada', caloriesKcal: 240, portion: '1 potong · 150g', proteinG: 45, carbsG: 0, fatG: 5, type: 'chicken' },
  { id: 'f-nasi', name: 'Nasi Putih Pulen', caloriesKcal: 195, portion: '1 mangkuk · 150g', proteinG: 4, carbsG: 43, fatG: 0.5, type: 'rice' },
  { id: 'f-salad', name: 'Salad Sayur Segar', caloriesKcal: 95, portion: '1 porsi · 150g', proteinG: 3, carbsG: 6, fatG: 7, type: 'salad' },
];

export function FoodSearchModal({
  isOpen,
  onClose,
  mealType,
  consumptionDate,
  onAddEntries,
  onOpenScanner,
}: FoodSearchModalProps) {
  const { savedFoods } = useSavedFoods();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<QuickFoodItem[]>([]);
  const [isListeningVoice, setIsListeningVoice] = useState(false);

  // Combine popular foods with user's saved foods
  const allFoods = useMemo(() => {
    const customList: QuickFoodItem[] = savedFoods.map((s) => ({
      id: s.id,
      name: s.foodName,
      caloriesKcal: s.caloriesKcal,
      portion: `${s.defaultQuantity} ${s.servingUnit}`,
      proteinG: s.proteinG,
      carbsG: s.carbsG,
      fatG: s.fatG,
      type: s.foodName,
    }));

    return [...DEFAULT_POPULAR_FOODS, ...customList];
  }, [savedFoods]);

  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return allFoods;
    const q = searchQuery.toLowerCase();
    return allFoods.filter((f) => f.name.toLowerCase().includes(q));
  }, [allFoods, searchQuery]);

  if (!isOpen) return null;

  const toggleSelectItem = (food: QuickFoodItem) => {
    setSelectedItems((prev) => {
      const exists = prev.some((item) => item.id === food.id);
      if (exists) {
        return prev.filter((item) => item.id !== food.id);
      } else {
        return [...prev, food];
      }
    });
  };

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.onstart = () => setIsListeningVoice(true);
      recognition.onend = () => setIsListeningVoice(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
      };
      recognition.start();
    } else {
      alert('Perekam suara tidak didukung pada browser ini.');
    }
  };

  const handleConfirmAdd = () => {
    if (selectedItems.length === 0) return;

    const entries: CreateFoodEntryInput[] = selectedItems.map((item) => ({
      consumptionDate,
      mealType,
      foodName: item.name,
      quantity: 1,
      servingUnit: item.portion,
      caloriesKcal: item.caloriesKcal,
      proteinG: item.proteinG,
      carbsG: item.carbsG,
      fatG: item.fatG,
      notes: `Ditambahkan dari database makanan`,
      source: 'saved',
      aiEstimated: false,
    }));

    onAddEntries(entries);
    setSelectedItems([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in font-sans">
      {/* Modal Container */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-3xl bg-[#202326] border border-[#2D3134] flex flex-col overflow-hidden shadow-2xl text-[#F4F5F6]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#2D3134]">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#292D30] active:scale-95 transition-all text-[#D6FF3F]"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
          </button>

          <h2 className="text-base font-extrabold text-[#F4F5F6]">Food</h2>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#292D30] text-[#747C83]"
            aria-label="Menu"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Search Input Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#747C83]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in food database"
              className="w-full bg-[#17191B] border border-[#383D41] rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-[#F4F5F6] placeholder:text-[#747C83] focus:outline-none focus:border-[#D6FF3F] focus:shadow-neon-glow transition-all"
            />
          </div>

          {/* Quick Action Pills: Voice search & Scan with AI */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all active:scale-95 ${
                isListeningVoice
                  ? 'bg-red-500/20 border-red-500 text-[#FF6B73] animate-pulse'
                  : 'bg-[#292D30] border-[#383D41] text-[#A7ADB3] hover:text-[#F4F5F6]'
              }`}
            >
              <Mic className="h-4 w-4 text-[#D6FF3F]" />
              <span>{isListeningVoice ? 'Mendengarkan...' : 'Voice search'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenScanner();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#D6FF3F]/15 border border-[#D6FF3F]/40 text-xs font-bold text-[#D6FF3F] hover:bg-[#D6FF3F]/25 active:scale-95 transition-all shadow-neon-glow"
            >
              <Scan className="h-4 w-4 text-[#D6FF3F]" />
              <span>Scan with AI</span>
            </button>
          </div>

          {/* Recently Had Foods Section */}
          <div>
            <h3 className="text-xs font-bold text-[#F4F5F6] uppercase tracking-wider mb-2.5">
              Recently had
            </h3>

            <div className="divide-y divide-[#2D3134] rounded-2xl bg-[#17191B] border border-[#2D3134] overflow-hidden">
              {filteredFoods.map((food) => {
                const isSelected = selectedItems.some((item) => item.id === food.id);

                return (
                  <div
                    key={food.id}
                    className="flex items-center justify-between p-3.5 hover:bg-[#202326] transition-all"
                  >
                    {/* Left: 3D Illustration + Name + kcal info */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#202326] flex items-center justify-center border border-[#383D41] shrink-0">
                        <FoodIllustration name={food.name} size={36} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-extrabold text-[#F4F5F6] truncate">
                          {food.name}
                        </h4>
                        <p className="text-[11px] text-[#747C83] mt-0.5 truncate">
                          {food.caloriesKcal}kcal · {food.portion}
                        </p>
                      </div>
                    </div>

                    {/* Right: Plus Button or Check */}
                    <button
                      type="button"
                      onClick={() => toggleSelectItem(food)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-90 ${
                        isSelected
                          ? 'bg-[#65D99A] text-[#17191B] font-black'
                          : 'bg-[#D6FF3F]/15 text-[#D6FF3F] border border-[#D6FF3F]/30 hover:bg-[#D6FF3F] hover:text-[#17191B]'
                      }`}
                      aria-label="Pilih makanan"
                    >
                      {isSelected ? (
                        <Check className="h-4 w-4 stroke-[3]" />
                      ) : (
                        <Plus className="h-5 w-5 stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Floating Action Bar at bottom */}
        {selectedItems.length > 0 && (
          <div className="p-4 bg-[#202326] border-t border-[#2D3134]">
            <button
              type="button"
              onClick={handleConfirmAdd}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#D6FF3F] text-[#17191B] font-extrabold text-sm shadow-neon-glow hover:bg-[#C7F02D] flex items-center justify-between active:scale-[0.98] transition-all"
            >
              <span>Add to {MEAL_TYPE_LABELS[mealType]}</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#17191B]/20 text-xs font-black">
                {selectedItems.length}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
