// stores/useAllergensStore
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AllergensStore {
  allergens: string[];
  toggleAllergen: (item: string) => void;
  addCustomAllergen: (item: string) => void;
}

export const useAllergensStore = create<AllergensStore>()(
  persist(
    (set) => ({
      allergens: [],
      toggleAllergen: (item) =>
        set((state) => ({
          allergens: state.allergens.includes(item)
            ? state.allergens.filter((a) => a !== item)
            : [...state.allergens, item],
        })),
      addCustomAllergen: (item) =>
        set((state) => ({
          allergens: state.allergens.includes(item)
            ? state.allergens
            : [...state.allergens, item],
        })),
    }),
    {
      name: 'allergens-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
