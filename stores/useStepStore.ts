// store/useStepStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type StepState = {
  steps: number;
  goal: number;
  lastResetDate: string; // 'YYYY-MM-DD'
  setSteps: (steps: number) => void;
  setGoal: (goal: number) => void;
  checkAndResetForNewDay: () => void;
};

const todayStr = () => new Date().toISOString().split('T')[0];

export const useStepStore = create<StepState>()(
  persist(
    (set, get) => ({
      steps: 0,
      goal: 10000,
      lastResetDate: todayStr(),

      setSteps: (steps) => set({ steps }),

      setGoal: (goal) => set({ goal }),

      checkAndResetForNewDay: () => {
        if (get().lastResetDate !== todayStr()) {
          set({ steps: 0, lastResetDate: todayStr() });
        }
      },
    }),
    {
      name: 'step-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
