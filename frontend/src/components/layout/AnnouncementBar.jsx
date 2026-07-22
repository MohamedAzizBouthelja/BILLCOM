import { Truck, Sparkles, Undo2 } from "lucide-react"
import { formatPrice } from "../../lib/store.js"

const ITEMS = [
  { icon: Truck, text: `Free delivery on orders over ${formatPrice(5000)}` },
  { icon: Sparkles, text: "New gadgets added every week" },
  { icon: Undo2, text: "7-day hassle-free returns" },
]

export default function AnnouncementBar({ collapsed }) {
  return (
    <div
      style={{
        maxHeight: collapsed ? "0px" : "30px",
        opacity: collapsed ? 0 : 1,
        overflow: "hidden",
        borderBottom: collapsed ? "none" : "1px solid rgba(245,158,11,0.15)",
        transition: "max-height 0.25s ease, opacity 0.2s ease, border-color 0.25s ease",
      }}
    >
      <div
        className="gz-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "32px",
          padding: "8px 24px",
          flexWrap: "wrap",
        }}
      >
        {ITEMS.map(({ icon: Icon, text }) => (
          <span
            key={text}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "0.72rem",
              fontWeight: "600",
              letterSpacing: "0.03em",
              color: "#e0e0f0",
              whiteSpace: "nowrap",
            }}
          >
            <Icon size={12} color="#f59e0b" />
            {text}
          </span>
        ))}
      </div>
    </div>
  )
}
