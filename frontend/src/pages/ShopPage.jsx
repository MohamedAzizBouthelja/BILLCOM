import { useState, useMemo } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { useProductStore, CATEGORIES, formatPrice } from "../lib/store.js"
import ProductCard from "../components/ecommerce/ProductCard.jsx"

const PER_PAGE = 9

export default function ShopPage() {
  const { products } = useProductStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [priceMax, setPriceMax] = useState(300000)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const q       = searchParams.get("q") || ""
  const cat     = searchParams.get("cat") || "all"
  const badge   = searchParams.get("badge") || ""
  const sort    = searchParams.get("sort") || "newest"
  const page    = Number(searchParams.get("page") || 1)

  const setParam = (key, val) => {
    const p = new URLSearchParams(searchParams)
    if (val) p.set(key, val); else p.delete(key)
    p.delete("page")
    setSearchParams(p)
  }

  const setPage = (n) => {
    const p = new URLSearchParams(searchParams)
    p.set("page", n)
    setSearchParams(p)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const clearAll = () => { setSearchParams({}); setPriceMax(300000) }

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (cat && cat !== "all" && p.category !== cat) return false
      if (badge && p.badge !== badge) return false
      if (q && !p.name.toLowerCase().includes(q.toLowerCase()) && !p.description.toLowerCase().includes(q.toLowerCase())) return false
      if (p.price > priceMax) return false
      return true
    })
    if (sort === "price_asc")  list = [...list].sort((a, b) => a.price - b.price)
    if (sort === "price_desc") list = [...list].sort((a, b) => b.price - a.price)
    if (sort === "rating")     list = [...list].sort((a, b) => b.rating - a.rating)
    if (sort === "newest")     list = [...list].reverse()
    return list
  }, [cat, badge, q, priceMax, sort])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const catCount = (slug) => products.filter((p) => p.category === slug).length

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh" }}>
      <div className="gz-container" style={{ paddingTop: "32px", paddingBottom: "32px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: "0.8rem", color: "var(--gz-text2)", marginBottom: "24px", display: "flex", gap: "6px", alignItems: "center" }}>
          <Link to="/" style={{ color: "var(--gz-text2)", textDecoration: "none" }} onMouseEnter={(e) => e.currentTarget.style.color = "#f59e0b"} onMouseLeave={(e) => e.currentTarget.style.color = "#9090a8"}>Home</Link>
          <span>›</span>
          <span style={{ color: "var(--gz-text)" }}>Shop</span>
          {cat && cat !== "all" && <><span>›</span><span style={{ color: "#f59e0b", textTransform: "capitalize" }}>{cat}</span></>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "28px", alignItems: "start" }}>

          {/* Sidebar */}
          <aside style={{
            background: "var(--gz-surface)",
            border: "1px solid var(--gz-border)",
            borderRadius: "14px",
            padding: "24px",
            position: "sticky",
            top: "88px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontFamily: "IBM Plex Sans, sans-serif", fontWeight: "700", fontSize: "1rem", color: "var(--gz-text)" }}>Filters</h3>
              <button onClick={clearAll} style={{ fontSize: "0.75rem", color: "var(--gz-text2)", background: "none", border: "none", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.color = "#f59e0b"} onMouseLeave={(e) => e.currentTarget.style.color = "#9090a8"}>Clear All</button>
            </div>

            {/* Category */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gz-text2)", marginBottom: "12px" }}>Category</div>
              {[{ slug: "all", name: "All Products", count: products.length }, ...CATEGORIES.map((c) => ({ ...c, count: catCount(c.slug) }))].map((c) => (
                <label key={c.slug} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="cat"
                    className="filter-radio"
                    checked={cat === c.slug || (c.slug === "all" && !cat)}
                    onChange={() => setParam("cat", c.slug === "all" ? "" : c.slug)}
                    style={{ accentColor: "#f59e0b" }}
                  />
                  <span style={{ fontSize: "0.875rem", color: cat === c.slug ? "#f59e0b" : "#9090a8", flex: 1 }}>{c.name}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--gz-text2)" }}>({c.count})</span>
                </label>
              ))}
            </div>

            {/* Price */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gz-text2)" }}>Max Price</span>
                <span style={{ fontSize: "0.8rem", color: "#f59e0b", fontWeight: "700" }}>{formatPrice(priceMax)}</span>
              </div>
              <input
                type="range" min={999} max={300000} step={1000}
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#f59e0b" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--gz-text2)", marginTop: "4px" }}>
                <span>৳999</span><span>৳3,00,000</span>
              </div>
            </div>

            {/* Badge */}
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gz-text2)", marginBottom: "12px" }}>Badge</div>
              {[{ v: "", l: "All" }, { v: "NEW", l: "New" }, { v: "HOT", l: "Hot" }, { v: "SALE", l: "Sale" }].map((b) => (
                <label key={b.v} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", cursor: "pointer" }}>
                  <input type="radio" name="badge" className="filter-radio" checked={badge === b.v} onChange={() => setParam("badge", b.v)} style={{ accentColor: "#f59e0b" }} />
                  <span style={{ fontSize: "0.875rem", color: badge === b.v ? "#f59e0b" : "#9090a8" }}>{b.l}</span>
                </label>
              ))}
            </div>
          </aside>

          {/* Main */}
          <div>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", gap: "12px", flexWrap: "wrap" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--gz-text2)" }}>
                Showing <strong style={{ color: "var(--gz-text)" }}>{Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)}</strong> of <strong style={{ color: "#f59e0b" }}>{filtered.length}</strong> results
                {cat && cat !== "all" && <> in <span style={{ color: "#f59e0b", textTransform: "capitalize" }}>{cat}</span></>}
              </p>
              <select
                value={sort}
                onChange={(e) => setParam("sort", e.target.value)}
                className="gz-input"
                style={{ width: "auto", padding: "8px 14px", fontSize: "0.85rem" }}
              >
                <option value="newest">Newest</option>
                <option value="rating">Top Rated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            {/* Grid */}
            {paged.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 24px" }}>
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
                <h3 style={{ fontFamily: "IBM Plex Sans, sans-serif", fontWeight: "700", fontSize: "1.2rem", color: "var(--gz-text)", marginBottom: "8px" }}>No products found</h3>
                <p style={{ color: "var(--gz-text2)", marginBottom: "20px" }}>Try adjusting your filters or search term.</p>
                <button onClick={clearAll} className="btn-primary">Clear Filters</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: "20px" }}>
                {paged.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "40px", flexWrap: "wrap" }}>
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="page-btn" style={{ opacity: page === 1 ? 0.4 : 1 }}>&#8592;</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => setPage(n)} className={"page-btn" + (n === page ? " active" : "")}>{n}</button>
                ))}
                <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="page-btn" style={{ opacity: page === totalPages ? 0.4 : 1 }}>&#8594;</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
