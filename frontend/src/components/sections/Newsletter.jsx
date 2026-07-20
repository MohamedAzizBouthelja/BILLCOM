import { Mail } from "lucide-react"
import { useScrollReveal } from "../../hooks/useScrollReveal.js"

export default function Newsletter() {
  const [ref, isVisible] = useScrollReveal(0.15)

  return (
    <section className="newsletter-section" style={{ padding: "80px 0" }}>
      <div ref={ref} className={`gz-container reveal-up${isVisible ? " is-visible" : ""}`} style={{ textAlign: "center", maxWidth: "640px", position: "relative" }}>
        <div style={{
          width: "52px", height: "52px", borderRadius: "50%", margin: "0 auto 20px",
          background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Mail size={22} color="#f59e0b" strokeWidth={1.7} />
        </div>
        <h2 className="section-title" style={{ marginBottom: "12px" }}>
          Get Exclusive Deals First
        </h2>
        <p style={{ color: "var(--gz-text2)", fontSize: "1rem", lineHeight: "1.7", marginBottom: "32px" }}>
          Subscribe to our newsletter and be the first to know about flash sales, new arrivals, and special offers.
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          style={{ display: "flex", gap: "10px", maxWidth: "440px", margin: "0 auto" }}
        >
          <input
            type="email"
            placeholder="Enter your email address"
            className="gz-input"
            style={{ flex: 1, borderRadius: "999px", padding: "12px 20px" }}
          />
          <button type="submit" className="btn-primary" style={{ borderRadius: "999px", whiteSpace: "nowrap" }}>
            Subscribe
          </button>
        </form>
      </div>
    </section>
  )
}
