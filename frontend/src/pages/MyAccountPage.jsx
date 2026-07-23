import { useState, useEffect } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { LayoutDashboard, ShoppingBag, User, Lock, LogOut, Heart } from "lucide-react"
import { useAuthStore, useOrderStore, useProductStore, formatPrice } from "../lib/store.js"
import { useWishlistStore } from "../lib/wishlistStore.js"
import ProductCard from "../components/ecommerce/ProductCard.jsx"

const STATUS_CLASSES = {
  pending:    "status-pending",
  processing: "status-processing",
  shipped:    "status-shipped",
  delivered:  "status-delivered",
  cancelled:  "status-cancelled",
}

function initials(name) {
  if (!name) return "??"
  return name.split(" ").map((n) => n[0] || "").join("").slice(0, 2).toUpperCase()
}

function SkeletonRows({ count = 3, cols = 5 }) {
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

export default function MyAccountPage() {
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const [tab, setTab] = useState(sp.get("tab") || "dashboard")
  const { user, logout, isLoggedIn } = useAuthStore()
  const { orders, loading: ordersLoading, fetchOrders } = useOrderStore()
  const { products } = useProductStore()
  const wishlistIds = useWishlistStore((s) => s.ids)
  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id))

  const [profile, setProfile] = useState({ first_name: "", last_name: "", phone: "", address: "", city: "" })
  const [pwForm, setPwForm]   = useState({ current: "", next: "", confirm: "" })
  const [msg, setMsg]         = useState("")

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return }
    if (user) {
      const parts = (user.username || "").split(" ")
      setProfile((p) => ({ ...p, first_name: parts[0] || "", last_name: parts.slice(1).join(" ") || "" }))
    }
    fetchOrders()
  }, [user, isLoggedIn])

  const handleLogout = () => { logout(); navigate("/") }

  const totalOrders   = orders.length
  const delivered     = orders.filter((o) => o.status === "delivered").length
  const totalSpent    = orders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0)

  const TABS = [
    { id: "dashboard", label: "Dashboard",       icon: LayoutDashboard },
    { id: "orders",    label: "My Orders",        icon: ShoppingBag },
    { id: "wishlist",  label: "Wishlist",          icon: Heart },
    { id: "profile",   label: "Profile",          icon: User },
    { id: "password",  label: "Change Password",  icon: Lock },
  ]

  const inputStyle = { width: "100%", padding: "11px 14px", background: "var(--gz-bg)", border: "1.5px solid var(--gz-border)", borderRadius: "10px", color: "var(--gz-text)", fontSize: "0.9rem", outline: "none", fontFamily: "DM Sans, sans-serif" }

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh" }}>
      <div className="gz-container" style={{ paddingTop: "32px", paddingBottom: "32px" }}>

        <div style={{ fontSize: "0.8rem", color: "var(--gz-text2)", marginBottom: "24px" }}>
          <Link to="/" style={{ color: "var(--gz-text2)", textDecoration: "none" }} onMouseEnter={(e) => e.currentTarget.style.color = "#f59e0b"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--gz-text2)"}>Home</Link>
          {" › "}
          <span style={{ color: "var(--gz-text)" }}>My Account</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "24px", alignItems: "start" }}>

          {/* Sidebar */}
          <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", overflow: "hidden", position: "sticky", top: "88px" }}>
            <div style={{ padding: "24px", background: "linear-gradient(135deg, var(--gz-surface2), var(--gz-surface))", borderBottom: "1px solid var(--gz-border2)" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.1rem", color: "#0a0a0f", margin: "0 auto 12px" }}>
                {initials(user && user.username)}
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "700", color: "var(--gz-text)", marginBottom: "4px" }}>{user && user.username}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--gz-text2)" }}>{user && user.email}</div>
              </div>
            </div>
            <div style={{ padding: "12px" }}>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)} className={"account-nav-item" + (tab === id ? " active" : "")}>
                  <Icon size={16} /> {label}
                </button>
              ))}
              <button onClick={handleLogout} className="account-nav-item" style={{ color: "#ef4444", marginTop: "4px" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ minWidth: 0 }}>

            {/* Dashboard */}
            {tab === "dashboard" && (
              <div>
                <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.5rem", color: "var(--gz-text)", marginBottom: "24px" }}>
                  Welcome back, {user && user.username ? user.username.split(" ")[0] : "there"}! 👋
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
                  {[
                    { label: "Total Orders", value: totalOrders },
                    { label: "Delivered",    value: delivered },
                    { label: "Total Spent",  value: formatPrice(totalSpent) },
                  ].map((s) => (
                    <div key={s.label} style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "12px", padding: "20px" }}>
                      <div style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.6rem", fontWeight: "800", color: "#f59e0b", marginBottom: "4px" }}>{s.value}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--gz-text2)", fontWeight: "500" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", overflow: "hidden" }}>
                  <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--gz-border2)" }}>
                    <h3 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "700", fontSize: "1rem", color: "var(--gz-text)" }}>Recent Orders</h3>
                  </div>
                  {ordersLoading && orders.length === 0 ? (
                    <SkeletonRows count={3} cols={5} />
                  ) : orders.length === 0 ? (
                    <div style={{ padding: "48px", textAlign: "center", color: "var(--gz-text2)" }}>
                      <ShoppingBag size={40} style={{ margin: "0 auto 12px", color: "#f59e0b" }} />
                      <p>No orders yet.</p>
                      <Link to="/shop" className="btn-primary" style={{ marginTop: "16px", display: "inline-flex" }}>Shop Now</Link>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table className="gz-table">
                        <thead>
                          <tr><th>Order #</th><th>Date</th><th>Total</th><th>Status</th><th>Payment</th></tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 5).map((o) => (
                            <tr key={o.id}>
                              <td style={{ color: "#f59e0b", fontWeight: "700", fontSize: "0.85rem" }}>{o.order_number}</td>
                              <td style={{ color: "var(--gz-text2)", fontSize: "0.85rem" }}>{new Date(o.created_at).toLocaleDateString()}</td>
                              <td style={{ fontWeight: "700", color: "var(--gz-text)" }}>{formatPrice(o.total_amount)}</td>
                              <td>
                                <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "700" }} className={STATUS_CLASSES[o.status] || "status-pending"}>{o.status}</span>
                              </td>
                              <td style={{ color: "var(--gz-text2)", fontSize: "0.85rem", textTransform: "capitalize" }}>{o.payment_method}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders */}
            {tab === "orders" && (
              <div>
                <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.5rem", color: "var(--gz-text)", marginBottom: "24px" }}>My Orders</h2>
                <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", overflow: "hidden" }}>
                  {ordersLoading && orders.length === 0 ? (
                    <SkeletonRows count={4} cols={6} />
                  ) : orders.length === 0 ? (
                    <div style={{ padding: "48px", textAlign: "center", color: "var(--gz-text2)" }}>
                      <ShoppingBag size={40} style={{ margin: "0 auto 12px", color: "#f59e0b" }} />
                      <p>No orders yet.</p>
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
            )}

            {/* Wishlist */}
            {tab === "wishlist" && (
              <div>
                <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.5rem", color: "var(--gz-text)", marginBottom: "24px" }}>My Wishlist</h2>
                {wishlistProducts.length === 0 ? (
                  <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", padding: "48px", textAlign: "center", color: "var(--gz-text2)" }}>
                    <Heart size={40} style={{ margin: "0 auto 12px", color: "#f59e0b" }} />
                    <p>No saved items yet.</p>
                    <Link to="/shop" className="btn-primary" style={{ marginTop: "16px", display: "inline-flex" }}>Browse Products</Link>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: "18px" }}>
                    {wishlistProducts.map((p) => <ProductCard key={p.id} product={p} />)}
                  </div>
                )}
              </div>
            )}

            {/* Profile */}
            {tab === "profile" && (
              <div>
                <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.5rem", color: "var(--gz-text)", marginBottom: "24px" }}>Profile Settings</h2>
                {msg && <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", color: "#4ade80", fontSize: "0.875rem" }}>{msg}</div>}
                <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", padding: "28px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>First Name</label>
                      <input value={profile.first_name} onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))} style={inputStyle} onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"} onBlur={(e) => e.currentTarget.style.borderColor = "var(--gz-border)"} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>Last Name</label>
                      <input value={profile.last_name} onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))} style={inputStyle} onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"} onBlur={(e) => e.currentTarget.style.borderColor = "var(--gz-border)"} />
                    </div>
                  </div>
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>Email Address</label>
                    <input value={user && user.email} readOnly style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} />
                    <p style={{ fontSize: "0.72rem", color: "var(--gz-text2)", marginTop: "4px" }}>Email cannot be changed.</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>Phone</label>
                      <input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} style={inputStyle} onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"} onBlur={(e) => e.currentTarget.style.borderColor = "var(--gz-border)"} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>City</label>
                      <input value={profile.city} onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))} style={inputStyle} onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"} onBlur={(e) => e.currentTarget.style.borderColor = "var(--gz-border)"} />
                    </div>
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>Address</label>
                    <textarea value={profile.address} onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))} rows={3} style={{ ...inputStyle, resize: "vertical" }} onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"} onBlur={(e) => e.currentTarget.style.borderColor = "var(--gz-border)"} />
                  </div>
                  <button onClick={() => setMsg("Profile saved successfully!")} className="btn-primary">Save Changes</button>
                </div>
              </div>
            )}

            {/* Password */}
            {tab === "password" && (
              <div>
                <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.5rem", color: "var(--gz-text)", marginBottom: "24px" }}>Change Password</h2>
                <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", padding: "28px", maxWidth: "440px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {[
                      { label: "Current Password", key: "current", placeholder: "Enter current password" },
                      { label: "New Password (min 6 chars)", key: "next", placeholder: "Enter new password" },
                      { label: "Confirm New Password", key: "confirm", placeholder: "Confirm new password" },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>{label} *</label>
                        <input type="password" placeholder={placeholder} value={pwForm[key]} onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))} style={inputStyle} onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"} onBlur={(e) => e.currentTarget.style.borderColor = "var(--gz-border)"} />
                      </div>
                    ))}
                    <button onClick={() => { if (pwForm.next.length < 6) { setMsg("Password must be at least 6 characters"); return } if (pwForm.next !== pwForm.confirm) { setMsg("Passwords do not match"); return } setMsg("Password updated successfully!"); setPwForm({ current: "", next: "", confirm: "" }) }} className="btn-primary">
                      Update Password
                    </button>
                    {msg && <div style={{ background: msg.includes("success") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: "1px solid " + (msg.includes("success") ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"), borderRadius: "8px", padding: "10px 14px", color: msg.includes("success") ? "#4ade80" : "#f87171", fontSize: "0.875rem" }}>{msg}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
