import { Truck, RefreshCcw, Shield, Headphones, Lock } from "lucide-react"

const FEATURES = [
  { icon: Truck,       title: "Free Delivery",   sub: "On orders over ৳5,000" },
  { icon: RefreshCcw,  title: "7-Day Returns",   sub: "Hassle-free returns" },
  { icon: Shield,      title: "2-Year Warranty", sub: "On all products" },
  { icon: Headphones,  title: "24/7 Support",    sub: "Always here to help" },
  { icon: Lock,        title: "Secure Payment",  sub: "100% protected" },
]

// Duplicate items so the marquee loops seamlessly
const ITEMS = [...FEATURES, ...FEATURES]

export default function FeatureStrip() {
  return (
    <section className="feature-strip" style={{ padding: "28px 0", overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          width: "max-content",
          animation: "marquee 22s linear infinite",
        }}
        onMouseEnter={e => (e.currentTarget.style.animationPlayState = "paused")}
        onMouseLeave={e => (e.currentTarget.style.animationPlayState = "running")}
      >
        {ITEMS.map(({ icon: Icon, title, sub }, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: "14px", padding: "0 48px", flexShrink: 0 }}
          >
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={18} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--gz-text)", marginBottom: "2px", whiteSpace: "nowrap" }}>{title}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--gz-text2)", whiteSpace: "nowrap" }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
