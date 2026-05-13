// store/useSleepStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SleepSession = {
  id: string;
  bedtime: number;    // unix ms
  wakeTime: number;   // unix ms
  durationMs: number;
};

type SleepState = {
  sleeping: boolean;
  bedtime: number | null;           // currently sleeping since
  sessions: SleepSession[];         // completed sessions

  startSleep: () => void;
  stopSleep: () => void;
  deleteSession: (id: string) => void;
  todaysSessions: () => SleepSession[];
  totalSleepToday: () => number;    // ms
};

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
};

export const useSleepStore = create<SleepState>()(
  persist(
    (set, get) => ({
      sleeping: false,
      bedtime: null,
      sessions: [],

      startSleep: () => {
        if (get().sleeping) return;
        set({ sleeping: true, bedtime: Date.now() });
      },

      stopSleep: () => {
        const { sleeping, bedtime, sessions } = get();
        if (!sleeping || !bedtime) return;

        const wakeTime = Date.now();
        const session: SleepSession = {
          id: `${bedtime}`,
          bedtime,
          wakeTime,
          durationMs: wakeTime - bedtime,
        };

        set({
          sleeping: false,
          bedtime: null,
          sessions: [...sessions, session],
        });
      },

      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        })),

      todaysSessions: () => {
        const { start, end } = todayRange();
        return get().sessions.filter(
          (s) => s.wakeTime >= start && s.wakeTime <= end
        );
      },

      totalSleepToday: () => {
        return get()
          .todaysSessions()
          .reduce((acc, s) => acc + s.durationMs, 0);
      },
    }),
    {
      name: 'sleep-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
