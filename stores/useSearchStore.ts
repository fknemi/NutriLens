import { create } from "zustand";

interface SearchState {
  hidden: boolean;
  value: string;

  hideSearch:   () => void;
  showSearch:   () => void;
  toggleSearch: () => void;
  setValue:     (value: string) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  hidden: false,
  value: "",

  hideSearch:   () => set({ hidden: true }),
  showSearch:   () => set({ hidden: false }),
  toggleSearch: () => set((s) => ({ hidden: !s.hidden })),
  setValue:     (value) => set({ value }),
}));
