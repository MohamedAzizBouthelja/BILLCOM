import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingCart, Search, User, Menu, X, LogOut, LayoutDashboard, Shield, Sun, Moon } from "lucide-react"
import { useAuthStore, useCartStore } from "../../lib/store.js"
import { useTheme } from "../../lib/ThemeContext.jsx"
import LogoMark from "../Logo.jsx"

const NAV = [
  { label: "Home",        path: "/" },
  { label: "Shop",        path: "/shop" },
  { label: "Deals",       path: "/shop?badge=SALE" },
  { label: "New Arrivals",path: "/shop?badge=NEW" },
]

export default function Header() {
  const [scrolled,   setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query,      setQuery]      = useState("")
  const navigate  = useNavigate()
  const { user, logout, isLoggedIn } = useAuthStore()
  const { count } = useCartStore()
  const cartCount = count()
  const { theme, toggle } = useTheme()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate("/shop?q=" + encodeURIComponent(query.trim()))
      setSearchOpen(false)
      setQuery("")
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/")
    setMobileOpen(false)
  }

  return (
    <header
      style={{
        background: scrolled ? "color-mix(in srgb, var(--gz-bg) 97%, transparent)" : "color-mix(in srgb, var(--gz-bg) 82%, transparent)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px solid var(--gz-border2)",
        transition: "background 0.3s ease",
      }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    >
      <div className="gz-container">
        <div className="flex items-center justify-between" style={{ height: "72px" }}>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0" style={{ textDecoration: "none" }}>
            <LogoMark size={40} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.35rem", fontWeight: "800", color: "#f59e0b", lineHeight: "1.15", letterSpacing: "-0.01em" }}>
                Gadget<span style={{ color: "var(--gz-text)" }}>Zone</span>
              </span>
              <span style={{ fontSize: "0.6rem", color: "var(--gz-text2)", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: "600" }}>
                Tech Store
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                style={{ color: "var(--gz-text)", fontSize: "1rem", fontWeight: "600", padding: "9px 16px", borderRadius: "9px", transition: "all 0.15s", textDecoration: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#f59e0b"; e.currentTarget.style.background = "rgba(245,158,11,0.08)" }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--gz-text)"; e.currentTarget.style.background = "transparent" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              style={{ padding: "9px", borderRadius: "9px", color: "var(--gz-text2)", background: "transparent", border: "none", cursor: "pointer", overflow: "hidden", display: "flex" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#f59e0b"; e.currentTarget.style.background = "rgba(245,158,11,0.08)" }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--gz-text2)"; e.currentTarget.style.background = "transparent" }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  style={{ display: "flex" }}
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </motion.span>
              </AnimatePresence>
            </button>

            {/* Search */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              style={{ padding: "9px", borderRadius: "9px", color: "var(--gz-text2)", background: "transparent", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#f59e0b"; e.currentTarget.style.background = "rgba(245,158,11,0.08)" }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--gz-text2)"; e.currentTarget.style.background = "transparent" }}
            >
              <Search size={20} />
            </button>

            {/* Cart */}
            <Link
              id="gz-cart-icon"
              to="/cart"
              style={{ position: "relative", padding: "9px", borderRadius: "9px", color: "var(--gz-text2)", display: "flex", alignItems: "center", textDecoration: "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#f59e0b"; e.currentTarget.style.background = "rgba(245,158,11,0.08)" }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--gz-text2)"; e.currentTarget.style.background = "transparent" }}
            >
              <ShoppingCart size={20} />
              <span
                className="cart-badge"
                style={{
                  display: cartCount > 0 ? "flex" : "none",
                  position: "absolute", top: "2px", right: "2px",
                  width: "16px", height: "16px", borderRadius: "50%",
                  background: "#f59e0b", color: "#0a0a0f",
                  fontSize: "10px", fontWeight: "700",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                {cartCount}
              </span>
            </Link>

            {/* Auth */}
            {isLoggedIn() ? (
              <div className="hidden sm:flex items-center gap-1">
                <Link
                  to="/account"
                  style={{ padding: "8px 12px", borderRadius: "8px", color: "var(--gz-text2)", fontSize: "0.8rem", fontWeight: "500", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#f59e0b"; e.currentTarget.style.background = "rgba(245,158,11,0.08)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#9090a8"; e.currentTarget.style.background = "transparent" }}
                >
                  <User size={15} />
                  {user && user.username ? user.username.split(" ")[0] : "Account"}
                </Link>
                {user && (user.role === "admin" || user.role === "super_admin") && (
                  <Link
                    to="/admin"
                    style={{ padding: "8px", borderRadius: "8px", color: "var(--gz-text2)", display: "flex", textDecoration: "none" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#f59e0b"; e.currentTarget.style.background = "rgba(245,158,11,0.08)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#9090a8"; e.currentTarget.style.background = "transparent" }}
                    title="Admin"
                  >
                    <Shield size={15} />
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  style={{ padding: "8px", borderRadius: "8px", color: "var(--gz-text2)", background: "transparent", border: "none", cursor: "pointer", display: "flex" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#9090a8"; e.currentTarget.style.background = "transparent" }}
                  title="Logout"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 ml-1">
                <Link
                  to="/login"
                  style={{ padding: "7px 14px", borderRadius: "8px", color: "var(--gz-text2)", fontSize: "0.85rem", fontWeight: "500", textDecoration: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#f0f0f5" }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#9090a8" }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  style={{ padding: "7px 16px", borderRadius: "8px", background: "#f59e0b", color: "#0a0a0f", fontSize: "0.85rem", fontWeight: "700", textDecoration: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fcd34d" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#f59e0b" }}
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden"
              style={{ padding: "8px", borderRadius: "8px", color: "var(--gz-text2)", background: "transparent", border: "none", cursor: "pointer" }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div style={{ borderTop: "1px solid var(--gz-border2)", background: "rgba(10,10,15,0.98)", padding: "12px 24px" }}>
          <form onSubmit={handleSearch} style={{ maxWidth: "600px", margin: "0 auto", display: "flex", gap: "10px" }}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search gadgets, smartphones, laptops..."
              className="gz-input"
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" style={{ padding: "10px 20px" }}>Search</button>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ borderTop: "1px solid var(--gz-border2)", background: "rgba(10,10,15,0.98)", padding: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                style={{ padding: "12px 16px", borderRadius: "10px", color: "var(--gz-text2)", fontSize: "0.9rem", fontWeight: "500", textDecoration: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#f59e0b"; e.currentTarget.style.background = "rgba(245,158,11,0.08)" }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#9090a8"; e.currentTarget.style.background = "transparent" }}
              >
                {item.label}
              </Link>
            ))}
            <div style={{ borderTop: "1px solid var(--gz-border2)", marginTop: "8px", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {isLoggedIn() ? (
                <>
                  <Link to="/account" onClick={() => setMobileOpen(false)} style={{ padding: "12px 16px", borderRadius: "10px", color: "var(--gz-text2)", fontSize: "0.9rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
                    <User size={16} /> My Account
                  </Link>
                  <button onClick={handleLogout} style={{ padding: "12px 16px", borderRadius: "10px", color: "#ef4444", fontSize: "0.9rem", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                    <LogOut size={16} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} style={{ padding: "12px 16px", borderRadius: "10px", color: "var(--gz-text2)", fontSize: "0.9rem", textDecoration: "none" }}>
                    Sign In
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} style={{ margin: "4px 16px", padding: "12px", borderRadius: "10px", background: "#f59e0b", color: "#0a0a0f", fontSize: "0.9rem", fontWeight: "700", textDecoration: "none", textAlign: "center" }}>
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
