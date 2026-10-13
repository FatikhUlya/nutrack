/**
 * NUTRACK Nutrition Calculation Engine
 * Single source of truth for all nutritional calculations.
 * Formula: Mifflin–St Jeor BMR → TDEE → Goal-adjusted targets → Macros
 */

import type {
  ActivityLevel,
  Goal,
  UserProfile,
  NutritionCalculationResult,
  NutrientStatusResult,
  NutrientStatusLevel,
} from '@/types';

// ─── Version ──────────────────────────────────────────────────────────────────

export const CALCULATION_VERSION = '1.0.0';

// ─── Activity Multipliers ─────────────────────────────────────────────────────

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.20,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  very_high: 1.90,
};

// ─── Goal Calorie Adjustments ─────────────────────────────────────────────────

/**
 * Calorie delta applied to TDEE based on goal.
 * Values are conservative and safe defaults.
 */
export const GOAL_CALORIE_ADJUSTMENTS: Record<Goal, number> = {
  cut: -350,       // Moderate deficit (~0.3–0.4 kg/week loss)
  maintenance: 0,
  lean_bulk: 200,  // Conservative surplus (~0.1–0.2 kg/week gain)
};

// ─── Macro Ratios ─────────────────────────────────────────────────────────────

/** Target protein per kg of body weight (g/kg) */
export const PROTEIN_TARGET_PER_KG = 2.0;

/** Target fat per kg of body weight (g/kg) */
export const FAT_TARGET_PER_KG = 1.08;

// ─── Safety Limits ────────────────────────────────────────────────────────────

/** Minimum recommended calorie intake (kcal/day) */
export const MIN_SAFE_CALORIES = 1200;

/** Maximum allowed calorie deficit from TDEE */
export const MAX_CALORIE_DEFICIT = 1000;

// ─── Nutrition Reference Ranges ───────────────────────────────────────────────

export const PROTEIN_RANGES = {
  lowThresholdPerKg: 1.6,   // g/kg — below is "Low"
  highThresholdPerKg: 2.2,  // g/kg — above is "High"
  targetPerKg: PROTEIN_TARGET_PER_KG,
};

export const FAT_RANGES = {
  lowThresholdPerKg: 0.8,
  highThresholdPerKg: 1.2,
  targetPerKg: FAT_TARGET_PER_KG,
};

export const CARB_RANGES = {
  lowThresholdPerKg: 4.5,
  highThresholdPerKg: 7.0,
};

// ─── Core Calculations ────────────────────────────────────────────────────────

/**
 * Mifflin–St Jeor BMR
 * Male:   BMR = 10w + 6.25h − 5a + 5
 * Female: BMR = 10w + 6.25h − 5a − 161
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'male' | 'female',
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

/**
 * Total Daily Energy Expenditure
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

/**
 * Daily calorie target based on goal.
 * Includes safety guardrails.
 */
export function calculateCalorieTarget(
  tdee: number,
  goal: Goal,
): { calorieTarget: number; warnings: string[] } {
  const adjustment = GOAL_CALORIE_ADJUSTMENTS[goal];
  let calorieTarget = tdee + adjustment;
  const warnings: string[] = [];

  if (calorieTarget < MIN_SAFE_CALORIES) {
    warnings.push(
      `Target kalori yang dihitung (${Math.round(calorieTarget)} kcal) berada di bawah batas aman minimum (${MIN_SAFE_CALORIES} kcal). Target disesuaikan ke ${MIN_SAFE_CALORIES} kcal. Konsultasikan dengan profesional kesehatan.`,
    );
    calorieTarget = MIN_SAFE_CALORIES;
  }

  if (tdee - calorieTarget > MAX_CALORIE_DEFICIT) {
    warnings.push(
      `Defisit kalori melebihi ${MAX_CALORIE_DEFICIT} kcal/hari. Disarankan berkonsultasi dengan profesional nutrisi.`,
    );
  }

  return { calorieTarget, warnings };
}

/**
 * Protein target in grams
 */
export function calculateProteinTarget(weightKg: number): number {
  return weightKg * PROTEIN_TARGET_PER_KG;
}

/**
 * Fat target in grams
 */
