import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Rocket } from "lucide-react"
import { useAuthStore } from "../lib/store.js"

export default function RegisterPage() {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "", confirm: "" })
  const { register, login, loading, error } = useAuthStore()
  const navigate = useNavigate()
  const [localError, setLocalError] = useState("")

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError("")
    if (!form.first_name || !form.email || !form.password) { setLocalError("Please fill in all required fields"); return }
    if (form.password.length < 6) { setLocalError("Password must be at least 6 characters"); return }
    if (form.password !== form.confirm) { setLocalError("Passwords do not match"); return }
    const result = await register(form.first_name, form.last_name, form.email, form.password)
    if (result.ok) {
      await login(form.email, form.password)
      navigate("/account")
    }
  }

  const err = localError || error

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px 48px" }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>
        <div style={{ background: "var(--gz-surface)", border: "1px solid var(--gz-border)", borderRadius: "20px", padding: "40px" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ fontSize: "1.5rem", fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", marginBottom: "6px" }}>
              <span style={{ color: "#f59e0b" }}>Gadget</span><span style={{ color: "var(--gz-text)" }}>Zone</span>
            </div>
            <h1 style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "800", fontSize: "1.4rem", color: "var(--gz-text)", marginBottom: "6px" }}>Create Account 🚀</h1>
            <p style={{ fontSize: "0.875rem", color: "var(--gz-text2)" }}>Join GadgetZone and start shopping</p>
          </div>

          {err && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", color: "#f87171", fontSize: "0.875rem" }}>{err}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[{ k: "first_name", label: "First Name *", ph: "John" }, { k: "last_name", label: "Last Name", ph: "Doe" }].map(({ k, label, ph }) => (
                <div key={k}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>{label}</label>
                  <input value={form[k]} onChange={set(k)} placeholder={ph} className="gz-input" onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"} onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
                </div>
              ))}
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>Email Address *</label>
              <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required className="gz-input" onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"} onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>Password * (min 6 chars)</label>
              <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" required className="gz-input" onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"} onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--gz-text2)", marginBottom: "6px" }}>Confirm Password *</label>
              <input type="password" value={form.confirm} onChange={set("confirm")} placeholder="••••••••" required className="gz-input" onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"} onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "0.95rem", marginTop: "4px", opacity: loading ? 0.7 : 1 }}>
              <Rocket size={16} /> {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.875rem", color: "var(--gz-text2)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#f59e0b", fontWeight: "600", textDecoration: "none" }}>Log in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
