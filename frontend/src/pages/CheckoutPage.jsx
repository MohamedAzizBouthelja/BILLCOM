import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Banknote, Smartphone, Wallet, CreditCard, Lock } from "lucide-react"
import { useCartStore, useAuthStore, useOrderStore, formatPrice } from "../lib/store.js"

const ORDER_SERVICE = ""

const PAYMENT_METHODS = [
  { id: "cod",    label: "Cash on Delivery",   icon: Banknote },
  { id: "bkash",  label: "bKash",               icon: Smartphone },
  { id: "nagad",  label: "Nagad",               icon: Wallet },
  { id: "card",   label: "Credit / Debit Card (Stripe)", icon: CreditCard },
]

export default function CheckoutPage() {
  const { items, subtotal, shipping, total, clear } = useCartStore()
  const { user } = useAuthStore()
  const { placeOrder, loading } = useOrderStore()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    first_name: (user && user.username) ? user.username.split(" ")[0] : "",
    last_name:  (user && user.username) ? user.username.split(" ").slice(1).join(" ") : "",
    email:      (user && user.email) ? user.email : "",
    phone:      "",
    address:    "",
    city:       "",
    country:    "Algeria",
    notes:      "",
    payment:    "cod",
  })
  const [errors, setErrors] = useState([])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  if (items.length === 0) {
    return (
      <div style={{ paddingTop: "80px", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--gz-text2)", marginBottom: "20px" }}>Your cart is empty.</p>
          <Link to="/shop" className="btn-primary">Go Shopping</Link>
        </div>
      </div>
    )
  }

  const validate = () => {
    const errs = []
    if (!form.first_name.trim()) errs.push("First name is required")
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.push("Valid email is required")
    if (!form.phone.trim()) errs.push("Phone number is required")
    if (!form.address.trim()) errs.push("Street address is required")
    if (!form.city.trim()) errs.push("City is required")
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (errs.length) { setErrors(errs); return }
    setErrors([])

    const shippingAddress = form.address + ", " + form.city + ", " + form.country

    if (form.payment === "card") {
      try {
        const { token } = useAuthStore.getState()
        const res = await fetch(ORDER_SERVICE + "/api/v1/orders/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({
            items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, image_url: i.image_url })),
            shipping_address: shippingAddress,
            payment_method: "card",
          }),
        })
        if (res.ok) {
          const data = await res.json()
          clear()
          window.location.href = data.session_url
        } else {
          const err = await res.json()
          setErrors([err.detail || "Erreur Stripe"])
        }
      } catch {
        setErrors(["Impossible de contacter le service de paiement."])
      }
      return
    }

    const result = await placeOrder({
      items,
      total: total(),
      payment_method: form.payment,
      shipping_address: shippingAddress,
    })
    if (result.ok) {
      clear()
      navigate("/order-success?order=" + result.order_number)
    }
  }

  const sub = subtotal(); const ship = shipping(); const tot = total()

  const inputStyle = { width: "100%", padding: "12px 16px", background: "var(--gz-bg)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "var(--gz-text)", fontSize: "0.9rem", outline: "none", transition: "border-color 0.2s", fontFamily: "DM Sans, sans-serif" }

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh" }}>
      <div className="gz-container" style={{ paddingTop: "32px", paddingBottom: "32px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: "0.8rem", color: "var(--gz-text2)", marginBottom: "24px", display: "flex", gap: "6px" }}>
          <Link to="/" style={{ color: "var(--gz-text2)", textDecoration: "none" }} onMouseEnter={(e) => e.currentTarget.style.color = "#f59e0b"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--gz-text2)"}>Home</Link>
          <span>›</span>
          <Link to="/cart" style={{ color: "var(--gz-text2)", textDecoration: "none" }} onMouseEnter={(e) => e.currentTarget.style.color = "#f59e0b"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--gz-text2)"}>Cart</Link>
          <span>›</span>
          <span style={{ color: "var(--gz-text)" }}>Checkout</span>
        </div>

        {errors.length > 0 && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "14px 18px", marginBottom: "20px" }}>
            {errors.map((e) => <div key={e} style={{ color: "#f87171", fontSize: "0.875rem" }}>• {e}</div>)}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" }}>

            {/* Form sections */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Section 1 */}
              <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", padding: "28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "0.9rem", color: "#0a0a0f", flexShrink: 0 }}>1</div>
                  <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "700", fontSize: "1.1rem", color: "var(--gz-text)" }}>Contact Information</h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>First Name *</label>
                    <input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} style={inputStyle} onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"} onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>Last Name *</label>
                    <input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} style={inputStyle} onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"} onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>Email Address *</label>
                    <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} style={inputStyle} onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"} onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>Phone Number *</label>
                    <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} style={inputStyle} onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"} onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", padding: "28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "0.9rem", color: "#0a0a0f", flexShrink: 0 }}>2</div>
                  <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "700", fontSize: "1.1rem", color: "var(--gz-text)" }}>Shipping Address</h2>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>Street Address *</label>
                    <input value={form.address} onChange={(e) => set("address", e.target.value)} style={inputStyle} onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"} onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>City *</label>
                      <input value={form.city} onChange={(e) => set("city", e.target.value)} style={inputStyle} onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"} onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>Country</label>
                      <input value={form.country} readOnly style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>Order Notes (optional)</label>
                    <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"} onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} placeholder="Any special instructions..." />
                  </div>
                </div>
              </div>

              {/* Section 3 */}
              <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", padding: "28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "0.9rem", color: "#0a0a0f", flexShrink: 0 }}>3</div>
                  <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "700", fontSize: "1.1rem", color: "var(--gz-text)" }}>Payment Method</h2>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {PAYMENT_METHODS.map((m) => (
                    <label key={m.id} className={"pay-option" + (form.payment === m.id ? " selected" : "")} style={{ cursor: "pointer" }}>
                      <input type="radio" name="payment" value={m.id} checked={form.payment === m.id} onChange={() => set("payment", m.id)} style={{ display: "none" }} />
                      <m.icon size={18} color={form.payment === m.id ? "#f59e0b" : "var(--gz-text2)"} />
                      <span style={{ fontWeight: "600", color: form.payment === m.id ? "#f59e0b" : "var(--gz-text)", fontSize: "0.9rem" }}>{m.label}</span>
                      {form.payment === m.id && <span style={{ marginLeft: "auto", color: "#f59e0b" }}>✓</span>}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Order review sidebar */}
            <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", padding: "24px", position: "sticky", top: "96px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "0.9rem", color: "#fff", flexShrink: 0 }}>✓</div>
                <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "700", fontSize: "1.1rem", color: "var(--gz-text)" }}>Order Review</h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <img src={item.image_url} alt={item.name} style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--gz-text)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{item.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--gz-text2)" }}>x{item.quantity}</div>
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#f59e0b", flexShrink: 0 }}>{formatPrice(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--gz-text2)" }}>Subtotal</span>
                  <span style={{ color: "var(--gz-text)", fontWeight: "600" }}>{formatPrice(sub)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--gz-text2)" }}>Shipping</span>
                  <span style={{ color: ship === 0 ? "#22c55e" : "var(--gz-text)", fontWeight: "600" }}>{ship === 0 ? "Free" : formatPrice(ship)}</span>
                </div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "10px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "700", color: "var(--gz-text)" }}>Total</span>
                  <span style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", color: "#f59e0b", fontSize: "1.15rem" }}>{formatPrice(tot)}</span>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "0.95rem", marginBottom: "12px", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Placing Order..." : "Place Order — " + formatPrice(tot)}
              </button>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "0.75rem", color: "var(--gz-text2)" }}>
                <Lock size={12} color="#f59e0b" /> Your information is secure &amp; encrypted
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
