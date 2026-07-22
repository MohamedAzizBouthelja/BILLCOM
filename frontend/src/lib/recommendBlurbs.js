// Same Groq client-side pattern as ChatBot.jsx. This call is purely presentational:
// the recommended products themselves come from recommend.js (deterministic scoring),
// Groq only phrases a one-line "why" per product. Any failure here is silent —
// the recommendation cards render fine without a blurb.

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
const MODEL = "llama-3.3-70b-versatile"

export async function fetchRecommendationBlurbs(products, profileSummary) {
  if (!GROQ_API_KEY || products.length === 0) return {}

  const productLines = products
    .map((p) => `${p.id}|${p.name}|${p.category_name}|${p.price}`)
    .join("\n")

  const prompt = `Tu es un moteur de recommandation e-commerce pour Billcom.
Profil du client : ${profileSummary || "pas d'historique détaillé."}

Produits recommandés (id|nom|catégorie|prix) :
${productLines}

Pour CHAQUE produit, écris une accroche ultra-courte (5 mots maximum, en français, sans ponctuation finale) expliquant pourquoi il est recommandé pour ce client.
Réponds UNIQUEMENT avec un objet JSON de la forme {"<id>": "<accroche>", ...}, sans texte autour, sans balises markdown.`

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 400,
        response_format: { type: "json_object" },
      }),
    })
    if (!res.ok) return {}

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return {}
    return JSON.parse(content)
  } catch (err) {
    console.error("recommendBlurbs error:", err)
    return {}
  }
}
