import { create } from "zustand"

// UI-only store for the Quick View modal — does not touch cart/auth/product logic.
export const useQuickViewStore = create((set) => ({
  product: null,
  show: (product) => set({ product }),
  hide: () => set({ product: null }),
}))
