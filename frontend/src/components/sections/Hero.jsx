import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { ShoppingCart, ArrowRight, Zap } from "lucide-react"
import { motion, useInView } from "framer-motion"
import ScrollProductCanvas from "../ScrollProductCanvas.jsx"

function CountUp({ target, suffix = "", decimals = 0, duration = 1800 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const rafRef = useRef(null)
  const inView = useInView(ref, { once: false, margin: "-50px" })

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (!inView) {
      setCount(0)
      return
    }
    const startTime = performance.now()

    const tick = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(eased * target)
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
      else setCount(target)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [inView, target, duration])

  return (
    <span ref={ref}>
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}{suffix}
    </span>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
  }),
}

const wordVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 },
  }),
}

export default function Hero() {
  const titleWords = ["Your", "World."]
  const titleWordsAccent = ["Next-Level"]
  const titleWordsTech = ["Technology."]

  return (
    <>
      {/* ── Static hero section ──────────────────────────────────────────────── */}
      <section
        style={{
          paddingTop: "120px",
          paddingBottom: "80px",
          background: "linear-gradient(135deg, var(--gz-bg) 0%, var(--gz-surface) 50%, var(--gz-bg) 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow */}
        <div style={{ position: "absolute", top: "20%", left: "10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", right: "5%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div className="gz-container">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: "780px", margin: "0 auto" }}>

            {/* Badge */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, margin: "-60px" }}
              custom={0}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "999px", padding: "6px 14px", marginBottom: "28px" }}
            >
              <Zap size={13} color="#f59e0b" />
              <span style={{ fontSize: "0.78rem", color: "#f59e0b", fontWeight: "600", letterSpacing: "0.05em" }}>Next-Level Technology</span>
            </motion.div>

            {/* Animated heading — word by word */}
            <h1
              style={{
                fontFamily: "Bricolage Grotesque, sans-serif",
                fontSize: "clamp(2.4rem, 6vw, 4rem)",
                fontWeight: "800",
                lineHeight: "1.08",
                letterSpacing: "-0.02em",
                color: "var(--gz-text)",
                marginBottom: "24px",
                overflow: "hidden",
              }}
            >
              <span style={{ display: "flex", justifyContent: "center", gap: "0.4em", flexWrap: "wrap" }}>
                {titleWords.map((word, i) => (
                  <motion.span
                    key={word}
                    custom={0.2 + i * 0.12}
                    variants={wordVariants}
                    initial="hidden"
                    animate="visible"
                    style={{ display: "inline-block" }}
                  >
                    {word}
                  </motion.span>
                ))}
                {titleWordsAccent.map((word, i) => (
                  <motion.span
                    key={word}
                    custom={0.44 + i * 0.12}
                    variants={wordVariants}
                    initial="hidden"
                    animate="visible"
                    style={{ display: "inline-block", color: "#f59e0b" }}
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
              <span style={{ display: "flex", justifyContent: "center" }}>
                {titleWordsTech.map((word, i) => (
                  <motion.span
                    key={word}
                    custom={0.56 + i * 0.12}
                    variants={wordVariants}
                    initial="hidden"
                    animate="visible"
                    style={{ display: "inline-block" }}
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
            </h1>

            {/* Description */}
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, margin: "-60px" }}
              custom={0.7}
              style={{ fontSize: "1.15rem", color: "var(--gz-text)", lineHeight: "1.75", marginBottom: "36px", maxWidth: "560px", opacity: 0.85 }}
            >
              Discover the latest gadgets — smartphones, laptops, audio gear, cameras and more.
              All in one place, with fast delivery and unbeatable prices.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, margin: "-60px" }}
              custom={0.85}
              style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center", marginBottom: "48px" }}
            >
              <Link to="/shop" className="btn-primary" style={{ gap: "8px" }}>
                <ShoppingCart size={16} /> Shop Now
              </Link>
              <Link to="/shop?badge=SALE" className="btn-outline" style={{ gap: "8px" }}>
                Explore Deals <ArrowRight size={15} />
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, margin: "-60px" }}
              custom={1.1}
              style={{ display: "flex", gap: "48px", flexWrap: "wrap", justifyContent: "center", marginBottom: "40px" }}
            >
              {[
                { target: 500,  suffix: "+",  decimals: 0, label: "Products" },
                { target: 50,   suffix: "K+", decimals: 0, label: "Happy Customers" },
                { target: 4.9,  suffix: "★",  decimals: 1, label: "Average Rating" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.5rem", fontWeight: "800", letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", color: "#f59e0b" }}>
                    <CountUp target={s.target} suffix={s.suffix} decimals={s.decimals} />
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--gz-text2)", fontWeight: "500" }}>{s.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Scroll down indicator */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer" }}
              onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })}
            >
              <span style={{ fontSize: "0.72rem", color: "var(--gz-text2)", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: "600" }}>
                Scroll Down
              </span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                style={{
                  width: "28px", height: "44px",
                  border: "2px solid rgba(245,158,11,0.4)",
                  borderRadius: "14px",
                  display: "flex", alignItems: "flex-start", justifyContent: "center",
                  paddingTop: "6px",
                }}
              >
                <motion.div
                  animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                  style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#f59e0b" }}
                />
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Full-screen scroll canvas section ─────────────────────────────────── */}
      <ScrollProductCanvas />
    </>
  )
}
