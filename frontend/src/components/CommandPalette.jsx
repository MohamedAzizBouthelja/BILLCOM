import { useState, useEffect, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ShoppingCart, Store, CreditCard, User, Sun, Moon, Heart, CornerDownLeft } from "lucide-react"
import { useProductStore, useAuthStore, formatPrice } from "../lib/store.js"
import { useCommandPaletteStore } from "../lib/commandPaletteStore.js"
import { useCartDrawerStore } from "../lib/cartDrawerStore.js"
import { useTheme } from "../lib/ThemeContext.jsx"

export default function CommandPalette() {
  const open = useCommandPaletteStore((s) => s.open)
  const toggle = useCommandPaletteStore((s) => s.toggle)
  const hide = useCommandPaletteStore((s) => s.hide)
  const products = useProductStore((s) => s.products)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const showCartDrawer = useCartDrawerStore((s) => s.show)
  const { theme, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [toggle])

  useEffect(() => {
    if (open) {
      setQuery("")
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  const actions = useMemo(() => [
    { id: "shop",     icon: Store,      label: "Go to Shop",        run: () => navigate("/shop") },
    { id: "cart",     icon: ShoppingCart, label: "Open Cart",       run: () => showCartDrawer() },
    { id: "checkout", icon: CreditCard, label: "Go to Checkout",    run: () => navigate("/checkout") },
    { id: "wishlist", icon: Heart,      label: "Go to Wishlist",    run: () => navigate("/wishlist") },
    { id: "account",  icon: User,       label: isLoggedIn() ? "My Account" : "Sign In", run: () => navigate(isLoggedIn() ? "/account" : "/login") },
    { id: "theme",    icon: theme === "dark" ? Sun : Moon, label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode", run: () => toggleTheme() },
  ], [isLoggedIn, theme])

  const q = query.trim().toLowerCase()

  const matchedActions = q
    ? actions.filter((a) => a.label.toLowerCase().includes(q))
    : actions

  const matchedProducts = q
    ? products.filter((p) =>
        p.name.toLowerCase().includes(q) || p.category_name.toLowerCase().includes(q)
      ).slice(0, 6)
    : []

  const results = [
    ...matchedActions.map((a) => ({ type: "action", ...a })),
    ...matchedProducts.map((p) => ({ type: "product", id: "p" + p.id, label: p.name, product: p })),
  ]

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  const runResult = (r) => {
    if (!r) return
    if (r.type === "action") r.run()
    else navigate("/product/" + r.product.slug)
    hide()
  }

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      runResult(results[activeIndex])
    } else if (e.key === "Escape") {
      hide()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={hide}
          style={{
            position: "fixed", inset: 0, zIndex: 1400,
            background: "rgba(10,10,15,0.65)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-start", justifyContent: "center",
            padding: "12vh 20px 20px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: "560px", background: "var(--gz-surface)",
              border: "1px solid var(--gz-border)", borderRadius: "16px",
              boxShadow: "0 30px 80px rgba(0,0,0,0.5)", overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 18px", borderBottom: "1px solid var(--gz-border2)" }}>
              <Search size={18} color="var(--gz-text2)" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search products or type a command…"
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--gz-text)", fontSize: "0.95rem", fontFamily: "DM Sans, sans-serif" }}
              />
              <kbd style={{ fontSize: "0.7rem", color: "var(--gz-text2)", border: "1px solid var(--gz-border)", borderRadius: "5px", padding: "2px 6px" }}>Esc</kbd>
            </div>

            <div style={{ maxHeight: "360px", overflowY: "auto", padding: "8px" }}>
              {results.length === 0 && (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--gz-text2)", fontSize: "0.85rem" }}>
                  No matches for &ldquo;{query}&rdquo;
                </div>
              )}

              {results.map((r, i) => {
                const Icon = r.type === "action" ? r.icon : null
                const isActive = i === activeIndex
                return (
                  <button
                    key={r.id}
                    onClick={() => runResult(r)}
                    onMouseEnter={() => setActiveIndex(i)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: "12px",
                      padding: "10px 12px", borderRadius: "10px", border: "none", cursor: "pointer",
                      background: isActive ? "var(--gz-surface2)" : "transparent",
                      textAlign: "left", marginBottom: "2px",
                    }}
                  >
                    {r.type === "product" ? (
                      <img src={r.product.image_url} alt="" style={{ width: "28px", height: "28px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }} />
                    ) : (
                      <Icon size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                    )}
                    <span style={{ flex: 1, fontSize: "0.88rem", fontWeight: "600", color: "var(--gz-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.label}
                    </span>
                    {r.type === "product" && (
                      <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#f59e0b", flexShrink: 0 }}>{formatPrice(r.product.price)}</span>
                    )}
                    {isActive && <CornerDownLeft size={13} color="var(--gz-text2)" style={{ flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
