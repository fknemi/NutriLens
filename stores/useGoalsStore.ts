import { create } from "zustand";

interface GoalsState {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  setGoal: (key: "calories" | "protein" | "carbs" | "fat", value: number) => void;
}

export const useGoalsStore = create<GoalsState>((set) => ({
  calories: 2000,
  protein: 140,
  carbs: 210,
  fat: 65,
  setGoal: (key, value) => set((state) => ({ ...state, [key]: value })),
}));
