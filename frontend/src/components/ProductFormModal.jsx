import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { useProductStore, CATEGORIES } from "../lib/store.js"

const BADGES = ["", "HOT", "NEW", "SALE"]

const slugify = (s) =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  old_price: "",
  stock: "",
  image_url: "",
  badge: "",
  featured: false,
  category: CATEGORIES[0].slug,
  category_name: CATEGORIES[0].name,
}

export default function ProductFormModal({ mode, product, onClose, onSaved }) {
  const { createProduct, updateProduct } = useProductStore()
  const [form, setForm] = useState(emptyForm)
  const [slugTouched, setSlugTouched] = useState(mode === "edit")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  useEffect(() => {
    if (mode === "edit" && product) {
      setForm({
        name: product.name || "",
        slug: product.slug || "",
        description: product.description || "",
        price: product.price != null ? String(Number(product.price) / 100) : "",
        old_price: product.old_price != null ? String(Number(product.old_price) / 100) : "",
        stock: product.stock != null ? String(product.stock) : "0",
        image_url: product.image_url || "",
        badge: product.badge || "",
        featured: !!product.featured,
        category: product.category || CATEGORIES[0].slug,
        category_name: product.category_name || CATEGORIES[0].name,
      })
    }
  }, [mode, product])

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  const handleNameChange = (name) => {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }))
  }

  const handleCategoryChange = (slug) => {
    const cat = CATEGORIES.find((c) => c.slug === slug) || CATEGORIES[0]
    setForm((f) => ({ ...f, category: cat.slug, category_name: cat.name }))
  }

  const validate = () => {
    if (form.name.trim().length < 2 || form.name.length > 100) return "Name must be between 2 and 100 characters."
    if (form.slug.trim().length < 2 || form.slug.length > 120) return "Slug must be between 2 and 120 characters."
    if (form.description.length > 500) return "Description must be 500 characters or fewer."
    const price = Number(form.price)
    if (!form.price || !(price > 0)) return "Price must be greater than 0."
    const stock = Number(form.stock)
    if (form.stock === "" || !Number.isInteger(stock) || stock < 0) return "Stock must be a non-negative whole number."
    return ""
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setFormError(validationError)
      return
    }
    setSubmitting(true)
    setFormError("")

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      price: Math.round(Number(form.price) * 100),
      old_price: form.old_price ? Math.round(Number(form.old_price) * 100) : null,
      stock: Number(form.stock),
      image_url: form.image_url.trim() || null,
      badge: form.badge,
      featured: form.featured,
      category: form.category,
      category_name: form.category_name,
    }

    const result = mode === "create" ? await createProduct(payload) : await updateProduct(product.id, payload)
    setSubmitting(false)
    if (result.ok) onSaved()
    else setFormError(result.error)
  }

  const labelStyle = { display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "8px" }
  const fieldWrap = { marginBottom: "16px" }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1200,
          background: "rgba(10,10,15,0.75)",
          backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--gz-surface)", border: "1px solid var(--gz-border)",
            borderRadius: "20px", maxWidth: "640px", width: "100%", maxHeight: "88vh",
            overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.5)", padding: "28px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h2 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.25rem", color: "var(--gz-text)" }}>
              {mode === "create" ? "Add Product" : "Edit Product"}
            </h2>
            <button onClick={onClose} className="gz-icon-btn" style={{ background: "none", border: "none", cursor: "pointer", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: "10px", padding: "10px 14px", fontSize: "0.82rem", marginBottom: "16px" }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={fieldWrap}>
              <label style={labelStyle}>Name</label>
              <input className="gz-input" maxLength={100} value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Slug</label>
              <input className="gz-input" maxLength={120} value={form.slug} onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })) }} />
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Description ({form.description.length}/500)</label>
              <textarea className="gz-input" rows={3} maxLength={500} style={{ resize: "vertical" }} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelStyle}>Price ($)</label>
                <input type="number" step="0.01" min="0.01" className="gz-input" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Old Price ($, optional)</label>
                <input type="number" step="0.01" min="0" className="gz-input" value={form.old_price} onChange={(e) => setForm((f) => ({ ...f, old_price: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelStyle}>Stock</label>
                <input type="number" step="1" min="0" className="gz-input" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Badge</label>
                <select className="gz-input" value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}>
                  {BADGES.map((b) => <option key={b} value={b}>{b || "None"}</option>)}
                </select>
              </div>
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Image URL</label>
              <input type="url" className="gz-input" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} />
              {form.image_url && (
                <img src={form.image_url} alt="" style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px", marginTop: "8px" }} />
              )}
            </div>

            <div style={fieldWrap}>
              <label style={labelStyle}>Category</label>
              <select className="gz-input" value={form.category} onChange={(e) => handleCategoryChange(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--gz-text)", marginBottom: "22px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
              Featured product
            </label>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Saving..." : mode === "create" ? "Add Product" : "Save Changes"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
