import { Check, Clock, Package, Truck, Home, XCircle } from "lucide-react"

const STEPS = [
  { key: "pending",    label: "Order Placed", icon: Clock },
  { key: "processing", label: "Processing",   icon: Package },
  { key: "shipped",    label: "Shipped",      icon: Truck },
  { key: "delivered",  label: "Delivered",    icon: Home },
]

export default function OrderTimeline({ status = "pending" }) {
  if (status === "cancelled") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "12px", color: "#f87171" }}>
        <XCircle size={18} />
        <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>This order was cancelled.</span>
      </div>
    )
  }

  const found = STEPS.findIndex((s) => s.key === status)
  const activeIndex = found === -1 ? 0 : found

  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      {STEPS.map((step, i) => {
        const done = i < activeIndex
        const current = i === activeIndex
        const Icon = step.icon
        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "0 0 auto" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                background: done || current ? "#f59e0b" : "var(--gz-surface2)",
                border: done || current ? "none" : "1.5px solid var(--gz-border)",
                color: done || current ? "#0a0a0f" : "var(--gz-text2)",
              }}>
                {done ? <Check size={16} /> : <Icon size={16} />}
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: "600", color: done || current ? "var(--gz-text)" : "var(--gz-text2)", whiteSpace: "nowrap" }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: "2px", margin: "0 6px 22px", background: done ? "#f59e0b" : "var(--gz-border)" }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
