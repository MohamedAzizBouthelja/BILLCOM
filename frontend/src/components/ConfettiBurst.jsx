import { useMemo } from "react"
import { motion } from "framer-motion"

const COLORS = ["#f59e0b", "#fcd34d", "#38bdf8", "#22c55e", "#ef4444", "#a78bfa"]

function makeParticles(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    x: (Math.random() - 0.5) * 2 * (140 + Math.random() * 220),
    fall: 480 + Math.random() * 260,
    rotate: Math.random() * 720 - 360,
    delay: Math.random() * 0.2,
    duration: 1.5 + Math.random() * 0.6,
    size: 6 + Math.random() * 6,
    round: Math.random() > 0.5,
  }))
}

// One-shot celebratory burst — mounts once, animates, unmounts itself via the
// parent conditionally rendering it (no internal timer needed since particles
// use pointerEvents:none and fade to opacity 0 before disappearing visually).
export default function ConfettiBurst({ count = 70 }) {
  const particles = useMemo(() => makeParticles(count), [count])

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 2000, overflow: "hidden" }} aria-hidden="true">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          style={{
            position: "absolute", top: "35%", left: "50%",
            width: p.size, height: p.size,
            background: p.color,
            borderRadius: p.round ? "50%" : "2px",
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.fall, opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  )
}
