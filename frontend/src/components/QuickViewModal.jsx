import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { X, ShoppingCart, Plus, Minus, Eye } from "lucide-react"
import { useQuickViewStore } from "../lib/quickViewStore.js"
import { useCartStore, formatPrice } from "../lib/store.js"
import { useCartToastStore } from "../lib/toastStore.js"

export default function QuickViewModal() {
  const { product, hide } = useQuickViewStore()
  const { addItem } = useCartStore()
  const showToast = useCartToastStore((s) => s.show)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    setQty(1)
  }, [product])

  useEffect(() => {
    document.body.style.overflow = product ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [product])

  const badgeClassFor = (b) => {
    if (b === "NEW")  return "badge-new"
    if (b === "HOT")  return "badge-hot"
    if (b === "SALE") return "badge-sale"
    return ""
  }

  const handleAdd = () => {
    if (!product) return
    addItem(product, qty)
    showToast(product, qty)
    hide()
  }

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={hide}
          style={{
            position: "fixed", inset: 0, zIndex: 1200,
            background: "rgba(10,10,15,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--gz-surface)", border: "1px solid var(--gz-border)",
              borderRadius: "20px", maxWidth: "760px", width: "100%", maxHeight: "88vh",
              overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>

              {/* Image */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={hide}
                  className="gz-icon-btn"
                  style={{ position: "absolute", top: "12px", right: "12px", zIndex: 2, background: "rgba(10,10,15,0.6)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <X size={16} />
                </button>
                {product.badge && (
                  <span className={`gz-badge ${badgeClassFor(product.badge)}`} style={{ position: "absolute", top: "12px", left: "12px", zIndex: 2 }}>
                    {product.badge}
                  </span>
                )}
                <div className="pc-image-wrap" style={{ height: "100%", minHeight: "280px", borderRadius: "20px 0 0 20px" }}>
                  <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: "28px" }}>
                <div style={{ fontSize: "0.75rem", color: "#f59e0b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                  {product.category_name}
                </div>
                <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.4rem", fontWeight: "800", color: "var(--gz-text)", marginBottom: "10px", lineHeight: "1.25" }}>
                  {product.name}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <span className="stars">{"★".repeat(Math.round(product.rating || 0))}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--gz-text2)" }}>({product.reviews || 0})</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <span style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.5rem", fontWeight: "800", color: "#f59e0b" }}>{formatPrice(product.price)}</span>
                  {product.old_price && (
                    <>
                      <span style={{ fontSize: "0.95rem", color: "var(--gz-text2)", textDecoration: "line-through" }}>{formatPrice(product.old_price)}</span>
                      <span className="discount-pct">-{Math.round((1 - product.price / product.old_price) * 100)}%</span>
                    </>
                  )}
                </div>
                {product.description && (
                  <p style={{ fontSize: "0.85rem", color: "var(--gz-text2)", lineHeight: "1.7", marginBottom: "22px" }}>
                    {product.description}
                  </p>
                )}

                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--gz-border)", borderRadius: "10px", overflow: "hidden" }}>
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: "36px", height: "40px", background: "none", border: "none", color: "var(--gz-text2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Minus size={14} />
                    </button>
                    <span style={{ width: "34px", textAlign: "center", fontWeight: "700", color: "var(--gz-text)", fontSize: "0.9rem" }}>{qty}</span>
                    <button onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))} style={{ width: "36px", height: "40px", background: "none", border: "none", color: "var(--gz-text2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <button onClick={handleAdd} className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                    <ShoppingCart size={16} /> Add to Cart
                  </button>
                </div>

                <Link to={"/product/" + product.slug} onClick={hide} className="gz-text-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: "600" }}>
                  <Eye size={14} /> View full details
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
