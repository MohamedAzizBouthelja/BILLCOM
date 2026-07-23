import { useEffect, useState } from "react"

// True once a zustand `persist` store has restored its localStorage snapshot.
// Without this, a store's initial-state default (e.g. an empty cart) can
// flash on first paint before the real persisted value loads a moment later.
export function useHydrated(store) {
  const [hydrated, setHydrated] = useState(() => store.persist.hasHydrated())

  useEffect(() => {
    if (store.persist.hasHydrated()) { setHydrated(true); return }
    return store.persist.onFinishHydration(() => setHydrated(true))
  }, [store])

  return hydrated
}
