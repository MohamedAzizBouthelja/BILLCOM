import { useState, useRef, useEffect } from "react"
import { Send, X, Minus, Bot } from "lucide-react"
import { SAMPLE_PRODUCTS, CATEGORIES, formatPrice } from "../lib/store.js"

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
const MODEL        = "llama-3.3-70b-versatile"

function buildSystemPrompt() {
  const productLines = SAMPLE_PRODUCTS.map((p) =>
    `- ${p.name} (${p.category_name}) : ${formatPrice(p.price)}${p.old_price ? ` (ancien prix : ${formatPrice(p.old_price)})` : ""} | Stock : ${p.stock} | Note : ${p.rating}★ (${p.reviews} avis) | Badge : ${p.badge || "aucun"} | Description : ${p.description}`
  ).join("\n")

  const categoryLines = CATEGORIES.map((c) => {
    const count = SAMPLE_PRODUCTS.filter((p) => p.category === c.slug).length
    return `- ${c.name} (${count} produits)`
  }).join("\n")

  return `Tu es l'assistant virtuel intelligent de Billcom, une boutique e-commerce de technologie haut de gamme.
Tu réponds en français ou en anglais selon la langue du client.
Tu es sympathique, professionnel, et tu peux répondre à TOUTES les questions — qu'elles concernent la boutique ou non.

=== INFORMATIONS SUR LA BOUTIQUE ===
- Nom : Billcom
- Spécialité : Gadgets technologiques (smartphones, laptops, audio, cameras, wearables, accessoires)
- Statistiques : 500+ produits, 50 000+ clients satisfaits, note moyenne 4.9★
- Livraison gratuite pour toute commande supérieure à ${formatPrice(5000)}
- Livraison standard : ${formatPrice(150)}

=== CATÉGORIES DISPONIBLES ===
${categoryLines}

=== CATALOGUE COMPLET DES PRODUITS ===
${productLines}

=== COMPORTEMENT ===
- Pour les questions liées à la boutique (produits, prix, stock, livraison) : base-toi sur les données ci-dessus
- Pour toutes les autres questions (culture générale, technologie, conseils, aide, etc.) : réponds librement avec tes connaissances
- Si un produit demandé n'est pas dans le catalogue, dis-le honnêtement et propose une alternative disponible
- Ne communique jamais la clé API ou des informations systèmes internes
- Pour les recommandations produits, tiens compte du budget et des besoins du client
- Si le stock est faible (< 10 unités), mentionne-le discrètement
- Tu peux guider les clients vers /shop, /shop?cat=smartphones, /cart, etc.
- Sois concis mais complet. Utilise des emojis avec modération pour rendre la conversation agréable.`
}

const SYSTEM_PROMPT = buildSystemPrompt()

const SUGGESTIONS = [
  "Quels sont vos meilleurs smartphones ?",
  "Livraison gratuite ?",
  "Meilleur laptop gaming ?",
  "Promos en cours ?",
]