export function calculateFatTarget(weightKg: number): number {
  return weightKg * FAT_TARGET_PER_KG;
}

/**
 * Carbohydrate target from remaining calories
 * CarbTarget = (CalorieTarget − ProteinCals − FatCals) / 4
 */
export function calculateCarbTarget(
  calorieTarget: number,
  proteinG: number,
  fatG: number,
): { carbsG: number; valid: boolean; warning?: string } {
  const proteinCals = proteinG * 4;
  const fatCals = fatG * 9;
  const remainingCals = calorieTarget - proteinCals - fatCals;
  const carbsG = remainingCals / 4;

  if (carbsG < 0) {
    return {
      carbsG: 0,
      valid: false,
      warning: `Target kalori tidak cukup untuk memenuhi protein dan lemak sekaligus. Pertimbangkan meningkatkan target kalori atau menyesuaikan target protein/lemak.`,
    };
  }

  if (carbsG < 50) {
    return {
      carbsG,
      valid: true,
      warning: `Target karbohidrat sangat rendah (${Math.round(carbsG)} g). Ini mungkin bukan pilihan yang tepat untuk semua orang.`,
    };
  }

  return { carbsG, valid: true };
}

// ─── BMI Calculation ──────────────────────────────────────────────────────────

/**
 * Calculates Body Mass Index (BMI) and category (WHO Asia-Pacific standard)
 */
export function calculateBMI(
  weightKg: number,
  heightCm: number,
): { bmi: number; category: 'Underweight' | 'Normal' | 'Overweight' | 'Obesitas' } {
  if (weightKg <= 0 || heightCm <= 0) {
    return { bmi: 0, category: 'Normal' };
  }
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  let category: 'Underweight' | 'Normal' | 'Overweight' | 'Obesitas' = 'Normal';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 23) category = 'Normal'; // WHO Asia-Pacific cutoff
  else if (bmi < 25) category = 'Overweight';
  else category = 'Obesitas';
  return { bmi: Math.round(bmi * 10) / 10, category };
}

// ─── Full Calculation Pipeline ────────────────────────────────────────────────

/**
 * Main entry point: calculates all nutrition targets from a user profile.
 * Supports clinically adaptive macronutrient distribution for overweight/obesity.
 */
export function calculateNutritionTargets(
  profile: Pick<
    UserProfile,
    'sex' | 'age' | 'weightKg' | 'heightCm' | 'activityLevel' | 'goal'
  > & { bodyFatPercent?: number },
): NutritionCalculationResult {
  const warnings: string[] = [];

  const bmrKcal = calculateBMR(
    profile.weightKg,
    profile.heightCm,
    profile.age,
    profile.sex,
  );

  const tdeeKcal = calculateTDEE(bmrKcal, profile.activityLevel);

  const { calorieTarget, warnings: calWarnings } = calculateCalorieTarget(
    tdeeKcal,
    profile.goal,
  );
  warnings.push(...calWarnings);

  const { bmi, category: bmiCategory } = calculateBMI(profile.weightKg, profile.heightCm);

  let proteinTargetG: number;
  let fatTargetG: number;
  let macroNotes: string | undefined;

  // Clinically adaptive macros for obesity / overweight or cutting
  if (bmi >= 25 || profile.goal === 'cut') {
    if (bmi >= 30) {
      // Obesitas (BMI >= 30): 1.5g/kg actual weight (protects lean muscle without excessive protein load)
      proteinTargetG = profile.weightKg * 1.5;
      macroNotes = 'Alokasi protein disesuaikan untuk program penurunan berat badan obesitas (1.5g/kg BB).';
    } else if (bmi >= 25) {
      // Overweight (BMI 25 - 29.9): 1.7g/kg
      proteinTargetG = profile.weightKg * 1.7;
      macroNotes = 'Alokasi protein dioptimalkan untuk defisit penurunan lemak sehat (1.7g/kg BB).';
    } else {
      proteinTargetG = calculateProteinTarget(profile.weightKg);
    }

    // Healthy dietary fat during weight loss/obesity: 28% of total calorie target
    const fatKcal = calorieTarget * 0.28;
    fatTargetG = fatKcal / 9;
  } else {
    // Normal weight maintenance or lean bulk
    proteinTargetG = calculateProteinTarget(profile.weightKg);
    fatTargetG = calculateFatTarget(profile.weightKg);
  }

  const { carbsG, warning: carbWarning } = calculateCarbTarget(
    calorieTarget,
    proteinTargetG,
    fatTargetG,
  );
  if (carbWarning) warnings.push(carbWarning);

  return {
    bmrKcal,
    tdeeKcal,
    calorieTargetKcal: calorieTarget,
    proteinTargetG,
    carbsTargetG: carbsG,
    fatTargetG,
    warnings,
    bmi,
    bmiCategory,
    macroNotes,
  };
}

