import { Link, useNavigate } from "react-router-dom"
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, CreditCard, Smartphone, Wallet, Banknote, Lock } from "lucide-react"
import { useCartStore, formatPrice } from "../lib/store.js"

const PAYMENT_ICONS = [
  { icon: CreditCard, label: "Card" },
  { icon: Smartphone, label: "bKash" },
  { icon: Wallet, label: "Nagad" },
  { icon: Banknote, label: "COD" },
]

export default function CartPage() {
  const { items, updateQty, removeItem, count, subtotal, shipping, total } = useCartStore()
  const navigate = useNavigate()
  const cartCount = count()

  if (cartCount === 0) {
    return (
      <div style={{ paddingTop: "80px", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "var(--gz-surface)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <ShoppingBag size={36} color="var(--gz-text2)" />
          </div>
          <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.5rem", color: "var(--gz-text)", marginBottom: "10px" }}>Your cart is empty</h2>
          <p style={{ color: "var(--gz-text2)", marginBottom: "24px" }}>Start adding some awesome gadgets to your cart!</p>
          <Link to="/shop" className="btn-primary">Start Shopping</Link>
        </div>
      </div>
    )
  }

  const sub = subtotal()
  const ship = shipping()
  const tot = total()
  const freeShippingLeft = Math.max(0, 5000 - sub)

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh" }}>
      <div className="gz-container" style={{ paddingTop: "32px", paddingBottom: "32px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: "0.8rem", color: "var(--gz-text2)", marginBottom: "24px", display: "flex", gap: "6px" }}>
          <Link to="/" style={{ color: "var(--gz-text2)", textDecoration: "none" }} onMouseEnter={(e) => e.currentTarget.style.color = "#f59e0b"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--gz-text2)"}>Home</Link>
          <span>›</span>
          <span style={{ color: "var(--gz-text)" }}>Shopping Cart</span>
        </div>

        <h1 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.8rem", color: "var(--gz-text)", marginBottom: "28px" }}>
          Shopping Cart <span style={{ color: "var(--gz-text2)", fontSize: "1rem", fontWeight: "500" }}>({cartCount} items)</span>
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px", alignItems: "start" }}>

          {/* Cart table */}
          <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", overflow: "hidden" }}>
            <table className="gz-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th style={{ textAlign: "center" }}>Quantity</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <Link to={"/product/" + item.slug} style={{ textDecoration: "none", flexShrink: 0 }}>
                          <img src={item.image_url} alt={item.name} style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "10px", border: "1px solid var(--gz-border)" }} />
                        </Link>
                        <div>
                          <Link to={"/product/" + item.slug} style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--gz-text)", textDecoration: "none", display: "block", marginBottom: "4px" }} onMouseEnter={(e) => e.currentTarget.style.color = "#f59e0b"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--gz-text)"}>
                            {item.name}
                          </Link>
                          <span style={{ fontSize: "0.75rem", color: "var(--gz-text2)", textTransform: "capitalize" }}>{item.category_name}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: "700", color: "#f59e0b" }}>{formatPrice(item.price)}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: "8px", overflow: "hidden", width: "fit-content", margin: "0 auto" }}>
                        <button onClick={() => updateQty(item.id, item.quantity - 1)} style={{ width: "32px", height: "36px", background: "none", border: "none", color: "var(--gz-text2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Minus size={14} />
                        </button>
                        <input
                          type="number" min={1} max={99}
                          value={item.quantity}
                          onChange={(e) => updateQty(item.id, Number(e.target.value))}
                          style={{ width: "40px", textAlign: "center", background: "none", border: "none", color: "var(--gz-text)", fontWeight: "700", fontSize: "0.9rem", outline: "none" }}
                        />
                        <button onClick={() => updateQty(item.id, item.quantity + 1)} style={{ width: "32px", height: "36px", background: "none", border: "none", color: "var(--gz-text2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: "700", color: "var(--gz-text)" }}>{formatPrice(item.price * item.quantity)}</span>
                    </td>
                    <td>
                      <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "var(--gz-text2)", cursor: "pointer", padding: "6px", borderRadius: "6px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)" }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--gz-text2)"; e.currentTarget.style.background = "none" }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "16px 20px" }}>
              <Link to="/shop" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--gz-text2)", textDecoration: "none" }} onMouseEnter={(e) => e.currentTarget.style.color = "#f59e0b"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--gz-text2)"}>
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", padding: "24px", position: "sticky", top: "96px" }}>
            <h3 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "700", fontSize: "1.1rem", color: "var(--gz-text)", marginBottom: "20px" }}>Order Summary</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "var(--gz-text2)" }}>Subtotal</span>
                <span style={{ color: "var(--gz-text)", fontWeight: "600" }}>{formatPrice(sub)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "var(--gz-text2)" }}>Shipping</span>
                <span style={{ color: ship === 0 ? "#22c55e" : "var(--gz-text)", fontWeight: "600" }}>{ship === 0 ? "Free" : formatPrice(ship)}</span>
              </div>
              {freeShippingLeft > 0 && (
                <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "10px 12px", fontSize: "0.78rem", color: "#f59e0b" }}>
                  Add {formatPrice(freeShippingLeft)} more for free shipping!
                </div>
              )}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "700", color: "var(--gz-text)", fontSize: "1rem" }}>Total</span>
                <span style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", color: "#f59e0b", fontSize: "1.2rem" }}>{formatPrice(tot)}</span>
              </div>
            </div>

            <button onClick={() => navigate("/checkout")} className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "0.95rem", marginBottom: "14px" }}>
              Proceed to Checkout <ArrowRight size={16} />
            </button>

            {/* Payment icons */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", marginBottom: "12px" }}>
              {PAYMENT_ICONS.map(({ icon: Icon, label }) => (
                <span key={label} title={label} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "34px", height: "26px", borderRadius: "6px", background: "var(--gz-bg)", border: "1px solid var(--gz-border)" }}>
                  <Icon size={14} color="var(--gz-text2)" />
                </span>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "0.75rem", color: "var(--gz-text2)" }}>
              <Lock size={12} color="#f59e0b" /> Secure Checkout Guaranteed
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