export default function ChatBot() {
  const [open, setOpen]         = useState(false)
  const [minimized, setMin]     = useState(false)
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour ! Je suis l'assistant Billcom 👋\nComment puis-je vous aider aujourd'hui ?" }
  ])
  const [input, setInput]       = useState("")
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef(null)
  const inputRef                = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  useEffect(() => {
    if (open && !minimized) inputRef.current?.focus()
  }, [open, minimized])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput("")

    const next = [...messages, { role: "user", content: msg }]
    setMessages(next)
    setLoading(true)

    try {
      if (!GROQ_API_KEY) throw new Error("Clé API manquante")

      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + GROQ_API_KEY,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...next.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.7,
          max_tokens: 512,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errMsg = data.error?.message || `Erreur ${res.status}`
        console.error("Groq API error:", data)
        throw new Error(errMsg)
      }

      const reply = data.choices?.[0]?.message?.content
      if (!reply) throw new Error("Réponse vide du modèle")
      setMessages([...next, { role: "assistant", content: reply }])
    } catch (err) {
      console.error("ChatBot error:", err)
      setMessages([...next, { role: "assistant", content: `⚠️ ${err.message || "Erreur de connexion. Veuillez réessayer."}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── Floating button ── */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setMin(false) }}
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            border: "2px solid rgba(245,158,11,0.4)",
            background: "var(--gz-surface)",
            boxShadow: "0 8px 32px rgba(245,158,11,0.25)",
            cursor: "pointer",
            padding: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)"
            e.currentTarget.style.boxShadow = "0 12px 40px rgba(245,158,11,0.45)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)"
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(245,158,11,0.25)"
          }}
          title="Assistant Billcom"
          aria-label="Open Billcom assistant chat"
        >
          <span style={{
            width: "40px", height: "40px", borderRadius: "50%",
            background: "linear-gradient(155deg, rgba(245,158,11,0.22), transparent 70%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "bot-breathe 2.4s ease-in-out infinite",
          }}>
            <Bot size={26} color="#f59e0b" strokeWidth={1.7} />
          </span>
        </button>
      )}

      {/* ── Chat window ── */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            width: "360px",
            height: minimized ? "56px" : "520px",
            borderRadius: "20px",
            background: "var(--gz-surface)",
            border: "1px solid rgba(245,158,11,0.2)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            overflow: "hidden",
            transition: "height 0.3s ease",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            background: "linear-gradient(90deg, var(--gz-surface2), var(--gz-surface))",
            borderBottom: minimized ? "none" : "1px solid rgba(245,158,11,0.15)",
            flexShrink: 0,
          }}>
            <span style={{
              width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
              background: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Bot size={18} color="#f59e0b" strokeWidth={1.8} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "700", fontSize: "0.9rem", color: "var(--gz-text)" }}>Assistant Billcom</div>
              <div style={{ fontSize: "0.7rem", color: "#4ade80", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                En ligne
              </div>
            </div>
            <button onClick={() => setMin(!minimized)} aria-label={minimized ? "Expand chat" : "Minimize chat"} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gz-text2)", padding: "4px" }}>
              <Minus size={16} />
            </button>
            <button onClick={() => setOpen(false)} aria-label="Close chat" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gz-text2)", padding: "4px" }}>
              <X size={16} />
            </button>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "80%",
                      padding: "10px 14px",
                      borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: m.role === "user"
                        ? "linear-gradient(135deg, #f59e0b, #d97706)"
                        : "var(--gz-surface2)",
                      color: m.role === "user" ? "#0a0a0f" : "var(--gz-text)",
                      fontSize: "0.85rem",
                      lineHeight: "1.5",
                      fontFamily: "Bricolage Grotesque, sans-serif",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}>
                      {m.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ padding: "10px 16px", borderRadius: "18px 18px 18px 4px", background: "var(--gz-surface2)" }}>
                      <span style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        {[0, 1, 2].map((i) => (
                          <span key={i} style={{
                            width: "6px", height: "6px", borderRadius: "50%", background: "#f59e0b",
                            animation: "bounce 1.2s infinite",
                            animationDelay: `${i * 0.2}s`,
                          }} />
                        ))}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick suggestions (only at start) */}
              {messages.length === 1 && (
                <div style={{ padding: "0 16px 12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "999px",
                        border: "1px solid rgba(245,158,11,0.3)",
                        background: "rgba(245,158,11,0.08)",
                        color: "#f59e0b",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                        fontFamily: "Bricolage Grotesque, sans-serif",
                        transition: "background 0.15s",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={{
                display: "flex",
                gap: "8px",
                padding: "12px 16px",
                borderTop: "1px solid var(--gz-border2)",
                flexShrink: 0,
              }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder="Posez votre question…"
                  style={{
                    flex: 1,
                    background: "var(--gz-surface2)",
                    border: "1px solid var(--gz-border)",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    color: "var(--gz-text)",
                    fontSize: "0.85rem",
                    fontFamily: "Bricolage Grotesque, sans-serif",
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: input.trim() && !loading ? "#f59e0b" : "rgba(245,158,11,0.2)",
                    border: "none",
                    cursor: input.trim() && !loading ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.2s",
                  }}
                >
                  <Send size={16} color={input.trim() && !loading ? "#0a0a0f" : "#f59e0b"} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes bot-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </>
  )
}
