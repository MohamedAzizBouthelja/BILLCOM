import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Package, Users, ShoppingBag, TrendingUp, ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react"
import { useAuthStore, useOrderStore, useProductStore, formatPrice } from "../lib/store.js"
import ProductFormModal from "../components/ProductFormModal.jsx"

export default function AdminPage() {
  const { user } = useAuthStore()
  const { orders } = useOrderStore()
  const { products, loading: productsLoading, fetchProducts, deleteProduct } = useProductStore()
  const [tab, setTab] = useState("dashboard")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [search, setSearch] = useState("")
  const [banner, setBanner] = useState(null)

  useEffect(() => { fetchProducts() }, [])

  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => setBanner(null), 3000)
    return () => clearTimeout(t)
  }, [banner])

  const totalRevenue  = orders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0)
  const totalOrders   = orders.length
  const totalProducts = products.length

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const openCreateModal = () => { setEditingProduct(null); setModalOpen(true) }
  const openEditModal = (p) => { setEditingProduct(p); setModalOpen(true) }

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    const result = await deleteProduct(p.id)
    setBanner(result.ok ? { type: "success", text: `"${p.name}" deleted.` } : { type: "error", text: result.error })
  }

  const TABS = [
    { id: "dashboard", label: "Dashboard",    icon: TrendingUp },
    { id: "products",  label: "Products",     icon: Package },
    { id: "orders",    label: "Orders",       icon: ShoppingBag },
    { id: "users",     label: "Users",        icon: Users },
  ]

  const STATUS_COLORS = { pending: "#f59e0b", processing: "#60a5fa", shipped: "#a78bfa", delivered: "#4ade80", cancelled: "#f87171" }

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh" }}>
      <div className="gz-container" style={{ paddingTop: "32px", paddingBottom: "32px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.8rem", color: "var(--gz-text)" }}>Admin Dashboard</h1>
            <p style={{ color: "var(--gz-text2)", fontSize: "0.875rem" }}>Welcome, {user && user.username}</p>
          </div>
          <Link to="/" className="btn-outline" style={{ gap: "8px", padding: "10px 18px" }}>
            <ArrowLeft size={15} /> Back to Store
          </Link>
        </div>

        <div className="gz-grid-sidebar-admin" style={{ gap: "24px", alignItems: "start" }}>

          {/* Sidebar */}
          <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", padding: "12px", position: "sticky", top: "88px" }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} className={"account-nav-item" + (tab === id ? " active" : "")}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div>

            {tab === "dashboard" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "16px", marginBottom: "28px" }}>
                  {[
                    { label: "Total Revenue",  value: formatPrice(totalRevenue), icon: TrendingUp, color: "#f59e0b" },
                    { label: "Total Orders",   value: totalOrders,               icon: ShoppingBag, color: "#60a5fa" },
                    { label: "Products",       value: totalProducts,             icon: Package,    color: "#a78bfa" },
                    { label: "Customers",      value: "—",                       icon: Users,      color: "#4ade80" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "12px", padding: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                        <span style={{ fontSize: "0.78rem", color: "var(--gz-text2)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
                        <Icon size={18} color={color} />
                      </div>
                      <div style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.6rem", fontWeight: "800", color }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", overflow: "hidden" }}>
                  <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--gz-border2)" }}>
                    <h3 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "700", fontSize: "1rem", color: "var(--gz-text)" }}>Recent Orders</h3>
                  </div>
                  {orders.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--gz-text2)" }}>No orders yet.</div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table className="gz-table">
                        <thead><tr><th>Order #</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
                        <tbody>
                          {orders.slice(0, 8).map((o) => (
                            <tr key={o.id}>
                              <td style={{ color: "#f59e0b", fontWeight: "700", fontSize: "0.85rem" }}>{o.order_number}</td>
                              <td style={{ color: "var(--gz-text2)", fontSize: "0.82rem" }}>{new Date(o.created_at).toLocaleDateString()}</td>
                              <td style={{ fontWeight: "700", color: "var(--gz-text)" }}>{formatPrice(o.total_amount)}</td>
                              <td style={{ color: "var(--gz-text2)", fontSize: "0.82rem", textTransform: "capitalize" }}>{o.payment_method}</td>
                              <td>
                                <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "700", background: STATUS_COLORS[o.status] ? STATUS_COLORS[o.status] + "20" : "rgba(245,158,11,0.15)", color: STATUS_COLORS[o.status] || "#f59e0b" }}>
                                  {o.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "products" && (
              <div>
                {banner && (
                  <div style={{
                    background: banner.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    border: banner.type === "success" ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(239,68,68,0.3)",
                    color: banner.type === "success" ? "#4ade80" : "#f87171",
                    borderRadius: "10px", padding: "10px 14px", fontSize: "0.82rem", marginBottom: "16px",
                  }}>
                    {banner.text}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                  <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.4rem", color: "var(--gz-text)" }}>Products ({totalProducts})</h2>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                      className="gz-input"
                      placeholder="Search products..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ maxWidth: "240px" }}
                    />
                    <button className="btn-primary" onClick={openCreateModal} style={{ whiteSpace: "nowrap" }}>
                      <Plus size={15} /> Add Product
                    </button>
                  </div>
                </div>

                <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", overflow: "hidden" }}>
                  {productsLoading && products.length === 0 ? (
                    <div style={{ padding: "16px" }}>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="skeleton" style={{ height: "56px", marginBottom: "8px", borderRadius: "10px" }} />
                      ))}
                    </div>
                  ) : products.length === 0 ? (
                    <div style={{ padding: "48px", textAlign: "center", color: "var(--gz-text2)" }}>
                      <p style={{ marginBottom: "16px" }}>No products yet. Add your first product to get started.</p>
                      <button className="btn-primary" onClick={openCreateModal}><Plus size={15} /> Add Product</button>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table className="gz-table">
                        <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Badge</th><th>Actions</th></tr></thead>
                        <tbody>
                          {filteredProducts.map((p) => (
                            <tr key={p.id}>
                              <td><img src={p.image_url} alt={p.name} style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px" }} /></td>
                              <td style={{ fontWeight: "600", color: "var(--gz-text)", fontSize: "0.85rem", maxWidth: "200px" }}>{p.name}</td>
                              <td style={{ color: "var(--gz-text2)", fontSize: "0.82rem", textTransform: "capitalize" }}>{p.category_name}</td>
                              <td style={{ color: "#f59e0b", fontWeight: "700" }}>{formatPrice(p.price)}</td>
                              <td style={{ color: p.stock < 20 ? "#f87171" : "#4ade80", fontWeight: "600" }}>{p.stock}</td>
                              <td>
                                {p.badge && <span style={{ padding: "2px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "700", background: p.badge === "HOT" ? "rgba(239,68,68,0.15)" : p.badge === "NEW" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)", color: p.badge === "HOT" ? "#f87171" : p.badge === "NEW" ? "#4ade80" : "#f59e0b" }}>{p.badge}</span>}
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button className="gz-icon-btn" onClick={() => openEditModal(p)} title="Edit" style={{ background: "none", border: "none", cursor: "pointer", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Pencil size={16} />
                                  </button>
                                  <button className="gz-icon-btn danger" onClick={() => handleDelete(p)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {modalOpen && (
                  <ProductFormModal
                    mode={editingProduct ? "edit" : "create"}
                    product={editingProduct}
                    onClose={() => setModalOpen(false)}
                    onSaved={() => {
                      setModalOpen(false)
                      setBanner({ type: "success", text: editingProduct ? "Product updated." : "Product created." })
                    }}
                  />
                )}
              </div>
            )}

            {tab === "orders" && (
              <div>
                <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.4rem", color: "var(--gz-text)", marginBottom: "20px" }}>All Orders</h2>
                <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", overflow: "hidden" }}>
                  {orders.length === 0 ? (
                    <div style={{ padding: "48px", textAlign: "center", color: "var(--gz-text2)" }}>No orders placed yet.</div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table className="gz-table">
                        <thead><tr><th>Order #</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
                        <tbody>
                          {orders.map((o) => (
                            <tr key={o.id}>
                              <td style={{ color: "#f59e0b", fontWeight: "700", fontSize: "0.85rem" }}>{o.order_number}</td>
                              <td style={{ color: "var(--gz-text2)", fontSize: "0.82rem" }}>{new Date(o.created_at).toLocaleString()}</td>
                              <td style={{ color: "var(--gz-text)" }}>{(o.items || []).length}</td>
                              <td style={{ fontWeight: "700", color: "var(--gz-text)" }}>{formatPrice(o.total_amount)}</td>
                              <td style={{ color: "var(--gz-text2)", fontSize: "0.82rem", textTransform: "capitalize" }}>{o.payment_method}</td>
                              <td>
                                <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "700", background: (STATUS_COLORS[o.status] || "#f59e0b") + "20", color: STATUS_COLORS[o.status] || "#f59e0b" }}>{o.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "users" && (
              <div>
                <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.4rem", color: "var(--gz-text)", marginBottom: "20px" }}>Users</h2>
                <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", padding: "48px", textAlign: "center" }}>
                  <Users size={40} style={{ margin: "0 auto 12px", color: "#f59e0b" }} />
                  <p style={{ color: "var(--gz-text2)" }}>User management connects to the user microservice.</p>
                  <p style={{ color: "var(--gz-text2)", fontSize: "0.85rem", marginTop: "6px" }}>Currently logged in as: <strong style={{ color: "#f59e0b" }}>{user && user.username}</strong> ({user && user.role})</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
