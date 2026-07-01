import { useState, useEffect } from 'react'

export function usePerformance() {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false)

  useEffect(() => {
    const isMobile = window.innerWidth < 768
    const isLowCPU = navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency < 4
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setShouldReduceMotion(isMobile || isLowCPU || prefersReducedMotion)
  }, [])

  return { shouldReduceMotion }
}
