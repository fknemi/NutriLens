// stores/useDietStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DietStore {
  diet: string;
  setDiet: (value: string) => void;
}

export const useDietStore = create<DietStore>()(
  persist(
    (set) => ({
      diet: 'Anything',
      setDiet: (value) => set({ diet: value }),
    }),
    {
      name: 'diet-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
