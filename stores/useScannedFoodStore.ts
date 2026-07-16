import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  unitName: string;
  value: number;
}

export interface USDAFoodDetails {
  fdcId: number;
  description: string;
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodCategory?: string;
  nutrients: USDANutrient[];
}

export interface ScannedFood {
  id: string; // uuid — generated at save time
  scannedAt: string; // ISO timestamp
  labelText: string; // raw OCR / scanned label text
  matchedFdcId?: number; // USDA FDC ID of best match
  usdaDetails?: USDAFoodDetails; // full USDA nutrition payload
  customName?: string; // user-edited display name
  servingsConsumed: number; // multiplier (default 1)
  imageUri?: string; // local URI of the label photo
  notes?: string;
}

// ─── Derived helpers ──────────────────────────────────────────────────────────

/** Returns the value of a specific nutrient by name (case-insensitive). */


// Replace your existing getNutrientValue function with this:
export function getNutrientValue(food: ScannedFood, name: string): number | undefined {
  // FIX: Force the API to specifically grab 'kcal' so it doesn't grab 'kJ' and multiply everything by 4
  if (name.toLowerCase() === "energy") {
    return food.usdaDetails?.nutrients.find((n) =>
      n.nutrientName.toLowerCase().includes("energy") && 
      n.unitName.toLowerCase() === "kcal"
    )?.value;
  }
  
  return food.usdaDetails?.nutrients.find((n) =>
    n.nutrientName.toLowerCase().includes(name.toLowerCase())
  )?.value;
}










/** Calories × servingsConsumed */
export function totalCalories(food: ScannedFood): number {
  const cal = getNutrientValue(food, "Energy") ?? 0;
  return cal * (food.servingsConsumed ?? 1); // ← add ?? 1
}

/**
 * Generic macro total (grams) for a single food, scaled by servingsConsumed.
 * Uses the USDA nutrient names as they appear in usdaDetails.nutrients.
 * Returns 0 if the food has no usdaDetails or lacks that nutrient (e.g. a
 * label-only scan that was never matched to a USDA entry) — callers should
 * treat 0 as "unknown", not "confirmed zero", when deciding what to display.
 */
export function totalMacro(
  food: ScannedFood,
  nutrientName:
    | "Protein"
    | "Carbohydrate, by difference"
    | "Total lipid (fat)",
): number {
  const val = getNutrientValue(food, nutrientName) ?? 0;
  return val * (food.servingsConsumed ?? 1);
}

// ─── Store ────────────────────────────────────────────────────────────────────

export type AnalyticsPeriod = "day" | "week" | "month" | "year";

/** One bucketed data point for a chart — sum of every macro for foods falling in that bucket. */
export interface PeriodBucket {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Number of scanned foods contributing to this bucket, so callers can distinguish "0 logged" from "logged, ate nothing". */
  count: number;
}

