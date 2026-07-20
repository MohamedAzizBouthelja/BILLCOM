import { Link } from "react-router-dom"
import { Smartphone } from "lucide-react"
import { CATEGORIES, SAMPLE_PRODUCTS } from "../../lib/store.js"
import { CATEGORY_ICONS } from "../../lib/categoryIcons.js"
import { useScrollReveal } from "../../hooks/useScrollReveal.js"

export default function CategoryGrid() {
  const countFor = (slug) => SAMPLE_PRODUCTS.filter((p) => p.category === slug).length
  const [ref, isVisible] = useScrollReveal(0.15)

  return (
    <section style={{ padding: "72px 0" }}>
      <div className="gz-container" ref={ref}>
        <div className={`reveal-up${isVisible ? " is-visible" : ""}`} style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="section-label">Shop by Category</div>
          <h2 className="section-title">Browse Our Collections</h2>
          <p className="section-subtitle">Six curated categories, hand-picked so you find the right gadget faster.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: "16px" }}>
          {CATEGORIES.map((cat, i) => {
            const Icon = CATEGORY_ICONS[cat.slug] || Smartphone
            return (
              <div
                key={cat.slug}
                className={`reveal-up${isVisible ? " is-visible" : ""}`}
                style={{ transitionDelay: `${isVisible ? i * 70 : 0}ms` }}
              >
                <Link
                  to={"/shop?cat=" + cat.slug}
                  className="cat-card"
                  style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}
                >
                  <div className="cat-icon" style={{
                    width: "72px",
                    height: "72px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    flexShrink: 0,
                  }}>
                    <Icon size={28} strokeWidth={1.6} />
                  </div>
                  <div style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "700", fontSize: "0.95rem", color: "var(--gz-text)", marginBottom: "6px" }}>{cat.name}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--gz-text2)" }}>{countFor(cat.slug)} items</div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
