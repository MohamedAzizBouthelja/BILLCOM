import { useState, useId } from "react"
import { motion } from "framer-motion"
import { usePerformance } from "../hooks/usePerformance"

// Bold faceted "Z" monogram, drawn as a single stroked path (miter joins keep
// the three segments — top bar / diagonal / bottom bar — perfectly seamless).
const Z_PATH = "M 50 66 L 150 66 L 50 134 L 150 134"

const SPARKS = [
  { dx: -16, dy: -13, delay: 0 },
  { dx: 17, dy: -9, delay: 0.03 },
  { dx: 2, dy: -19, delay: 0.06 },
]

export default function LogoMark({ size = 40 }) {
  const { shouldReduceMotion } = usePerformance()
  const [hovered, setHovered] = useState(false)
  const [burstId, setBurstId] = useState(0)
  const gradId = useId()

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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: hovered ? "drop-shadow(0 0 10px rgba(245,158,11,0.55))" : "drop-shadow(0 0 0 rgba(245,158,11,0))",
          transition: "filter 0.25s ease",
        }}
      >
        <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="55%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {/* Rounded-square frame — outline only, transparent inside */}
          <rect x="14" y="14" width="172" height="172" rx="40" stroke={`url(#${gradId})`} strokeWidth="11" />

          {shouldReduceMotion ? (
            <path d={Z_PATH} stroke={`url(#${gradId})`} strokeWidth="32" strokeLinecap="square" strokeLinejoin="miter" />
          ) : (
            <motion.path
              d={Z_PATH}
              stroke={`url(#${gradId})`}
              strokeWidth="32"
              strokeLinecap="square"
              strokeLinejoin="miter"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
            />
          )}

          {/* Facet seams — subtle highlight/shadow suggesting folded facets */}
          <line x1="66" y1="58" x2="82" y2="74" stroke="#fff7ed" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" />
          <line x1="118" y1="126" x2="134" y2="142" stroke="#78350f" strokeWidth="2" strokeOpacity="0.35" strokeLinecap="round" />
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
