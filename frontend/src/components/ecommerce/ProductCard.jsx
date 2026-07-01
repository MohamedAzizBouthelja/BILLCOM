import { Link } from "react-router-dom"
import { ShoppingCart, Star } from "lucide-react"
import { useCartStore, formatPrice } from "../../lib/store.js"

export default function ProductCard({ product }) {
  const { addItem } = useCartStore()

  const badgeStyle = {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "0.65rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    position: "absolute",
    top: "10px",
    left: "10px",
    zIndex: 2,
  }

  const getBadgeClass = (b) => {
    if (b === "NEW")  return { ...badgeStyle, background: "#22c55e", color: "#fff" }
    if (b === "HOT")  return { ...badgeStyle, background: "#ef4444", color: "#fff" }
    if (b === "SALE") return { ...badgeStyle, background: "#f59e0b", color: "#0a0a0f" }
    return {}
  }

  return (
    <div className="gz-card" style={{ position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {product.badge && <span style={getBadgeClass(product.badge)}>{product.badge}</span>}

      <Link to={"/product/" + product.slug} style={{ display: "block", textDecoration: "none" }}>
        <div style={{ position: "relative", overflow: "hidden", height: "200px" }}>
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s ease" }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          />
        </div>
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{product.category_name}</div>
          <h3 style={{ fontFamily: "IBM Plex Sans, sans-serif", fontWeight: "700", fontSize: "0.9rem", color: "var(--gz-text)", marginBottom: "8px", lineHeight: "1.3", minHeight: "38px" }}>
            {product.name}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "10px" }}>
            <span className="stars">{"★".repeat(Math.round(product.rating))}</span>
            <span style={{ fontSize: "0.75rem", color: "var(--gz-text2)" }}>({product.reviews})</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "1.05rem", fontWeight: "800", color: "#f59e0b" }}>{formatPrice(product.price)}</span>
            {product.old_price && (
              <span style={{ fontSize: "0.8rem", color: "var(--gz-text2)", textDecoration: "line-through" }}>{formatPrice(product.old_price)}</span>
            )}
          </div>
        </div>
      </Link>

      <div style={{ padding: "12px 16px 16px", marginTop: "auto" }}>
        <button
          onClick={() => addItem(product)}
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center", padding: "10px 16px", fontSize: "0.82rem" }}
        >
          <ShoppingCart size={14} /> Add to Cart
        </button>
      </div>
    </div>
  )
}
