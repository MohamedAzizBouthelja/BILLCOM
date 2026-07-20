import { useState } from "react"
import { motion } from "framer-motion"
import { usePerformance } from "../hooks/usePerformance"

const BOLT_PATH = "M13 2 4 14h6l-1 8 9-12h-6l1-8z"

const SPARKS = [
  { dx: -16, dy: -13, delay: 0 },
  { dx: 17, dy: -9, delay: 0.03 },
  { dx: 2, dy: -19, delay: 0.06 },
]

export default function LogoMark({ size = 40 }) {
  const { shouldReduceMotion } = usePerformance()
  const [hovered, setHovered] = useState(false)
  const [burstId, setBurstId] = useState(0)

  return (
    <div
      onMouseEnter={() => {
        setHovered(true)
        if (!shouldReduceMotion) setBurstId((id) => id + 1)
      }}
      onMouseLeave={() => setHovered(false)}
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <motion.div
        animate={shouldReduceMotion ? {} : { scale: hovered ? 1.08 : 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: hovered ? "0 0 18px rgba(245,158,11,0.55)" : "0 0 0 rgba(245,158,11,0)",
          transition: "box-shadow 0.25s ease",
        }}
      >
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
          {shouldReduceMotion ? (
            <path d={BOLT_PATH} fill="#0a0a0f" />
          ) : (
            <>
              {/* Phase 1 — traces the outline once on mount */}
              <motion.path
                d={BOLT_PATH}
                fill="transparent"
                stroke="#0a0a0f"
                strokeWidth={1.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
              />
              {/* Phase 2 — fill fades in as the trace finishes */}
              <motion.path
                d={BOLT_PATH}
                fill="#0a0a0f"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.5 }}
              />
            </>
          )}
        </svg>
      </motion.div>

      {!shouldReduceMotion && burstId > 0 && (
        <div key={burstId} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {SPARKS.map((s, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{ opacity: 0, x: s.dx, y: s.dy, scale: 0.3 }}
              transition={{ duration: 0.5, delay: s.delay, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                background: "#fcd34d",
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const WORDMARK_LETTERS = [
  ...[..."Gadget"].map((ch) => ({ ch, color: "#f59e0b" })),
  ...[..."Zone"].map((ch) => ({ ch, color: "var(--gz-text)" })),
]

export function LogoWordmark({ fontSize = "1.35rem", tagline = true }) {
  const { shouldReduceMotion } = usePerformance()

  if (shouldReduceMotion) {
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize, fontWeight: "800", lineHeight: "1.15", letterSpacing: "-0.01em" }}>
          <span style={{ color: "#f59e0b" }}>Gadget</span><span style={{ color: "var(--gz-text)" }}>Zone</span>
        </span>
        {tagline && (
          <span style={{ fontSize: "0.6rem", color: "var(--gz-text2)", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: "600" }}>
            Tech Store
          </span>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize, fontWeight: "800", lineHeight: "1.15", letterSpacing: "-0.01em", display: "inline-flex" }}>
        {WORDMARK_LETTERS.map((l, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{
              opacity: 1,
              y: 0,
              textShadow: [
                "0 0 0px rgba(245,158,11,0)",
                "0 0 14px rgba(245,158,11,0.85)",
                "0 0 0px rgba(245,158,11,0)",
              ],
            }}
            transition={{
              opacity: { duration: 0.3, delay: i * 0.035 },
              y: { duration: 0.3, delay: i * 0.035, ease: [0.22, 1, 0.36, 1] },
              textShadow: { duration: 0.55, delay: i * 0.035, times: [0, 0.35, 1] },
            }}
            style={{ color: l.color, display: "inline-block" }}
          >
            {l.ch}
          </motion.span>
        ))}
      </span>
      {tagline && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: WORDMARK_LETTERS.length * 0.035 + 0.15 }}
          style={{ fontSize: "0.6rem", color: "var(--gz-text2)", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: "600" }}
        >
          Tech Store
        </motion.span>
      )}
    </div>
  )
}
