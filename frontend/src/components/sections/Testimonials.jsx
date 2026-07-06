const TESTIMONIALS = [
  { name: "Sarah Johnson", location: "New York, USA", rating: 5, text: "Absolutely love my new iPhone from GadgetZone! Super fast delivery and the product was exactly as described. Will definitely shop here again." },
  { name: "Ahmed Hassan",  location: "Dubai, UAE",    rating: 5, text: "Best tech store online! Got my MacBook M3 at an amazing price. The customer service team was very helpful and responded quickly." },
  { name: "Lisa Chen",     location: "Singapore",     rating: 5, text: "Ordered Sony headphones and they arrived in perfect condition. Packaging was excellent and the 7-day return policy gave me great peace of mind." },
]

function initials(name) { return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() }

export default function Testimonials() {
  return (
    <section style={{ padding: "72px 0" }}>
      <div className="gz-container">
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="section-label">What Customers Say</div>
          <h2 style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "2rem", fontWeight: "800", color: "var(--gz-text)" }}>
            Customer Reviews
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: "20px" }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="gz-card" style={{ padding: "24px" }}>
              <div className="stars" style={{ marginBottom: "14px" }}>{"★".repeat(t.rating)}</div>
              <p style={{ color: "var(--gz-text2)", fontSize: "0.9rem", lineHeight: "1.7", marginBottom: "20px" }}>&ldquo;{t.text}&rdquo;</p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "IBM Plex Sans, sans-serif", fontWeight: "800", fontSize: "0.85rem", color: "#0a0a0f", flexShrink: 0 }}>
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
