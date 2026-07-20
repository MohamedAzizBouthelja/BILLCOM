import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"

export default function ScrollProgress() {
  const barRef = useRef(null)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - doc.clientHeight
      const pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0
      if (barRef.current) barRef.current.style.width = pct + "%"
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [pathname])

  return (
    <div className="gz-scroll-progress-track">
      <div ref={barRef} className="gz-scroll-progress-bar" />
    </div>
  )
}
