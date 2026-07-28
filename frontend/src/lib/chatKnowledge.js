import { formatPrice } from "./store.js"

// Small local knowledge base — site policies / contact info the chatbot can
// cite. Retrieval is pure keyword matching (see retrieveKnowledge below): no
// embeddings, no vector store, nothing to download or run — "RAG" here just
// means "only inject the chunks relevant to this question" instead of
// pasting everything into every prompt.
export const KNOWLEDGE_BASE = [
  {
    id: "contact",
    keywords: ["contact", "email", "e-mail", "téléphone", "telephone", "phone", "joindre", "support", "assistance", "numéro", "numero", "appeler", "help"],
    content: "Contact : support@gadgetzone.com | Téléphone : +1-800-GADGETS | Support client disponible 24/7.",
  },
  {
    id: "shipping",
    keywords: ["livraison", "delivery", "shipping", "délai", "delai", "expédition", "expedition", "frais de port", "port"],
    content: `Livraison gratuite pour toute commande supérieure à ${formatPrice(5000)}. Livraison standard : ${formatPrice(150)}.`,
  },
  {
    id: "returns",
    keywords: ["retour", "remboursement", "return", "refund", "garantie", "warranty", "échange", "echange"],
    content: "Retours gratuits sous 7 jours. Garantie constructeur de 2 ans sur tous les produits.",
  },
  {
    id: "payment",
    keywords: ["paiement", "payment", "carte", "card", "bkash", "nagad", "cod", "stripe", "payer"],
    content: "Moyens de paiement acceptés : carte bancaire (Stripe), bKash, Nagad, paiement à la livraison (COD).",
  },
  {
    id: "account",
    keywords: ["compte", "account", "inscription", "register", "connexion", "login", "mot de passe", "password", "wishlist", "favoris"],
    content: "Créer un compte : /register. Se connecter : /login. Un compte permet de suivre ses commandes et de gérer sa liste de souhaits (/wishlist).",
  },
  {
    id: "about",
    keywords: ["billcom", "gadgetzone", "boutique", "société", "societe", "à propos", "a propos", "about", "qui êtes-vous", "qui etes vous"],
    content: "Billcom (GadgetZone) est une boutique e-commerce de technologie haut de gamme : smartphones, laptops, audio, caméras, wearables, accessoires, tablettes, gaming.",
  },
]

// Keyword-overlap retrieval — cheap, deterministic, and good enough for a
// small fixed knowledge base. Swap for embeddings only if this ever stops
// being "good enough" (it won't, at this scale).
export function retrieveKnowledge(query, maxChunks = 3) {
  const q = query.toLowerCase()
  const scored = KNOWLEDGE_BASE.map((chunk) => ({
    chunk,
    score: chunk.keywords.reduce((s, kw) => s + (q.includes(kw) ? 1 : 0), 0),
  }))
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .map((s) => s.chunk)
}

// Same idea for products: only pull in the ones actually relevant to the
// question instead of the whole catalog, so the prompt stays small and
// scales as the catalog grows.
export function retrieveProducts(query, products, maxProducts = 6) {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2)
  if (terms.length === 0) return []
  const scored = products.map((p) => {
    const haystack = `${p.name} ${p.category_name} ${p.category} ${p.description}`.toLowerCase()
    const score = terms.reduce((s, t) => s + (haystack.includes(t) ? 1 : 0), 0)
    return { p, score }
  })
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxProducts)
    .map((s) => s.p)
}
