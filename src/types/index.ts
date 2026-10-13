// ─── Activity & Goal ─────────────────────────────────────────────────────────

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'high'
  | 'very_high';

export type Goal = 'cut' | 'maintenance' | 'lean_bulk';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type FoodSource = 'manual' | 'scanner' | 'saved';

export type NutrientStatusLevel =
  | 'no_data'
  | 'in_progress'
  | 'on_target'
  | 'below_target'
  | 'above_target'
  | 'over_limit';

export type ScanConfidence = 'low' | 'medium' | 'high';

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  displayName: string;
  sex: 'male' | 'female';
  age: number;
  weightKg: number;
  heightCm: number;
  bodyFatPercent?: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// ─── Nutrition Targets ────────────────────────────────────────────────────────

export interface NutritionTarget {
  id: string;
  userId: string;
  effectiveDate: string; // YYYY-MM-DD
  bmrKcal: number;
  tdeeKcal: number;
  calorieTargetKcal: number;
  proteinTargetG: number;
  carbsTargetG: number;
  fatTargetG: number;
  calculationVersion: string;
  goal: Goal;
  createdAt: string;
}

// ─── Food Entries ─────────────────────────────────────────────────────────────

export interface FoodEntry {
  id: string;
  userId: string;
  consumptionDate: string; // YYYY-MM-DD
  mealType: MealType;
  foodName: string;
  quantity: number;
  servingUnit: string;
  weightGrams?: number;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: FoodSource;
  aiEstimated: boolean;
  estimationNotes?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateFoodEntryInput = Omit<
  FoodEntry,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

export type UpdateFoodEntryInput = Partial<
  Omit<FoodEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

// ─── Saved Foods ──────────────────────────────────────────────────────────────

export interface SavedFood {
  id: string;
  userId: string;
  foodName: string;
  defaultQuantity: number;
  servingUnit: string;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── AI Scanner ───────────────────────────────────────────────────────────────

export interface FoodScanItem {
  name: string;
  estimatedWeightGrams: number;
  servingDescription: string;
  caloriesKcal: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  confidence: ScanConfidence;
  estimationNotes: string;
}

export interface FoodScanAnalysis {
  items: FoodScanItem[];
  overallNotes: string[];
}

export interface ScannerAnalysis {
  id: string;
  userId: string;
  status: 'pending' | 'success' | 'error';
  structuredResult?: FoodScanAnalysis;
  errorMessage?: string;
  createdAt: string;
}

// ─── Nutrition Aggregates ─────────────────────────────────────────────────────

export interface DailyNutrition {
  date: string; // YYYY-MM-DD
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  entryCount: number;
  hasData: boolean;
}

export interface NutrientStatusResult {
  status: NutrientStatusLevel;
  percentage: number; // 0–100+
  remaining: number; // positive = remaining, negative = over
  excess: number; // amount over target (0 if not over)
}

// ─── Calculation Results ──────────────────────────────────────────────────────

export interface NutritionCalculationResult {
  bmrKcal: number;
  tdeeKcal: number;
  calorieTargetKcal: number;
  proteinTargetG: number;
  carbsTargetG: number;
  fatTargetG: number;
  warnings: string[];
  bmi?: number;
  bmiCategory?: 'Underweight' | 'Normal' | 'Overweight' | 'Obesitas';
  macroNotes?: string;
}

export interface NutritionRangeStatus {
  label: 'Low' | 'Healthy Range' | 'High' | 'Target';
  per100kg: number; // per kg of body weight
}

// ─── Statistics ───────────────────────────────────────────────────────────────

export type StatsPeriod = 'day' | 'week' | 'month';

export interface PeriodStats {
  period: StatsPeriod;
  startDate: string;
  endDate: string;
  dailyNutrition: DailyNutrition[];
  averageCalories: number;
  averageProteinG: number;
  averageCarbsG: number;
  averageFatG: number;
  trackedDays: number;
  totalDays: number;
  daysOnTarget: number;
  caloriesAchievementPercent: number;
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export type DialogState = 'closed' | 'open';

// ─── Activity Level Config ────────────────────────────────────────────────────

export interface ActivityLevelConfig {
  value: ActivityLevel;
  label: string;
  description: string;
  multiplier: number;
}

export const ACTIVITY_LEVEL_CONFIGS: ActivityLevelConfig[] = [
  {
    value: 'sedentary',
    label: 'Sangat Rendah (Sedentary)',
    description: 'Tidak berolahraga, pekerjaan di meja',
    multiplier: 1.20,
  },
  {
    value: 'light',
    label: 'Rendah (Light)',
    description: 'Olahraga ringan 1–3 hari per minggu',
    multiplier: 1.375,
  },
  {
    value: 'moderate',
    label: 'Sedang (Moderate)',
    description: 'Olahraga sedang 3–5 hari per minggu',
    multiplier: 1.55,
  },
  {
    value: 'high',
    label: 'Tinggi (High)',
    description: 'Olahraga berat 6–7 hari per minggu',
    multiplier: 1.725,
  },
  {
    value: 'very_high',
    label: 'Sangat Tinggi (Very High)',
    description: 'Olahraga sangat berat, pekerjaan fisik berat',
    multiplier: 1.90,
  },
];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Sarapan',
  lunch: 'Makan Siang',
  dinner: 'Makan Malam',
  snack: 'Camilan',
};

export const GOAL_LABELS: Record<Goal, string> = {
  cut: 'Cut (Penurunan berat badan)',
  maintenance: 'Maintenance (Mempertahankan berat)',
  lean_bulk: 'Lean Bulk (Peningkatan massa otot)',
};

export const GOAL_DESCRIPTIONS: Record<Goal, string> = {
  cut: 'Defisit kalori untuk mengurangi lemak tubuh secara bertahap',
  maintenance: 'Seimbangkan asupan dengan kebutuhan energi harian',
  lean_bulk: 'Surplus kalori konservatif untuk membangun massa otot',
};
