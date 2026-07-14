import { create } from "zustand";

export enum AppTab {
  Index = "index",
  Scan = "scan",
  Diet = "diet",
  Analytics = "analytics",
  Recipes = "recipes",
}

interface TabStore {
  activeTab: AppTab;
  isVisible: boolean;
  setTab: (tab: AppTab) => void;
  hideTabBar: () => void;
  showTabBar: () => void;
}

export const useTabStore = create<TabStore>((set) => ({
  activeTab: AppTab.Index,
  isVisible: true,
  setTab: (tab) => set({ activeTab: tab }),
  hideTabBar: () => set({ isVisible: false }),
  showTabBar: () => set({ isVisible: true }),
}));
