import { Link } from "react-router-dom"
import { Mail, Phone, Clock, Lock, Truck, Undo2 } from "lucide-react"
import LogoMark, { LogoWordmark } from "../Logo.jsx"
import { formatPrice } from "../../lib/store.js"

const LINKS = {
  Shop:    [{ label: "Smartphones", path: "/shop?cat=smartphones" }, { label: "Laptops", path: "/shop?cat=laptops" }, { label: "Audio", path: "/shop?cat=audio" }, { label: "Cameras", path: "/shop?cat=cameras" }, { label: "Wearables", path: "/shop?cat=wearables" }, { label: "Accessories", path: "/shop?cat=accessories" }],
  Account: [{ label: "My Account", path: "/account" }, { label: "My Orders", path: "/account?tab=orders" }, { label: "Checkout", path: "/checkout" }, { label: "Login", path: "/login" }, { label: "Register", path: "/register" }],
  Info:    [{ label: "Home", path: "/" }, { label: "Deals", path: "/shop?badge=SALE" }, { label: "New Arrivals", path: "/shop?badge=NEW" }, { label: "Hot Products", path: "/shop?badge=HOT" }],
}

export default function Footer() {
  return (
    <footer style={{ background: "var(--gz-surface)", borderTop: "1px solid var(--gz-border2)" }}>
      <div className="gz-container" style={{ paddingTop: "56px", paddingBottom: "32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "40px", marginBottom: "48px" }}>

          {/* Brand */}
          <div>
            <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "16px", textDecoration: "none" }}>
              <LogoMark size={32} />
              <LogoWordmark fontSize="1.25rem" tagline={false} />
            </Link>
            <p style={{ fontSize: "0.85rem", color: "var(--gz-text2)", lineHeight: "1.7", maxWidth: "220px", marginBottom: "20px" }}>
              Your one-stop destination for next-level technology. 500+ products, 50K+ happy customers.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.8rem", color: "var(--gz-text2)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><Mail size={14} color="#f59e0b" /> support@gadgetzone.com</span>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><Phone size={14} color="#f59e0b" /> +1-800-GADGETS</span>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><Clock size={14} color="#f59e0b" /> 24/7 Customer Support</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--gz-text)", marginBottom: "16px" }}>
                {title}
              </h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                {links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.path} className="gz-text-link" style={{ fontSize: "0.875rem" }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter mini */}
          <div>
            <h4 style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--gz-text)", marginBottom: "16px" }}>
              Newsletter
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--gz-text2)", marginBottom: "14px" }}>Get exclusive deals in your inbox.</p>
            <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", gap: "8px" }}>
              <input type="email" placeholder="Your email" className="gz-input" style={{ flex: 1, padding: "9px 12px", fontSize: "0.8rem" }} />
              <button type="submit" className="btn-primary" style={{ padding: "9px 14px", fontSize: "0.8rem", whiteSpace: "nowrap" }}>Go</button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid var(--gz-border2)", paddingTop: "24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <p style={{ fontSize: "0.8rem", color: "var(--gz-text2)" }}>© 2026 GadgetZone. All rights reserved.</p>
          <div style={{ display: "flex", gap: "20px", fontSize: "0.8rem", color: "var(--gz-text2)", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Lock size={13} color="#f59e0b" /> Secure Payments</span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Truck size={13} color="#f59e0b" /> Free Delivery over {formatPrice(5000)}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Undo2 size={13} color="#f59e0b" /> 7-Day Returns</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
