import { useRef } from "react"

const ENABLED = typeof window !== "undefined"
  && window.matchMedia("(pointer: fine)").matches
  && !window.matchMedia("(prefers-reduced-motion: reduce)").matches

// Spreads onto a Link/button: subtly pulls the element toward the cursor
// within its own bounds. Disabled on touch devices and reduced-motion.
export function useMagnetic(strength = 0.3) {
  const ref = useRef(null)

  const onMouseMove = (e) => {
    if (!ENABLED || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - (rect.left + rect.width / 2)
    const y = e.clientY - (rect.top + rect.height / 2)
    ref.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`
  }

  const onMouseLeave = () => {
    if (ref.current) ref.current.style.transform = ""
  }

  return { ref, onMouseMove, onMouseLeave }
}