function emptyBucket(): PeriodBucket {
  return { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
}

function accumulate(bucket: PeriodBucket, food: ScannedFood): void {
  bucket.calories += totalCalories(food);
  bucket.protein += totalMacro(food, "Protein");
  bucket.carbs += totalMacro(food, "Carbohydrate, by difference");
  bucket.fat += totalMacro(food, "Total lipid (fat)");
  bucket.count += 1;
}

/** Index 0 = Monday, matching PERIOD_LABELS.week in analytics.tsx. */
function mondayIndexedWeekday(d: Date): number {
  return (d.getDay() + 6) % 7; // JS getDay() is 0=Sunday
}

/** Which of the 4 week-buckets (W1..W4) a date falls into, based on day-of-month. Days 29+ fold into W4. */
function weekOfMonthIndex(d: Date): number {
  return Math.min(3, Math.floor((d.getDate() - 1) / 7));
}

interface ScannedFoodState {
  foods: ScannedFood[];

  /** Called from handleSave — persists label + USDA details permanently. */
  saveFood: (
    labelText: string,
    usdaDetails?: USDAFoodDetails,
    extras?: Partial<
      Pick<
        ScannedFood,
        "imageUri" | "customName" | "notes" | "servingsConsumed"
      >
    >,
  ) => ScannedFood;

  updateFood: (id: string, patch: Partial<ScannedFood>) => void;
  deleteFood: (id: string) => void;
  clearAll: () => void;

  // Selectors
  getFoodById: (id: string) => ScannedFood | undefined;
  getFoodsByDate: (dateISO: string) => ScannedFood[];
  totalCaloriesForDate: (dateISO: string) => number;

  /**
   * Buckets every scanned food into the shape AnalyticsScreen needs for its
   * chart `data` arrays. "day" returns hourly-ish 7-slot buckets for *today*
   * only (matching PERIOD_LABELS.day's 6am..12am slots, using the food's
   * hour-of-day). "week"/"month"/"year" bucket relative to *now* — e.g.
   * "week" always means the current Mon–Sun, not a rolling 7 days — since
   * that's what the existing PERIOD_LABELS imply (fixed weekday/month names,
   * not "N days ago").
   */
  getBucketsForPeriod: (period: AnalyticsPeriod, now?: Date) => PeriodBucket[];
}

export const useScannedFoodStore = create<ScannedFoodState>()(
  persist(
    (set, get) => ({
      foods: [],

      // ── saveFood ──────────────────────────────────────────────────────────
      saveFood: (labelText, usdaDetails, extras = {}) => {
        const now = new Date();

        // ── Deduplicate: same label scanned within the last hour ──────────────
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const duplicate = get().foods.find(
          (f) =>
            f.labelText === labelText && new Date(f.scannedAt) >= oneHourAgo,
        );
        if (duplicate) return duplicate;

        const newFood: ScannedFood = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          scannedAt: now.toISOString(),
          labelText,
          matchedFdcId: usdaDetails?.fdcId,
          usdaDetails,
          servingsConsumed: extras.servingsConsumed ?? 1,
          imageUri: extras.imageUri,
          customName: extras.customName,
          notes: extras.notes,
        };

        set((state) => ({ foods: [newFood, ...state.foods] }));
        return newFood;
      },
      // ── updateFood ────────────────────────────────────────────────────────
      updateFood: (id, patch) =>
        set((state) => ({
          foods: state.foods.map((f) => (f.id === id ? { ...f, ...patch } : f)),
        })),

      // ── deleteFood ────────────────────────────────────────────────────────
      deleteFood: (id) =>
        set((state) => ({ foods: state.foods.filter((f) => f.id !== id) })),

      // ── clearAll ──────────────────────────────────────────────────────────
      clearAll: () => set({ foods: [] }),

      // ── selectors ─────────────────────────────────────────────────────────
      getFoodById: (id) => get().foods.find((f) => f.id === id),

      getFoodsByDate: (dateISO) => {
        const day = dateISO.slice(0, 10); // "YYYY-MM-DD"
        return get().foods.filter((f) => f.scannedAt.startsWith(day));
      },

      totalCaloriesForDate: (dateISO) =>
        get()
          .getFoodsByDate(dateISO)
          .reduce((sum, f) => sum + totalCalories(f), 0),

      getBucketsForPeriod: (period, now = new Date()) => {
        const foods = get().foods;

        if (period === "day") {
          // 7 slots matching PERIOD_LABELS.day: 6am,9am,12pm,3pm,6pm,9pm,12am.
          // Each slot covers the 3-hour window starting at that label's hour,
          // except the last (12am) which wraps and covers 12am–6am too.
          const slotStartHours = [6, 9, 12, 15, 18, 21, 0];
          const buckets = slotStartHours.map(() => emptyBucket());

          const isSameLocalDay = (a: Date, b: Date) =>
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();

          for (const f of foods) {
            const scannedDate = new Date(f.scannedAt);
            if (!isSameLocalDay(scannedDate, now)) continue;
            const hour = scannedDate.getHours();
            // Map hour -> slot index. 0-5 and 21-23 both fall in the "12am" wrap slot (index 6).
            let idx = slotStartHours.findIndex((h, i) => {
              const next = slotStartHours[i + 1] ?? 24;
              return h !== 0 && hour >= h && hour < next;
            });
            if (idx === -1) idx = 6; // covers hour 0-5 and hour 21-23 wraparound
            accumulate(buckets[idx], f);
          }
          // day's chart is cumulative (see NUTRITION_DATA.day comment in
          // analytics.tsx) — running total through the day, flat after "now".
          let running = emptyBucket();
          return buckets.map((b) => {
            running = {
              calories: running.calories + b.calories,
              protein: running.protein + b.protein,
              carbs: running.carbs + b.carbs,
              fat: running.fat + b.fat,
              count: running.count + b.count,
            };
            return { ...running };
          });
        }

        if (period === "week") {
          const buckets = Array.from({ length: 7 }, emptyBucket); // Mon..Sun
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - mondayIndexedWeekday(now));
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);

          for (const f of foods) {
            const d = new Date(f.scannedAt);
            if (d < startOfWeek || d >= endOfWeek) continue;
            accumulate(buckets[mondayIndexedWeekday(d)], f);
          }
          return buckets;
        }

        if (period === "month") {
          const buckets = Array.from({ length: 4 }, emptyBucket); // W1..W4
          for (const f of foods) {
            const d = new Date(f.scannedAt);
            if (
              d.getFullYear() !== now.getFullYear() ||
              d.getMonth() !== now.getMonth()
            )
              continue;
            accumulate(buckets[weekOfMonthIndex(d)], f);
          }
          return buckets;
        }

        // period === "year"
        const buckets = Array.from({ length: 12 }, emptyBucket); // Jan..Dec
        for (const f of foods) {
          const d = new Date(f.scannedAt);
          if (d.getFullYear() !== now.getFullYear()) continue;
          accumulate(buckets[d.getMonth()], f);
        }
        return buckets;
      },
    }),
    {
      name: "scanned-food-storage", // AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
