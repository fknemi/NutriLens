import { create } from "zustand";

interface HeaderState {
  hidden: boolean;
  searchIconHidden: boolean;
  notifIconHidden: boolean;

  hideHeader: () => void;
  showHeader: () => void;
  toggleHeader: () => void;

  hideSearchIcon: () => void;
  showSearchIcon: () => void;
  toggleSearchIcon: () => void;

  hideNotificationIcon: () => void;
  showNotificationIcon: () => void;
  toggleNotificationIcon: () => void;

  hideProfileIcon: () => void;
  showProfileIcon: () => void;
  toggleProfileIcon: () => void;

  hideBackIcon: () => void;
  showBackIcon: () => void;
  toggleBackIcon: () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
  hidden: false,
  searchIconHidden: true,
  notificationIconHidden: false,
  backIconHidden: false,
  profileIconHidden: false,

  hideHeader: () => set({ hidden: true }),
  showHeader: () => set({ hidden: false }),
  toggleHeader: () => set((s) => ({ hidden: !s.hidden })),

  hideSearchIcon: () => set({ searchIconHidden: true }),
  showSearchIcon: () => set({ searchIconHidden: false }),
  toggleSearchIcon: () =>
    set((s) => ({ searchIconHidden: !s.searchIconHidden })),

  hideNotificationIcon: () => set({ notificationIconHidden: true }),
  showNotificationIcon: () => set({ notificationIconHidden: false }),
  toggleNotificationIcon: () =>
    set((s) => ({ notificationIconHidden: !s.notificationIconHidden })),

  hideProfileIcon: () => set({ profileIconHidden: true }),
  showProfileIcon: () => set({ profileIconHidden: false }),
  toggleProfileIcon: () =>
    set((s) => ({ profileIconHidden: !s.notificationIconHidden })),

  hideBackIcon: () => set({ backIconHidden: true }),
  showBackIcon: () => set({ backIconHidden: false }),
  toggleBackIcon: () =>
    set((s) => ({ backIconHidden: !s.notificationIconHidden })),
}));
