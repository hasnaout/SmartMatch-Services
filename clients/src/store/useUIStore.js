import { create } from "zustand";

const useUIStore = create((set) => ({
  // ── Sidebar ────────────────────────────────────────────
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (val) => set({ sidebarOpen: val }),

  // ── Modal global ───────────────────────────────────────
  modal: null,   // { type, props }
  openModal:  (type, props = {}) => set({ modal: { type, props } }),
  closeModal: ()                 => set({ modal: null }),

  // ── Loading global (ex: transitions de page) ───────────
  pageLoading: false,
  setPageLoading: (val) => set({ pageLoading: val }),
}));

export default useUIStore;