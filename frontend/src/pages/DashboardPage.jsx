import { useEffect } from "react"
import { Link } from "react-router-dom"
import { ShoppingBag, User, Package } from "lucide-react"
import { useAuthStore, useOrderStore, formatPrice } from "../lib/store.js"

const STATUS_CLASSES = {
  pending:    "status-pending",
  processing: "status-processing",
  shipped:    "status-shipped",
  delivered:  "status-delivered",
  cancelled:  "status-cancelled",
}

function SkeletonRows({ count = 4, cols = 6 }) {
  return (
    <div style={{ padding: "8px 20px" }}>
      {Array.from({ length: count }).map((_, r) => (
        <div key={r} style={{ display: "flex", gap: "16px", alignItems: "center", padding: "14px 0", borderBottom: r < count - 1 ? "1px solid var(--gz-border2)" : "none" }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="skeleton" style={{ height: "14px", flex: c === 0 ? "0 0 90px" : 1 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { orders, loading, fetchOrders } = useOrderStore()

  useEffect(() => {
    fetchOrders()
  }, [])

  const totalOrders = orders.length
  const totalSpent   = orders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0)

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh" }}>
      <div className="gz-container" style={{ paddingTop: "32px", paddingBottom: "64px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: "0.8rem", color: "var(--gz-text2)", marginBottom: "24px", display: "flex", gap: "6px" }}>
          <Link to="/" style={{ color: "var(--gz-text2)", textDecoration: "none" }} onMouseEnter={(e) => e.currentTarget.style.color = "#f59e0b"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--gz-text2)"}>Home</Link>
          <span>›</span>
          <span style={{ color: "var(--gz-text)" }}>Dashboard</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "28px" }}>
          <div>
            <div className="section-label" style={{ marginBottom: "4px" }}>Dashboard</div>
            <h1 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.8rem", color: "var(--gz-text)" }}>My Orders</h1>
          </div>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "12px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(245,158,11,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <User size={16} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--gz-text)" }}>{user.username}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--gz-text2)" }}>{user.email}</div>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "16px", marginBottom: "28px" }}>
          {[
            { label: "Total Orders", value: totalOrders, icon: ShoppingBag },
            { label: "Total Spent",  value: formatPrice(totalSpent), icon: Package },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", padding: "20px", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={18} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.3rem", fontWeight: "800", color: "var(--gz-text)" }}>{value}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--gz-text2)" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Orders table */}
        <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", overflow: "hidden" }}>
          {loading && orders.length === 0 ? (
            <SkeletonRows />
          ) : orders.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "var(--gz-text2)" }}>
              <ShoppingBag size={40} style={{ margin: "0 auto 12px", color: "#f59e0b" }} />
              <p>No orders yet. Once you checkout, your order history will appear here.</p>
              <Link to="/shop" className="btn-primary" style={{ marginTop: "16px", display: "inline-flex" }}>Shop Now</Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="gz-table">
                <thead>
                  <tr><th>Order #</th><th>Date & Time</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th></tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ color: "#f59e0b", fontWeight: "700", fontSize: "0.85rem" }}>{o.order_number}</td>
                      <td style={{ color: "var(--gz-text2)", fontSize: "0.82rem" }}>{new Date(o.created_at).toLocaleString()}</td>
                      <td style={{ color: "var(--gz-text)" }}>{(o.items || []).length}</td>
                      <td style={{ fontWeight: "700", color: "var(--gz-text)" }}>{formatPrice(o.total_amount)}</td>
                      <td>
                        <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "700" }} className={STATUS_CLASSES[o.status] || "status-pending"}>{o.status}</span>
                      </td>
                      <td style={{ color: "var(--gz-text2)", fontSize: "0.82rem", textTransform: "capitalize" }}>{o.payment_method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