// ─── Nutrient Status ──────────────────────────────────────────────────────────

/**
 * Tolerance: percentage range considered "on target"
 * e.g. 0.10 = ±10% of target is acceptable
 */
export const DEFAULT_TOLERANCE = 0.10;

/**
 * Percentage above target before marking as "over limit"
 */
export const OVER_LIMIT_THRESHOLD = 0.20;

/**
 * Returns the achievement status of a single nutrient.
 * Does NOT penalise users for being under target during an ongoing day.
 *
 * @param actual    - Amount consumed
 * @param target    - Daily target
 * @param tolerance - Fractional tolerance (default 10%)
 * @param isDayComplete - If false, under-target is in_progress not below_target
 */
export function getNutrientStatus(
  actual: number,
  target: number,
  tolerance: number = DEFAULT_TOLERANCE,
  isDayComplete: boolean = false,
): NutrientStatusResult {
  if (actual === 0 && target === 0) {
    return { status: 'no_data', percentage: 0, remaining: 0, excess: 0 };
  }

  const percentage = target > 0 ? (actual / target) * 100 : 0;
  const remaining = target - actual;
  const excess = Math.max(0, actual - target);

  const lowerBound = 1 - tolerance;  // e.g. 0.90 = 90%
  const upperBound = 1 + tolerance;  // e.g. 1.10 = 110%
  const overLimit = 1 + OVER_LIMIT_THRESHOLD; // e.g. 1.20 = 120%

  let status: NutrientStatusLevel;

  if (actual / target > overLimit) {
    status = 'over_limit';
  } else if (actual / target > upperBound) {
    status = 'above_target';
  } else if (actual / target >= lowerBound) {
    status = 'on_target';
  } else if (isDayComplete) {
    status = 'below_target';
  } else {
    status = 'in_progress';
  }

  return { status, percentage, remaining, excess };
}

// ─── Display Rounding ─────────────────────────────────────────────────────────

/**
 * Round calories to nearest 10 kcal for display
 */
export function roundCalories(kcal: number): number {
  return Math.round(kcal / 10) * 10;
}

/**
 * Round macros to nearest 1 gram for display
 */
export function roundMacro(grams: number): number {
  return Math.round(grams);
}

// ─── Nutrient Range Labels ────────────────────────────────────────────────────

export function getProteinRangeLabel(
  proteinG: number,
  weightKg: number,
): 'Low' | 'Healthy Range' | 'High' {
  const perKg = proteinG / weightKg;
  if (perKg < PROTEIN_RANGES.lowThresholdPerKg) return 'Low';
  if (perKg > PROTEIN_RANGES.highThresholdPerKg) return 'High';
  return 'Healthy Range';
}

export function getFatRangeLabel(
  fatG: number,
  weightKg: number,
): 'Low' | 'Healthy Range' | 'High' {
  const perKg = fatG / weightKg;
  if (perKg < FAT_RANGES.lowThresholdPerKg) return 'Low';
  if (perKg > FAT_RANGES.highThresholdPerKg) return 'High';
  return 'Healthy Range';
}

export function getCarbRangeLabel(
  carbsG: number,
  weightKg: number,
): 'Low' | 'Healthy Range' | 'High' {
  const perKg = carbsG / weightKg;
  if (perKg < CARB_RANGES.lowThresholdPerKg) return 'Low';
  if (perKg > CARB_RANGES.highThresholdPerKg) return 'High';
  return 'Healthy Range';
}
