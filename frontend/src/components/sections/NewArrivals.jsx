import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { useProductStore } from "../../lib/store.js"
import ProductCard from "../ecommerce/ProductCard.jsx"

export default function NewArrivals() {
  const getNewArrivals = useProductStore((s) => s.getNewArrivals)
  const products = getNewArrivals()

  return (
    <section style={{ padding: "72px 0", background: "var(--gz-surface)" }}>
      <div className="gz-container">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "40px", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div className="section-label">Just Landed</div>
            <h2 style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "2rem", fontWeight: "800", color: "var(--gz-text)" }}>
              New Arrivals
            </h2>
          </div>
          <Link to="/shop?badge=NEW" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f59e0b", fontSize: "0.9rem", fontWeight: "600", textDecoration: "none" }}>
            See All New <ArrowRight size={16} />
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: "20px" }}>
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  )
}
