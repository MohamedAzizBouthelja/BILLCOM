import { create } from "zustand"
import { persist } from "zustand/middleware"

// UI/preference store — saved product ids only, does not touch cart/auth/product logic.
export const useWishlistStore = create(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (product) => {
        const ids = get().ids
        set({ ids: ids.includes(product.id) ? ids.filter((id) => id !== product.id) : [...ids, product.id] })
      },
      has: (id) => get().ids.includes(id),
      remove: (id) => set({ ids: get().ids.filter((i) => i !== id) }),
    }),
    { name: "gz-wishlist" }
  )
)
