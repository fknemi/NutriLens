import { create } from "zustand";

interface HeaderState {
  hidden:              boolean;
  searchIconHidden:    boolean;
  notifIconHidden:     boolean;

  hideHeader:          () => void;
  showHeader:          () => void;
  toggleHeader:        () => void;

  hideSearchIcon:      () => void;
  showSearchIcon:      () => void;
  toggleSearchIcon:    () => void;

  hideNotificationIcon:       () => void;
  showNotificationIcon:       () => void;
  toggleNotificationIcon:     () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
  hidden:           false,
  searchIconHidden: true,
  notifIconHidden:  false,

  hideHeader:       () => set({ hidden: true }),
  showHeader:       () => set({ hidden: false }),
  toggleHeader:     () => set((s) => ({ hidden: !s.hidden })),

  hideSearchIcon:   () => set({ searchIconHidden: true }),
  showSearchIcon:   () => set({ searchIconHidden: false }),
  toggleSearchIcon: () => set((s) => ({ searchIconHidden: !s.searchIconHidden })),

  hideNotificationIcon:    () => set({ notifIconHidden: true }),
  showNotificationIcon:    () => set({ notifIconHidden: false }),
  toggleNotificationIcon:  () => set((s) => ({ notifIconHidden: !s.notifIconHidden })),
}));
