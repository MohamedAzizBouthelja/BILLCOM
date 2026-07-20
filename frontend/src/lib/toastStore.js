import { create } from "zustand"

// UI-only store — purely for the "added to cart" toast, does not touch cart/auth/product logic.
export const useCartToastStore = create((set) => ({
  toast: null,
  show: (product, qty = 1) => set({ toast: { product, qty, key: Date.now() } }),
  hide: () => set({ toast: null }),
}))
