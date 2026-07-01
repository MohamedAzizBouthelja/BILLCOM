import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { useProductStore } from "../../lib/store.js"
import ProductCard from "../ecommerce/ProductCard.jsx"

export default function FeaturedProducts() {
  const getFeatured = useProductStore((s) => s.getFeatured)
  const products = getFeatured()

  return (
    <section style={{ padding: "72px 0" }}>
      <div className="gz-container">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "40px", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div className="section-label">Hand-Picked</div>
            <h2 style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "2rem", fontWeight: "800", color: "var(--gz-text)" }}>
              Featured Products
            </h2>
          </div>
          <Link to="/shop" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f59e0b", fontSize: "0.9rem", fontWeight: "600", textDecoration: "none" }}
            onMouseEnter={(e) => e.currentTarget.style.gap = "10px"}
            onMouseLeave={(e) => e.currentTarget.style.gap = "6px"}>
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: "20px" }}>
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  )
}
