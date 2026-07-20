import { useEffect } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, X, ShoppingBag } from "lucide-react"
import { useCartToastStore } from "../lib/toastStore.js"
import { formatPrice } from "../lib/store.js"

export default function CartToast() {
  const { toast, hide } = useCartToastStore()

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(hide, 3200)
    return () => clearTimeout(id)
  }, [toast, hide])

  return (
    <div style={{ position: "fixed", top: "88px", right: "20px", zIndex: 1100, width: "320px", maxWidth: "calc(100vw - 40px)" }}>
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: "var(--gz-surface)",
              border: "1px solid var(--gz-border)",
              borderRadius: "14px",
              padding: "16px",
              boxShadow: "0 20px 45px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <CheckCircle2 size={16} color="#4ade80" />
              <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--gz-text)" }}>Added to cart</span>
              <button onClick={hide} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--gz-text2)", padding: "2px", display: "flex" }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              {toast.product.image_url ? (
                <img
                  src={toast.product.image_url}
                  alt={toast.product.name}
                  style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--gz-border)", flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: "48px", height: "48px", borderRadius: "8px", border: "1px solid var(--gz-border)", background: "var(--gz-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ShoppingBag size={20} color="#f59e0b" />
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--gz-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {toast.product.name}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#f59e0b", fontWeight: "700" }}>
                  {toast.qty > 1 ? `${toast.qty} × ` : ""}{formatPrice(toast.product.price)}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Link to="/cart" onClick={hide} className="btn-outline" style={{ flex: 1, justifyContent: "center", padding: "9px", fontSize: "0.8rem" }}>
                View Cart
              </Link>
              <Link to="/checkout" onClick={hide} className="btn-primary" style={{ flex: 1, justifyContent: "center", padding: "9px", fontSize: "0.8rem" }}>
                Checkout
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
