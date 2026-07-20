import { useScrollReveal } from "../../hooks/useScrollReveal.js"

export default function Newsletter() {
  const [ref, isVisible] = useScrollReveal(0.15)

  return (
    <section className="newsletter-section" style={{ padding: "72px 0" }}>
      <div ref={ref} className={`gz-container reveal-up${isVisible ? " is-visible" : ""}`} style={{ textAlign: "center", maxWidth: "768px" }}>
        <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "2rem", fontWeight: "800", color: "#0a0a0f", marginBottom: "12px" }}>
          Get Exclusive Deals First 🎉
        </h2>
        <p style={{ color: "rgba(10,10,15,0.7)", fontSize: "1rem", marginBottom: "32px" }}>
          Subscribe to our newsletter and be the first to know about flash sales, new arrivals, and special offers.
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          style={{ display: "flex", gap: "8px", maxWidth: "480px", margin: "0 auto" }}
        >
          <input
            type="email"
            placeholder="Enter your email address"
            style={{
              flex: 1,
              padding: "13px 18px",
              borderRadius: "999px",
              border: "none",
              background: "rgba(10,10,15,0.12)",
              color: "#0a0a0f",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "13px 24px",
              borderRadius: "999px",
              background: "var(--gz-bg)",
              color: "#f59e0b",
              fontWeight: "700",
              fontSize: "0.9rem",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  )
}
