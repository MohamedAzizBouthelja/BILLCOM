import { create } from "zustand"
import { persist } from "zustand/middleware"

const MAX = 8

// UI/preference store — recently viewed product ids only, does not touch product/cart logic.
export const useRecentlyViewedStore = create(
  persist(
    (set, get) => ({
      ids: [],
      track: (id) => {
        const ids = get().ids.filter((i) => i !== id)
        set({ ids: [id, ...ids].slice(0, MAX) })
      },
    }),
    { name: "gz-recently-viewed" }
  )
)
