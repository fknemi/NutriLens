import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Helper to get local date string (YYYY-MM-DD) to avoid UTC rollover bugs
const getLocalTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface HydrationRecord {
  volume: number;
  goal: number;
}

interface HydrationState {
  currentDate: string;
  dailyVolume: number;
  dailyGoal: number;
  history: Record<string, HydrationRecord>;

  // Actions
  addWater: (amount: number) => void;
  setGoal: (goal: number) => void;
  checkAndResetDay: () => void;
}

export const useHydrationStore = create<HydrationState>()(
  persist(
    (set, get) => ({
      currentDate: getLocalTodayString(),
      dailyVolume: 0,
      dailyGoal: 2000, // Default goal in ml
      history: {},

      checkAndResetDay: () => {
        const today = getLocalTodayString();
        const state = get();

        // If the date in state doesn't match today's date, roll over the day
        if (state.currentDate !== today) {
          set((prev) => ({
            history: {
              ...prev.history,
              [prev.currentDate]: {
                volume: prev.dailyVolume,
                goal: prev.dailyGoal,
              },
            },
            currentDate: today,
            dailyVolume: 0, 
            // We keep the same dailyGoal for the new day
          }));
        }
      },

      addWater: (amount: number) => {
        get().checkAndResetDay(); // Check if it's a new day before adding
        set((state) => ({
          dailyVolume: state.dailyVolume + amount,
        }));
      },

      setGoal: (goal: number) => {
        set({ dailyGoal: goal });
      },
    }),
    {
      name: "hydration-storage", // Key used in AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
