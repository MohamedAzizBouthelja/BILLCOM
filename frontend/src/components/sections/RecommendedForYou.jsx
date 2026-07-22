import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Sparkles } from "lucide-react"
import { useProductStore, useOrderStore, useAuthStore } from "../../lib/store.js"
import { useRecentlyViewedStore } from "../../lib/recentlyViewedStore.js"
import { getRecommendations, describeProfile } from "../../lib/recommend.js"
import { fetchRecommendationBlurbs } from "../../lib/recommendBlurbs.js"
import ProductCard from "../ecommerce/ProductCard.jsx"
import { useScrollReveal } from "../../hooks/useScrollReveal.js"

// Module-level cache (survives re-renders and remounts within the tab session) so
// navigating between pages doesn't re-trigger a Groq call for the same product set.
const blurbCache = new Map()

export default function RecommendedForYou({ excludeId, limit = 8 }) {
  const products = useProductStore((s) => s.products)
  const orders = useOrderStore((s) => s.orders)
  const fetchOrders = useOrderStore((s) => s.fetchOrders)
  const recentIds = useRecentlyViewedStore((s) => s.ids)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const [ref, isVisible] = useScrollReveal(0.15)
  const [blurbs, setBlurbs] = useState({})

  useEffect(() => {
    if (isLoggedIn()) fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const recommendations = useMemo(() => {
    const recs = getRecommendations(products, orders, recentIds, { limit: limit + (excludeId ? 1 : 0) })
    return recs.filter((p) => p.id !== excludeId).slice(0, limit)
  }, [products, orders, recentIds, excludeId, limit])

  const profileSummary = useMemo(
    () => describeProfile(products, orders, recentIds),
    [products, orders, recentIds]
  )

  useEffect(() => {
    if (recommendations.length === 0) return
    const key = recommendations.map((p) => p.id).join(",")
    if (blurbCache.has(key)) { setBlurbs(blurbCache.get(key)); return }

    let cancelled = false
    fetchRecommendationBlurbs(recommendations, profileSummary).then((result) => {
      if (cancelled) return
      blurbCache.set(key, result)
      setBlurbs(result)
    })
    return () => { cancelled = true }
  }, [recommendations, profileSummary])

  if (recommendations.length === 0) return null

  return (
    <section style={{ padding: "72px 0" }}>
      <div className="gz-container" ref={ref}>
        <div className={`reveal-up${isVisible ? " is-visible" : ""}`} style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "40px", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div className="section-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Sparkles size={13} /> Pour vous
            </div>
            <h2 className="section-title">Recommandé pour vous</h2>
          </div>
          <Link to="/shop" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f59e0b", fontSize: "0.9rem", fontWeight: "600", textDecoration: "none" }}
            onMouseEnter={(e) => e.currentTarget.style.gap = "10px"}
            onMouseLeave={(e) => e.currentTarget.style.gap = "6px"}>
            Voir tout <ArrowRight size={16} />
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: "20px" }}>
          {recommendations.map((p, i) => (
            <div key={p.id} className={`reveal-up${isVisible ? " is-visible" : ""}`} style={{ transitionDelay: `${isVisible ? i * 60 : 0}ms` }}>
              <ProductCard product={p} blurb={blurbs[p.id]} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
