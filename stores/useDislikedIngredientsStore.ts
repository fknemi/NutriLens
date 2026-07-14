// stores/useDislikedIngredientsStore
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DislikedIngredientsStore {
  ingredients: string[]; // <-- Changed from string to string[]
  setIngredients: (value: string[]) => void; // <-- Changed from string to string[]
}

export const useDislikedIngredientsStore = create<DislikedIngredientsStore>()(
  persist(
    (set) => ({
      ingredients: [], // <-- Initialized as an empty array instead of ''
      setIngredients: (value) => set({ ingredients: value }),
    }),
    {
      name: 'disliked-ingredients-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
