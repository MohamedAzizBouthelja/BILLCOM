import { useState, useEffect } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { CheckCircle, Package, Home, Loader } from "lucide-react"
import { useAuthStore } from "../lib/store.js"
import OrderTimeline from "../components/OrderTimeline.jsx"

const ORDER_SERVICE = ""

export default function OrderSuccessPage() {
  const [sp] = useSearchParams()
  const orderNum = sp.get("order") || "GZ-XXXXXXXX"
  const sessionId = sp.get("session_id")
  const { token } = useAuthStore()

  const [verifying, setVerifying] = useState(!!sessionId)
  const [paid, setPaid] = useState(!sessionId)

  useEffect(() => {
    if (!sessionId) return
    const verify = async () => {
      try {
        const res = await fetch(ORDER_SERVICE + `/api/v1/orders/stripe/verify/${sessionId}`, {
          headers: { Authorization: "Bearer " + token },
        })
        if (res.ok) {
          const data = await res.json()
          setPaid(data.paid)
        }
      } catch {
        // ignore, treated as unpaid below
      } finally {
        setVerifying(false)
      }
    }
    verify()
  }, [sessionId])

  if (verifying) {
    return (
      <div style={{ paddingTop: "80px", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Loader size={40} color="#f59e0b" style={{ animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "var(--gz-text2)" }}>Vérification du paiement...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: "480px", padding: "40px 24px" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: paid ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <CheckCircle size={44} color={paid ? "#22c55e" : "#ef4444"} />
        </div>

        <h1 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "2rem", fontWeight: "800", color: "var(--gz-text)", marginBottom: "12px" }}>
          {paid ? "Commande confirmée ! 🎉" : "Paiement non confirmé"}
        </h1>
        <p style={{ color: "var(--gz-text2)", fontSize: "1rem", lineHeight: "1.7", marginBottom: "28px" }}>
          {paid
            ? "Merci pour votre achat. Votre commande a été confirmée et sera livrée sous peu."
            : "Le paiement n'a pas pu être vérifié. Contactez le support si vous avez été débité."}
        </p>

        <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", padding: "20px", marginBottom: "28px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--gz-text2)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
            Numéro de commande
          </div>
          <div style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontSize: "1.4rem", fontWeight: "800", color: "#f59e0b" }}>
            {orderNum}
          </div>
          {sessionId && (
            <div style={{ fontSize: "0.72rem", color: "var(--gz-text2)", marginTop: "6px" }}>
              Stripe session: {sessionId.slice(0, 20)}...
            </div>
          )}
        </div>

        {paid && (
          <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "14px", padding: "24px 16px", marginBottom: "32px" }}>
            <OrderTimeline status="processing" />
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          {paid && (
            <Link to="/account?tab=orders" className="btn-outline" style={{ gap: "8px" }}>
              <Package size={15} /> Suivre ma commande
            </Link>
          )}
          <Link to="/" className="btn-primary" style={{ gap: "8px" }}>
            <Home size={15} /> Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
