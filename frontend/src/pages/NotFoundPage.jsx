import { Link } from "react-router-dom"
import { ArrowLeft, SearchX } from "lucide-react"
import LogoMark from "../components/Logo.jsx"

export default function NotFoundPage() {
  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <div className="gz-container" style={{ textAlign: "center", maxWidth: "560px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <LogoMark size={56} />
        </div>

        <div style={{
          fontFamily: "Bricolage Grotesque, sans-serif",
          fontSize: "clamp(4rem, 12vw, 7rem)",
          fontWeight: "800",
          lineHeight: "1",
          color: "var(--gz-text)",
          marginBottom: "8px",
          position: "relative",
        }}>
          4
          <span style={{ display: "inline-block", color: "#f59e0b" }}>0</span>
          4
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "16px", color: "var(--gz-text2)" }}>
          <SearchX size={18} />
          <span style={{ fontSize: "0.78rem", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase" }}>Signal Lost</span>
        </div>

        <h1 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.5rem", fontWeight: "800", color: "var(--gz-text)", marginBottom: "12px" }}>
          This gadget wandered off the shelf.
        </h1>
        <p style={{ color: "var(--gz-text2)", fontSize: "0.95rem", lineHeight: "1.7", marginBottom: "32px" }}>
          The page you're looking for doesn't exist, got moved, or never shipped.
          Let's get you back to the catalog.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/" className="btn-primary">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <Link to="/shop" className="btn-outline">Browse Shop</Link>
        </div>
      </div>
    </div>
  )
}
