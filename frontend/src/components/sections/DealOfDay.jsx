import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ShoppingCart, Star, Truck } from "lucide-react"
import { useProductStore, useCartStore, formatPrice } from "../../lib/store.js"

function pad(n) { return String(n).padStart(2, "0") }

function getEndOfDay() {
  const d = new Date()
  d.setHours(23, 59, 59, 0)
  return d
}

export default function DealOfDay() {
  const getDeal = useProductStore((s) => s.getDeal)
  const { addItem } = useCartStore()
  const product = getDeal()

  const [time, setTime] = useState({ h: 0, m: 0, s: 0 })

  useEffect(() => {
    const end = getEndOfDay()
    const tick = () => {
      const diff = Math.max(0, end - Date.now())
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTime({ h, m, s })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (!product) return null

  return (
    <section style={{ padding: "72px 0", background: "var(--gz-surface)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="gz-container">
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="section-label">Limited Time</div>
          <h2 style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "2rem", fontWeight: "800", color: "var(--gz-text)" }}>Deal of the Day</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "48px", alignItems: "center" }}>

          {/* Left — info */}
          <div>
            <div style={{ fontSize: "0.8rem", color: "#f59e0b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>{product.category_name}</div>
            <h3 style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "1.6rem", fontWeight: "800", color: "var(--gz-text)", marginBottom: "12px" }}>{product.name}</h3>
            <p style={{ color: "var(--gz-text2)", fontSize: "0.9rem", lineHeight: "1.7", marginBottom: "20px" }}>{product.description}</p>

            {/* Countdown */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--gz-text2)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Ends in:</div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {[{ v: time.h, l: "HRS" }, { v: time.m, l: "MIN" }, { v: time.s, l: "SEC" }].map(({ v, l }, i) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div className="countdown-box">
                      <div className="countdown-num">{pad(v)}</div>
                      <div className="countdown-lbl">{l}</div>
                    </div>
                    {i < 2 && <span style={{ color: "#f59e0b", fontWeight: "800", fontSize: "1.2rem" }}>:</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: "2rem", fontWeight: "800", color: "#f59e0b" }}>{formatPrice(product.price)}</span>
              {product.old_price && (
                <span style={{ fontSize: "1.1rem", color: "var(--gz-text2)", textDecoration: "line-through" }}>{formatPrice(product.old_price)}</span>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => addItem(product)} className="btn-primary">
                <ShoppingCart size={16} /> Add to Cart
              </button>
              <Link to="/shop" className="btn-outline">View Shop</Link>
            </div>
          </div>

          {/* Center — image */}
          <div style={{ textAlign: "center" }}>
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              decoding="async"
              style={{ width: "280px", height: "280px", objectFit: "cover", borderRadius: "20px", border: "1px solid var(--gz-border)" }}
            />
          </div>

          {/* Right — meta */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "var(--gz-bg)", border: "1px solid var(--gz-border)", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
              <Star size={20} color="#f59e0b" fill="#f59e0b" />
              <div>
                <div style={{ fontWeight: "700", color: "var(--gz-text)" }}>{product.rating} / 5.0</div>
                <div style={{ fontSize: "0.78rem", color: "var(--gz-text2)" }}>{(product.reviews ?? 0).toLocaleString()} reviews</div>
              </div>
            </div>
            <div style={{ background: "var(--gz-bg)", border: "1px solid var(--gz-border)", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
              <Truck size={20} color="#f59e0b" />
              <div>
                <div style={{ fontWeight: "700", color: "var(--gz-text)" }}>Free Delivery</div>
                <div style={{ fontSize: "0.78rem", color: "var(--gz-text2)" }}>Arrives in 2-3 days</div>
              </div>
            </div>
            <div style={{ background: "var(--gz-bg)", border: "1px solid var(--gz-border)", borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ fontWeight: "700", color: "var(--gz-text)", marginBottom: "4px" }}>In Stock</div>
              <div style={{ fontSize: "0.78rem", color: "var(--gz-text2)" }}>{product.stock} units available</div>
              <div style={{ marginTop: "8px", background: "var(--gz-surface)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: Math.min(100, (product.stock / 200) * 100) + "%", background: "#f59e0b", borderRadius: "4px" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
