import { Link } from "react-router-dom"
import { ShoppingCart, Eye, Heart } from "lucide-react"
import { useCartStore, formatPrice } from "../../lib/store.js"
import { useCartToastStore } from "../../lib/toastStore.js"
import { useQuickViewStore } from "../../lib/quickViewStore.js"
import { useWishlistStore } from "../../lib/wishlistStore.js"
import { flyToCart } from "../../lib/flyToCart.js"

const LOW_STOCK_THRESHOLD = 10

export default function ProductCard({ product, blurb }) {
  const { addItem } = useCartStore()
  const showToast = useCartToastStore((s) => s.show)
  const showQuickView = useQuickViewStore((s) => s.show)
  const wishlisted = useWishlistStore((s) => s.has(product.id))
  const toggleWishlist = useWishlistStore((s) => s.toggle)

  const badgeClassFor = (b) => {
    if (b === "NEW")  return "badge-new"
    if (b === "HOT")  return "badge-hot"
    if (b === "SALE") return "badge-sale"
    return ""
  }

  // Only one status badge at a time — low stock takes priority over the authored badge.
  const isLowStock = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD
  const cornerBadge = isLowStock
    ? { text: `Only ${product.stock} left`, className: "badge-lowstock" }
    : product.badge
      ? { text: product.badge, className: badgeClassFor(product.badge) }
      : null

  const discountPct = product.old_price
    ? Math.round((1 - product.price / product.old_price) * 100)
    : null

  const handleSpotlight = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty("--gz-mx", (e.clientX - rect.left) + "px")
    e.currentTarget.style.setProperty("--gz-my", (e.clientY - rect.top) + "px")
  }

  return (
    <div className="gz-card" onMouseMove={handleSpotlight} style={{ position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {cornerBadge && (
        <span className={`gz-badge ${cornerBadge.className}`} style={{ position: "absolute", top: "10px", left: "10px", zIndex: 2 }}>
          {cornerBadge.text}
        </span>
      )}

      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product) }}
        title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        style={{
          position: "absolute", top: "10px", right: "10px", zIndex: 2,
          width: "30px", height: "30px", borderRadius: "50%", border: "none", cursor: "pointer",
          background: "rgba(10,10,15,0.55)", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Heart size={15} color={wishlisted ? "#ef4444" : "#fff"} fill={wishlisted ? "#ef4444" : "none"} />
      </button>

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
            <span
              className="pc-quickview-pill"
              role="button"
              tabIndex={0}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); showQuickView(product) }}
            >
              <Eye size={13} /> Quick View
            </span>
          </div>
        </div>
        <div style={{ padding: "18px 18px 0" }}>
          <div style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: "6px" }}>{product.category_name}</div>
          <h3 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "700", fontSize: "0.95rem", letterSpacing: "-0.005em", color: "var(--gz-text)", marginBottom: "8px", lineHeight: "1.3", minHeight: "38px" }}>
            {product.name}
          </h3>
          {blurb && (
            <div style={{ fontSize: "0.72rem", color: "var(--gz-text2)", fontStyle: "italic", marginBottom: "8px" }}>
              ✦ {blurb}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "10px" }}>
            <span className="stars">{"★".repeat(Math.round(product.rating))}</span>
            <span style={{ fontSize: "0.75rem", color: "var(--gz-text2)" }}>({product.reviews})</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontVariantNumeric: "tabular-nums" }}>
            <span style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.15rem", fontWeight: "800", letterSpacing: "-0.01em", color: "#f59e0b" }}>{formatPrice(product.price)}</span>
            {product.old_price && (
              <>
                <span style={{ fontSize: "0.8rem", color: "var(--gz-text2)", textDecoration: "line-through" }}>{formatPrice(product.old_price)}</span>
                <span className="discount-pct">-{discountPct}%</span>
              </>
            )}
          </div>
        </div>
      </Link>

      <div style={{ padding: "16px 18px 18px", marginTop: "auto" }}>
        <button
          onClick={(e) => { addItem(product); flyToCart(e.currentTarget); showToast(product) }}
          className="btn-primary"
          style={{ width: "100%", justifyContent: "center", padding: "10px 16px", fontSize: "0.82rem" }}
        >
          <ShoppingCart size={14} /> Add to Cart
        </button>
      </div>
    </div>
  )
}
