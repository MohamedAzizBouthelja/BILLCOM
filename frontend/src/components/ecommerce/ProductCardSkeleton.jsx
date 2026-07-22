export default function ProductCardSkeleton() {
  return (
    <div className="gz-card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="pc-image-wrap skeleton" />
      <div style={{ padding: "18px 18px 0" }}>
        <div className="skeleton" style={{ height: "10px", width: "40%", marginBottom: "10px" }} />
        <div className="skeleton" style={{ height: "14px", width: "85%", marginBottom: "6px" }} />
        <div className="skeleton" style={{ height: "14px", width: "60%", marginBottom: "12px" }} />
        <div className="skeleton" style={{ height: "18px", width: "45%" }} />
      </div>
      <div style={{ padding: "16px 18px 18px", marginTop: "auto" }}>
        <div className="skeleton" style={{ height: "38px", width: "100%", borderRadius: "10px" }} />
      </div>
    </div>
  )
}
