// stores/useMeditationStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MeditationSession {
  id: string;
  durationSeconds: number;
  date: string;
}

interface MeditationState {
  sessions: MeditationSession[];
  dailyGoalMinutes: number;
  addSession: (durationSeconds: number) => void;
  setDailyGoal: (minutes: number) => void;
}

export const useMeditationStore = create<MeditationState>()(
  persist(
    (set) => ({
      sessions: [],
      dailyGoalMinutes: 10, // Default goal: 10 minutes a day
      
      addSession: (durationSeconds) =>
        set((state) => ({
          sessions: [
            ...state.sessions,
            {
              id: Date.now().toString(),
              durationSeconds,
              date: new Date().toISOString(),
            },
          ],
        })),
        
      setDailyGoal: (minutes) => set({ dailyGoalMinutes: minutes }),
    }),
    {
      name: 'meditation-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
