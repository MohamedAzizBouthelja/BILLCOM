import { Link } from "react-router-dom"
import { ShoppingCart, Star, Eye } from "lucide-react"
import { useCartStore, formatPrice } from "../../lib/store.js"
import { flyToCart } from "../../lib/flyToCart.js"

export default function ProductCard({ product }) {
  const { addItem } = useCartStore()

  const badgeClassFor = (b) => {
    if (b === "NEW")  return "badge-new"
    if (b === "HOT")  return "badge-hot"
    if (b === "SALE") return "badge-sale"
    return ""
  }

  return (
    <div className="gz-card" style={{ position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {product.badge && (
        <span className={`gz-badge ${badgeClassFor(product.badge)}`} style={{ position: "absolute", top: "10px", left: "10px", zIndex: 2 }}>
          {product.badge}
        </span>
      )}

      <Link to={"/product/" + product.slug} style={{ display: "block", textDecoration: "none" }}>
        <div className="pc-image-wrap">
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s ease" }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          />
          <div className="pc-quickview">
            <span className="pc-quickview-pill"><Eye size={13} /> Quick View</span>
          </div>
        </div>
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{product.category_name}</div>
          <h3 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "700", fontSize: "0.9rem", color: "var(--gz-text)", marginBottom: "8px", lineHeight: "1.3", minHeight: "38px" }}>
            {product.name}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "10px" }}>
            <span className="stars">{"★".repeat(Math.round(product.rating))}</span>
            <span style={{ fontSize: "0.75rem", color: "var(--gz-text2)" }}>({product.reviews})</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.05rem", fontWeight: "800", color: "#f59e0b" }}>{formatPrice(product.price)}</span>
            {product.old_price && (
              <span style={{ fontSize: "0.8rem", color: "var(--gz-text2)", textDecoration: "line-through" }}>{formatPrice(product.old_price)}</span>
            )}
          </div>
        </div>
      </Link>

      <div style={{ padding: "12px 16px 16px", marginTop: "auto" }}>
        <button
          onClick={(e) => { addItem(product); flyToCart(e.currentTarget) }}
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center", padding: "10px 16px", fontSize: "0.82rem" }}
        >
          <ShoppingCart size={14} /> Add to Cart
        </button>
      </div>
    </div>
  )
}
