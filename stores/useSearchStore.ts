import { create } from "zustand";

interface SearchState {
  hidden: boolean;

  hideSearch:   () => void;
  showSearch:   () => void;
  toggleSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  hidden: false,

  hideSearch:   () => set({ hidden: true }),
  showSearch:   () => set({ hidden: false }),
  toggleSearch: () => set((s) => ({ hidden: !s.hidden })),
}));
