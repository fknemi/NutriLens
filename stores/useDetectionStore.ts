import { create } from "zustand";
import type { Detection } from "@/components/FoodDetectionCamera";

export interface TrackedFood {
  label: string;
  score: number;
  depth?: number;
  firstSeen: number;
  lastSeen: number;
  count: number; // how many times detected
}

interface DetectionStore {
  foods: Map<string, TrackedFood>;
  addDetections: (dets: Detection[]) => void;
  clear: () => void;
  removeFood: (label: string) => void;
}

// how long before a food is considered "gone" and can be re-added
const EXPIRY_MS = 3000;

export const useDetectionStore = create<DetectionStore>((set, get) => ({
  foods: new Map(),

  addDetections: (dets) => {
    if (dets.length === 0) return;
    const now = Date.now();
    const foods = new Map(get().foods);

    // expire stale entries
    for (const [label, food] of foods) {
      if (now - food.lastSeen > EXPIRY_MS) foods.delete(label);
    }

    for (const det of dets) {
      const existing = foods.get(det.label);
      if (existing) {
        // update in place — no duplicate
        foods.set(det.label, {
          ...existing,
          score: det.score,
          depth: det.depth,
          lastSeen: now,
          count: existing.count + 1,
        });
      } else {
        // new detection
        foods.set(det.label, {
          label: det.label,
          score: det.score,
          depth: det.depth,
          firstSeen: now,
          lastSeen: now,
          count: 1,
        });
      }
    }

    set({ foods });
  },

  clear: () => set({ foods: new Map() }),
  removeFood: (label) => {
    const foods = new Map(get().foods);
    foods.delete(label);
    set({ foods });
  },
}));
