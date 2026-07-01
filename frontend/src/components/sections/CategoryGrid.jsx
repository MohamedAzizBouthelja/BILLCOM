import { Link } from "react-router-dom"
import { CATEGORIES, SAMPLE_PRODUCTS } from "../../lib/store.js"

export default function CategoryGrid() {
  const countFor = (slug) => SAMPLE_PRODUCTS.filter((p) => p.category === slug).length

  return (
    <section style={{ padding: "72px 0" }}>
      <div className="gz-container">
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="section-label">Shop by Category</div>
          <h2 style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "2rem", fontWeight: "800", color: "var(--gz-text)" }}>
            Browse Our Collections
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: "16px" }}>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={"/shop?cat=" + cat.slug}
              className="cat-card"
              style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}
            >
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "20px",
                background: "var(--gz-surface2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                overflow: "hidden",
                flexShrink: 0,
              }}>
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  decoding="async"
                  style={{ width: "56px", height: "56px", objectFit: "contain", display: "block" }}
                />
              </div>
              <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontWeight: "700", fontSize: "0.95rem", color: "var(--gz-text)", marginBottom: "6px" }}>{cat.name}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--gz-text2)" }}>{countFor(cat.slug)} items</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
