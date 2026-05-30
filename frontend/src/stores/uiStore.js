import { create } from "zustand";

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  notifications: [],

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  addNotification: (n) => set((s) => ({ notifications: [...s.notifications, n] })),
  clearNotifications: () => set({ notifications: [] }),
}));
