import { Link } from "react-router-dom"
import LogoMark from "../Logo.jsx"

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
              <span style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.25rem", fontWeight: "800", color: "#f59e0b" }}>
                Gadget<span style={{ color: "var(--gz-text)" }}>Zone</span>
              </span>
            </Link>
            <p style={{ fontSize: "0.85rem", color: "var(--gz-text2)", lineHeight: "1.7", maxWidth: "220px", marginBottom: "20px" }}>
              Your one-stop destination for next-level technology. 500+ products, 50K+ happy customers.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem", color: "var(--gz-text2)" }}>
              <span>📧 support@gadgetzone.com</span>
              <span>📞 +1-800-GADGETS</span>
              <span>🕐 24/7 Customer Support</span>
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
                    <Link
                      to={l.path}
                      style={{ fontSize: "0.875rem", color: "var(--gz-text2)", textDecoration: "none", transition: "color 0.15s" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#f59e0b"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "var(--gz-text2)"}
                    >
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
          <div style={{ display: "flex", gap: "20px", fontSize: "0.8rem", color: "var(--gz-text2)" }}>
            <span>🔒 Secure Payments</span>
            <span>🚚 Free Delivery over ৳5,000</span>
            <span>↩ 7-Day Returns</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
