import { create } from "zustand";

export interface ActivityLog {
  id: string;
  name: string;
  type: string;
  duration: number; // Stored in seconds
  caloriesBurned: number;
}

interface ActivityState {
  activities: ActivityLog[];
  addActivity: (activity: Omit<ActivityLog, "id">) => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  addActivity: (activity) =>
    set((state) => ({
      activities: [
        ...state.activities,
        { ...activity, id: Date.now().toString() }, // Generate a simple local ID
      ],
    })),
}));
