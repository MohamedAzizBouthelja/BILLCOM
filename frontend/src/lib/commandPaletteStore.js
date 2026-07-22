import { create } from "zustand"

// UI-only store for the Ctrl+K command palette.
export const useCommandPaletteStore = create((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
  toggle: () => set((s) => ({ open: !s.open })),
}))
