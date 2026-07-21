import { useState, useEffect, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { ShoppingCart, Star, Truck, Shield, RefreshCcw, Plus, Minus, Send, Trash2 } from "lucide-react"
import { useProductStore, useCartStore, useAuthStore, formatPrice } from "../lib/store.js"
import { useCartToastStore } from "../lib/toastStore.js"
import { useRecentlyViewedStore } from "../lib/recentlyViewedStore.js"
import ProductCard from "../components/ecommerce/ProductCard.jsx"

const PRODUCT_SERVICE = ""

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", fontSize: "1.6rem", color: (hovered || value) >= n ? "#f59e0b" : "var(--gz-border)" }}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function ReviewSkeleton() {
  return (
    <div style={{ padding: "18px 0", borderBottom: "1px solid var(--gz-border2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <div className="skeleton" style={{ width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: "12px", width: "40%", marginBottom: "6px" }} />
          <div className="skeleton" style={{ height: "10px", width: "25%" }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: "12px", width: "90%" }} />
    </div>
  )
}

function ReviewItem({ review, canDelete, onDelete }) {
  const stars = Math.round(review.rating)
  return (
    <div style={{ padding: "18px 0", borderBottom: "1px solid var(--gz-border2)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: "#f59e0b", fontSize: "0.85rem", flexShrink: 0 }}>
              {review.username[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: "600", fontSize: "0.9rem", color: "var(--gz-text)" }}>{review.username}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--gz-text2)" }}>
                {new Date(review.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
          </div>
          <div style={{ color: "#f59e0b", fontSize: "1rem", marginBottom: "6px" }}>{"★".repeat(stars)}{"☆".repeat(5 - stars)}</div>
          {review.comment && <p style={{ fontSize: "0.9rem", color: "var(--gz-text2)", lineHeight: "1.6" }}>{review.comment}</p>}
        </div>
        {canDelete && (
          <button onClick={() => onDelete(review.id)} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gz-text2)", padding: "4px", flexShrink: 0 }} onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--gz-text2)"}>
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function ProductPage() {
  const { slug } = useParams()
  const { products } = useProductStore()
  const { addItem } = useCartStore()
  const showToast = useCartToastStore((s) => s.show)
  const { token, user, isLoggedIn } = useAuthStore()
  const recentIds = useRecentlyViewedStore((s) => s.ids)
  const trackRecentlyViewed = useRecentlyViewedStore((s) => s.track)
  const product = products.find((p) => p.slug === slug)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: "center", transform: "scale(1)" })
  const [selectedImage, setSelectedImage] = useState(0)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const ctaRef = useRef(null)

  useEffect(() => {
    const el = ctaRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), { threshold: 0 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [product])

  const handleImageMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomStyle({ transformOrigin: `${x}% ${y}%`, transform: "scale(1.8)" })
  }
  const handleImageMouseLeave = () => setZoomStyle({ transformOrigin: "center", transform: "scale(1)" })

  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState("")
  const [reviewSuccess, setReviewSuccess] = useState(false)

  const loggedIn = isLoggedIn()
  const userId = user?.id || user?.user_id

  const fetchReviews = async (productId) => {
    setReviewsLoading(true)
    try {
      const res = await fetch(PRODUCT_SERVICE + `/api/v1/products/${productId}/reviews`)
      if (res.ok) setReviews(await res.json())
    } catch {
      // ignore, keep previous reviews
    } finally {
      setReviewsLoading(false)
    }
  }

  useEffect(() => {
    if (product) fetchReviews(product.id)
  }, [product?.id])

  useEffect(() => {
    if (product) trackRecentlyViewed(product.id)
  }, [product?.id])

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (newRating === 0) { setReviewError("Veuillez choisir une note."); return }
    setSubmitting(true)
    setReviewError("")
    try {
      const res = await fetch(PRODUCT_SERVICE + `/api/v1/products/${product.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ rating: newRating, comment: newComment.trim() || null }),
      })
      if (res.ok) {
        setNewRating(0)
        setNewComment("")
        setReviewSuccess(true)
        setTimeout(() => setReviewSuccess(false), 3000)
        fetchReviews(product.id)
      } else {
        const err = await res.json()
        setReviewError(err.detail || "Erreur lors de l'envoi.")
      }
    } catch {
      setReviewError("Erreur de connexion.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    try {
      const res = await fetch(PRODUCT_SERVICE + `/api/v1/products/${product.id}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      })
      if (res.ok) fetchReviews(product.id)
    } catch {
      // ignore, review list stays unchanged
    }
  }

  if (!product) {
    return (
      <div style={{ paddingTop: "100px", textAlign: "center", padding: "120px 24px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>😕</div>
        <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "700", color: "var(--gz-text)", marginBottom: "8px" }}>Product Not Found</h2>
        <Link to="/shop" className="btn-primary" style={{ marginTop: "16px", display: "inline-flex" }}>Back to Shop</Link>
      </div>
    )
  }

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)
  const gallery = product.images && product.images.length > 0 ? product.images : [product.image_url]
  const recentlyViewed = recentIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p) => p && p.id !== product.id)
    .slice(0, 4)

  const handleAddToCart = () => {
    addItem(product, qty)
    showToast(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const badgeClassFor = (b) => {
    if (b === "NEW")  return "badge-new"
    if (b === "HOT")  return "badge-hot"
    if (b === "SALE") return "badge-sale"
    return ""
  }

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : product.rating
  const userAlreadyReviewed = reviews.some((r) => r.user_id === userId)

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh" }}>
      <div className="gz-container" style={{ paddingTop: "32px", paddingBottom: "64px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: "0.8rem", color: "var(--gz-text2)", marginBottom: "28px", display: "flex", gap: "6px", alignItems: "center" }}>
          <Link to="/" style={{ color: "var(--gz-text2)", textDecoration: "none" }} onMouseEnter={(e) => e.currentTarget.style.color = "#f59e0b"} onMouseLeave={(e) => e.currentTarget.style.color = "#9090a8"}>Home</Link>
          <span>›</span>
          <Link to="/shop" style={{ color: "var(--gz-text2)", textDecoration: "none" }} onMouseEnter={(e) => e.currentTarget.style.color = "#f59e0b"} onMouseLeave={(e) => e.currentTarget.style.color = "#9090a8"}>Shop</Link>
          <span>›</span>
          <Link to={"/shop?cat=" + product.category} style={{ color: "var(--gz-text2)", textDecoration: "none", textTransform: "capitalize" }} onMouseEnter={(e) => e.currentTarget.style.color = "#f59e0b"} onMouseLeave={(e) => e.currentTarget.style.color = "#9090a8"}>{product.category_name}</Link>
          <span>›</span>
          <span style={{ color: "var(--gz-text)" }}>{product.name}</span>
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", marginBottom: "64px" }}>

          {/* Image */}
          <div>
            <div
              className="pc-image-wrap"
              style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "20px", aspectRatio: "1", height: "auto", cursor: "zoom-in" }}
              onMouseMove={handleImageMouseMove}
              onMouseLeave={handleImageMouseLeave}
            >
              <img
                src={gallery[selectedImage]}
                alt={product.name}
                loading="lazy"
                decoding="async"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.15s ease", ...zoomStyle }}
              />
            </div>
            {gallery.length > 1 && (
              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                {gallery.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    style={{
                      width: "64px", height: "64px", borderRadius: "10px", overflow: "hidden", padding: 0, cursor: "pointer", flexShrink: 0,
                      border: i === selectedImage ? "2px solid #f59e0b" : "1.5px solid var(--gz-border)",
                      background: "var(--gz-surface)",
                    }}
                  >
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.badge && <span className={`gz-badge ${badgeClassFor(product.badge)}`}>{product.badge}</span>}
            <div style={{ fontSize: "0.8rem", color: "#f59e0b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "12px", marginBottom: "8px" }}>{product.category_name}</div>
            <h1 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.9rem", fontWeight: "800", letterSpacing: "-0.015em", color: "var(--gz-text)", marginBottom: "16px", lineHeight: "1.2" }}>{product.name}</h1>

            {/* Rating */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <span className="stars" style={{ fontSize: "1rem" }}>{"★".repeat(Math.round(Number(avgRating)))}</span>
              <span style={{ fontWeight: "700", color: "var(--gz-text)" }}>{avgRating}</span>
              <span style={{ color: "var(--gz-text2)", fontSize: "0.85rem" }}>({reviews.length || product.reviews} avis)</span>
            </div>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", fontVariantNumeric: "tabular-nums" }}>
              <span style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "2.2rem", fontWeight: "800", letterSpacing: "-0.015em", color: "#f59e0b" }}>{formatPrice(product.price)}</span>
              {product.old_price && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "1.1rem", color: "var(--gz-text2)", textDecoration: "line-through" }}>{formatPrice(product.old_price)}</span>
                    <span className="discount-pct">-{Math.round((1 - product.price / product.old_price) * 100)}%</span>
                  </div>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "#22c55e", fontWeight: "700" }}>
                    Save {formatPrice(product.old_price - product.price)}
                  </span>
                </div>
              )}
            </div>

            <p style={{ color: "var(--gz-text2)", fontSize: "0.95rem", lineHeight: "1.75", marginBottom: "28px" }}>{product.description}</p>

            {/* Quantity + add to cart */}
            <div ref={ctaRef} style={{ display: "flex", gap: "14px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--gz-border)", borderRadius: "10px", overflow: "hidden" }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: "40px", height: "44px", background: "none", border: "none", color: "var(--gz-text2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={(e) => e.currentTarget.style.color = "#f59e0b"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--gz-text2)"}>
                  <Minus size={16} />
                </button>
                <span style={{ width: "40px", textAlign: "center", fontWeight: "700", color: "var(--gz-text)", fontSize: "0.95rem" }}>{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} style={{ width: "40px", height: "44px", background: "none", border: "none", color: "var(--gz-text2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={(e) => e.currentTarget.style.color = "#f59e0b"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--gz-text2)"}>
                  <Plus size={16} />
                </button>
              </div>
              <button onClick={handleAddToCart} className="btn-primary" style={{ flex: 1, justifyContent: "center", padding: "12px 24px", minWidth: "180px" }}>
                <ShoppingCart size={16} /> {added ? "Added!" : "Add to Cart"}
              </button>
              <Link to="/cart" className="btn-outline" style={{ padding: "12px 20px", justifyContent: "center" }}>View Cart</Link>
            </div>

            {/* Stock */}
            <div style={{ fontSize: "0.85rem", color: product.stock > 10 ? "#22c55e" : "#f59e0b", marginBottom: "24px", fontWeight: "600" }}>
              {product.stock > 10 ? "✓ In Stock" : "⚠ Only " + product.stock + " left"}
            </div>

            {/* Features */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { icon: Truck, text: "Free delivery on orders over ৳5,000" },
                { icon: Shield, text: "2-year manufacturer warranty" },
                { icon: RefreshCcw, text: "7-day hassle-free returns" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", color: "var(--gz-text2)" }}>
                  <Icon size={16} color="#f59e0b" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Reviews Section ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: "64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
            <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.5rem", fontWeight: "800", color: "var(--gz-text)" }}>
              Avis clients
            </h2>
            <span style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", fontSize: "0.8rem", fontWeight: "700", padding: "4px 12px", borderRadius: "999px" }}>
              {reviews.length} avis
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }}>

            {/* Left: list of reviews */}
            <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "16px", padding: "24px" }}>
              {reviewsLoading ? (
                <>
                  <ReviewSkeleton />
                  <ReviewSkeleton />
                </>
              ) : reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "12px" }}>💬</div>
                  <p style={{ color: "var(--gz-text2)", fontSize: "0.9rem" }}>Soyez le premier à laisser un avis !</p>
                </div>
              ) : (
                reviews.map((r) => (
                  <ReviewItem
                    key={r.id}
                    review={r}
                    canDelete={loggedIn && (r.user_id === userId || user?.role === "admin")}
                    onDelete={handleDeleteReview}
                  />
                ))
              )}
            </div>

            {/* Right: add review form */}
            <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "16px", padding: "24px" }}>
              <h3 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.05rem", fontWeight: "700", color: "var(--gz-text)", marginBottom: "20px" }}>
                Laisser un avis
              </h3>

              {!loggedIn ? (
                <div style={{ textAlign: "center", padding: "24px" }}>
                  <p style={{ color: "var(--gz-text2)", marginBottom: "16px", fontSize: "0.9rem" }}>Connectez-vous pour laisser un avis.</p>
                  <Link to="/login" className="btn-primary" style={{ display: "inline-flex" }}>Se connecter</Link>
                </div>
              ) : userAlreadyReviewed ? (
                <div style={{ textAlign: "center", padding: "24px", color: "var(--gz-text2)", fontSize: "0.9rem" }}>
                  ✓ Vous avez déjà laissé un avis pour ce produit.
                </div>
              ) : (
                <form onSubmit={handleSubmitReview}>
                  <div style={{ marginBottom: "18px" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Votre note *
                    </label>
                    <StarPicker value={newRating} onChange={setNewRating} />
                  </div>

                  <div style={{ marginBottom: "18px" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Commentaire (optionnel)
                    </label>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Partagez votre expérience avec ce produit..."
                      rows={4}
                      className="gz-input"
                      style={{ resize: "vertical", minHeight: "100px" }}
                    />
                  </div>

                  {reviewError && (
                    <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", padding: "10px 14px", fontSize: "0.85rem", color: "#ef4444", marginBottom: "14px" }}>
                      {reviewError}
                    </div>
                  )}

                  {reviewSuccess && (
                    <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "8px", padding: "10px 14px", fontSize: "0.85rem", color: "#22c55e", marginBottom: "14px" }}>
                      ✓ Votre avis a été publié !
                    </div>
                  )}

                  <button type="submit" className="btn-primary" disabled={submitting} style={{ width: "100%", justifyContent: "center", opacity: submitting ? 0.7 : 1 }}>
                    <Send size={15} /> {submitting ? "Envoi..." : "Publier l'avis"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div style={{ marginBottom: recentlyViewed.length > 0 ? "64px" : "0" }}>
            <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.5rem", fontWeight: "800", color: "var(--gz-text)", marginBottom: "24px" }}>Produits similaires</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: "20px" }}>
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        {/* Recently viewed */}
        {recentlyViewed.length > 0 && (
          <div>
            <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.5rem", fontWeight: "800", color: "var(--gz-text)", marginBottom: "24px" }}>Recently Viewed</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: "20px" }}>
              {recentlyViewed.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Add to Cart bar — shown once the main CTA scrolls out of view */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 900,
              background: "var(--gz-surface)", borderTop: "1px solid var(--gz-border)",
              boxShadow: "0 -10px 30px rgba(0,0,0,0.3)", padding: "12px 24px",
            }}
          >
            <div className="gz-container" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <img src={product.image_url} alt={product.name} style={{ width: "44px", height: "44px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--gz-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</div>
                <div style={{ fontSize: "0.9rem", fontWeight: "800", color: "#f59e0b" }}>{formatPrice(product.price)}</div>
              </div>
              <button onClick={handleAddToCart} className="btn-primary" style={{ flexShrink: 0 }}>
                <ShoppingCart size={16} /> {added ? "Added!" : "Add to Cart"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
