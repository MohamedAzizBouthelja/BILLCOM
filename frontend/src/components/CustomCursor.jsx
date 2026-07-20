import { useEffect, useRef, useState } from "react"

const INTERACTIVE_SELECTOR = "a, button, input, select, [role='button'], .cat-card, .gz-card, .page-btn"

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false)
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const pos = useRef({ x: 0, y: 0 })
  const ringPos = useRef({ x: 0, y: 0 })
  const rafRef = useRef(null)

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return
    setEnabled(true)
    document.documentElement.classList.add("gz-cursor-active")

    const onMove = (e) => { pos.current = { x: e.clientX, y: e.clientY } }
    const onOver = (e) => {
      if (e.target.closest?.(INTERACTIVE_SELECTOR)) ringRef.current?.classList.add("hovered")
    }
    const onOut = (e) => {
      if (e.target.closest?.(INTERACTIVE_SELECTOR)) ringRef.current?.classList.remove("hovered")
    }

    const tick = () => {
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.18
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.18
      if (dotRef.current) dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`
      if (ringRef.current) ringRef.current.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px) translate(-50%, -50%)`
      rafRef.current = requestAnimationFrame(tick)
    }

    window.addEventListener("mousemove", onMove)
    document.addEventListener("mouseover", onOver)
    document.addEventListener("mouseout", onOut)
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      document.documentElement.classList.remove("gz-cursor-active")
      window.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseover", onOver)
      document.removeEventListener("mouseout", onOut)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  if (!enabled) return null

  return (
    <>
      <div ref={dotRef} className="gz-cursor-dot" />
      <div ref={ringRef} className="gz-cursor-ring" />
    </>
  )
}
