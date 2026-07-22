import { Link } from "react-router-dom"
import { Heart, ShoppingCart } from "lucide-react"
import { useProductStore, useCartStore } from "../lib/store.js"
import { useWishlistStore } from "../lib/wishlistStore.js"
import ProductCard from "../components/ecommerce/ProductCard.jsx"

export default function WishlistPage() {
  const products = useProductStore((s) => s.products)
  const ids = useWishlistStore((s) => s.ids)
  const addItem = useCartStore((s) => s.addItem)

  const items = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean)

  const moveAllToCart = () => {
    items.forEach((p) => addItem(p))
  }

  if (items.length === 0) {
    return (
      <div style={{ paddingTop: "80px", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "var(--gz-surface)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Heart size={36} color="var(--gz-text2)" />
          </div>
          <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.5rem", color: "var(--gz-text)", marginBottom: "10px" }}>Your wishlist is empty</h2>
          <p style={{ color: "var(--gz-text2)", marginBottom: "24px" }}>Tap the ♥ on any product to save it here for later.</p>
          <Link to="/shop" className="btn-primary">Browse Shop</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh" }}>
      <div className="gz-container" style={{ paddingTop: "32px", paddingBottom: "64px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: "0.8rem", color: "var(--gz-text2)", marginBottom: "24px", display: "flex", gap: "6px" }}>
          <Link to="/" style={{ color: "var(--gz-text2)", textDecoration: "none" }} onMouseEnter={(e) => e.currentTarget.style.color = "#f59e0b"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--gz-text2)"}>Home</Link>
          <span>›</span>
          <span style={{ color: "var(--gz-text)" }}>Wishlist</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "28px" }}>
          <h1 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.8rem", color: "var(--gz-text)" }}>
            Wishlist <span style={{ color: "var(--gz-text2)", fontSize: "1rem", fontWeight: "500" }}>({items.length} item{items.length === 1 ? "" : "s"})</span>
          </h1>
          <button onClick={moveAllToCart} className="btn-primary">
            <ShoppingCart size={16} /> Move all to cart
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: "20px" }}>
          {items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </div>
  )
}
