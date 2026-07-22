import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, ShoppingBag, Trash2, Minus, Plus } from "lucide-react"
import { useCartStore, formatPrice } from "../../lib/store.js"
import { useCartDrawerStore } from "../../lib/cartDrawerStore.js"

export default function CartDrawer() {
  const open = useCartDrawerStore((s) => s.open)
  const hide = useCartDrawerStore((s) => s.hide)
  const { items, updateQty, removeItem, subtotal, shipping, total } = useCartStore()

  const ship = shipping()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={hide}
            style={{ position: "fixed", inset: 0, zIndex: 1300, background: "rgba(10,10,15,0.6)", backdropFilter: "blur(3px)" }}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 1301,
              width: "min(420px, 100vw)", background: "var(--gz-surface)",
              borderLeft: "1px solid var(--gz-border)", boxShadow: "-24px 0 60px rgba(0,0,0,0.4)",
              display: "flex", flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 22px", borderBottom: "1px solid var(--gz-border2)", flexShrink: 0 }}>
              <div>
                <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.1rem", color: "var(--gz-text)" }}>Your Cart</h2>
                <span style={{ fontSize: "0.78rem", color: "var(--gz-text2)" }}>{items.length} item{items.length === 1 ? "" : "s"}</span>
              </div>
              <button onClick={hide} aria-label="Close cart" className="gz-icon-btn" style={{ padding: "8px", borderRadius: "9px", background: "transparent", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px" }}>
              {items.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", gap: "12px" }}>
                  <ShoppingBag size={36} color="var(--gz-text2)" />
                  <div>
                    <h3 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "700", color: "var(--gz-text)", marginBottom: "6px" }}>Your cart is empty</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--gz-text2)" }}>Start adding some awesome gadgets!</p>
                  </div>
                  <Link to="/shop" onClick={hide} className="btn-primary" style={{ marginTop: "8px" }}>Start Shopping</Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {items.map((item) => (
                    <div key={item.id} style={{ display: "flex", gap: "12px" }}>
                      <Link to={"/product/" + item.slug} onClick={hide} style={{ flexShrink: 0 }}>
                        <img src={item.image_url} alt={item.name} style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "10px", border: "1px solid var(--gz-border)" }} />
                      </Link>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link to={"/product/" + item.slug} onClick={hide} style={{ textDecoration: "none" }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--gz-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "4px" }}>{item.name}</div>
                        </Link>
                        <div style={{ fontSize: "0.8rem", color: "#f59e0b", fontWeight: "700", marginBottom: "8px" }}>{formatPrice(item.price)}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--gz-border)", borderRadius: "8px" }}>
                            <button onClick={() => updateQty(item.id, item.quantity - 1)} style={{ width: "26px", height: "26px", background: "none", border: "none", color: "var(--gz-text2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Minus size={11} />
                            </button>
                            <span style={{ width: "24px", textAlign: "center", fontSize: "0.8rem", fontWeight: "700", color: "var(--gz-text)" }}>{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, item.quantity + 1)} style={{ width: "26px", height: "26px", background: "none", border: "none", color: "var(--gz-text2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Plus size={11} />
                            </button>
                          </div>
                          <button onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`} style={{ background: "none", border: "none", color: "var(--gz-text2)", cursor: "pointer", padding: "4px", marginLeft: "auto" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--gz-text2)"}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div style={{ padding: "18px 22px", borderTop: "1px solid var(--gz-border2)", flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--gz-text2)", marginBottom: "6px" }}>
                  <span>Subtotal</span><span>{formatPrice(subtotal())}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--gz-text2)", marginBottom: "12px" }}>
                  <span>Shipping</span><span style={{ color: ship === 0 ? "#22c55e" : "var(--gz-text)" }}>{ship === 0 ? "Free" : formatPrice(ship)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "1rem", color: "var(--gz-text)", marginBottom: "16px" }}>
                  <span>Total</span><span style={{ color: "#f59e0b" }}>{formatPrice(total())}</span>
                </div>
                <Link to="/checkout" onClick={hide} className="btn-primary" style={{ width: "100%", justifyContent: "center", marginBottom: "10px" }}>Checkout</Link>
                <Link to="/cart" onClick={hide} className="gz-text-link" style={{ display: "block", textAlign: "center", fontSize: "0.82rem", fontWeight: "600" }}>View full cart</Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
