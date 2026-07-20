import { useScrollReveal } from "../../hooks/useScrollReveal.js"

const TESTIMONIALS = [
  { name: "Sarah Johnson", location: "New York, USA", rating: 5, text: "Absolutely love my new iPhone from GadgetZone! Super fast delivery and the product was exactly as described. Will definitely shop here again." },
  { name: "Ahmed Hassan",  location: "Dubai, UAE",    rating: 5, text: "Best tech store online! Got my MacBook M3 at an amazing price. The customer service team was very helpful and responded quickly." },
  { name: "Lisa Chen",     location: "Singapore",     rating: 5, text: "Ordered Sony headphones and they arrived in perfect condition. Packaging was excellent and the 7-day return policy gave me great peace of mind." },
]

function initials(name) { return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() }

export default function Testimonials() {
  const [ref, isVisible] = useScrollReveal(0.15)

  return (
    <section style={{ padding: "72px 0" }}>
      <div className="gz-container" ref={ref}>
        <div className={`reveal-up${isVisible ? " is-visible" : ""}`} style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="section-label">What Customers Say</div>
          <h2 className="section-title">Customer Reviews</h2>
          <p className="section-subtitle">Real feedback from real GadgetZone shoppers around the world.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: "20px" }}>
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className={`reveal-scale${isVisible ? " is-visible" : ""}`}
              style={{ transitionDelay: `${isVisible ? i * 100 : 0}ms`, padding: "8px 4px", borderTop: "1px solid var(--gz-border)" }}
            >
              <div style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "3rem", fontWeight: "800", color: "var(--gz-accent2)", opacity: 0.35, lineHeight: "1", marginTop: "16px" }}>&ldquo;</div>
              <div className="stars" style={{ margin: "8px 0 14px" }}>{"★".repeat(t.rating)}</div>
              <p style={{ color: "var(--gz-text2)", fontSize: "0.95rem", lineHeight: "1.75", marginBottom: "24px" }}>{t.text}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "0.85rem", color: "#0a0a0f", flexShrink: 0 }}>
                  {initials(t.name)}
                </div>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--gz-text)" }}>{t.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--gz-text2)" }}>{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
