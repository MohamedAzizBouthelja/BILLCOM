import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Lock } from "lucide-react"
import { useAuthStore } from "../lib/store.js"

export default function LoginPage() {
  const [email, setEmail]     = useState("")
  const [password, setPwd]    = useState("")
  const { login, loading, error } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(email, password)
    if (result.ok) navigate("/account")
  }

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px 48px" }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "20px", padding: "40px" }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ fontSize: "1.5rem", fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", marginBottom: "6px" }}>
              <span style={{ color: "#f59e0b" }}>Gadget</span><span style={{ color: "var(--gz-text)" }}>Zone</span>
            </div>
            <h1 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.4rem", color: "var(--gz-text)", marginBottom: "6px" }}>Welcome Back 👋</h1>
            <p style={{ fontSize: "0.875rem", color: "var(--gz-text2)" }}>Log in to your GadgetZone account</p>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", color: "#f87171", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "8px" }}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                className="gz-input"
                onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--gz-border)"}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "8px" }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPwd(e.target.value)} placeholder="••••••••" required
                className="gz-input"
                onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--gz-border)"}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "0.95rem", marginTop: "4px", opacity: loading ? 0.7 : 1 }}>
              <Lock size={16} /> {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.875rem", color: "var(--gz-text2)" }}>
            Don&apos;t have an account?{" "}
            <Link to="/register" style={{ color: "#f59e0b", fontWeight: "600", textDecoration: "none" }}>Create one →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
