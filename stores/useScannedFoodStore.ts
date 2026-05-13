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
export function getNutrientValue(
  food: ScannedFood,
  name: string,
): number | undefined {
  return food.usdaDetails?.nutrients.find((n) =>
    n.nutrientName.toLowerCase().includes(name.toLowerCase()),
  )?.value;
}

/** Calories × servingsConsumed */
export function totalCalories(food: ScannedFood): number {
  const cal = getNutrientValue(food, "Energy") ?? 0;
  return cal * (food.servingsConsumed ?? 1); // ← add ?? 1
}

// ─── Store ────────────────────────────────────────────────────────────────────

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
    }),
    {
      name: "scanned-food-storage", // AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
