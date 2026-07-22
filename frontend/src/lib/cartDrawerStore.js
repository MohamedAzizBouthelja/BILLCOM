import { create } from "zustand"

// UI-only store for the slide-in cart panel — does not touch cart data itself.
export const useCartDrawerStore = create((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
  toggle: () => set((s) => ({ open: !s.open })),
}))
