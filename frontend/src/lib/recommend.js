// Content-based recommendation scoring — no LLM involved, pure JS over data already
// loaded client-side (order history + recently viewed ids). Groq is only used
// downstream (see recommendBlurbs.js) to phrase a one-line "why" per product.

import { formatPrice } from "./store.js"

const PURCHASE_WEIGHT = 2
const VIEW_WEIGHT = 1
const PRICE_PROXIMITY_WEIGHT = 0.5
const RATING_WEIGHT = 0.1

function buildProfile(orders, recentlyViewedIds, products) {
  const categoryScore = {}
  const purchasedIds = new Set()
  let priceSum = 0
  let priceCount = 0

  for (const order of orders) {
    for (const item of order.items || []) {
      purchasedIds.add(item.id)
      const qty = item.quantity || 1
      if (item.category) categoryScore[item.category] = (categoryScore[item.category] || 0) + PURCHASE_WEIGHT * qty
      if (item.price) { priceSum += item.price; priceCount += 1 }
    }
  }

  recentlyViewedIds.forEach((id, idx) => {
    const p = products.find((pr) => pr.id === id)
    if (!p) return
    const decay = 1 - idx / (recentlyViewedIds.length + 1)
    categoryScore[p.category] = (categoryScore[p.category] || 0) + VIEW_WEIGHT * decay
    priceSum += p.price
    priceCount += 1
  })

  return {
    categoryScore,
    avgPrice: priceCount > 0 ? priceSum / priceCount : null,
    purchasedIds,
  }
}

function scoreProducts(products, profile) {
  return products
    .filter((p) => !profile.purchasedIds.has(p.id))
    .map((p) => {
      let score = profile.categoryScore[p.category] || 0
      if (profile.avgPrice) {
        const priceDiff = Math.abs(p.price - profile.avgPrice) / profile.avgPrice
        score += Math.max(0, 1 - priceDiff) * PRICE_PROXIMITY_WEIGHT
      }
      score += (p.rating || 0) * RATING_WEIGHT
      return { product: p, score }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
}

// Returns [] when there's no purchase/browsing signal at all — the caller should
// hide the section rather than falling back to a generic list (that's what
// FeaturedProducts is for).
export function getRecommendations(products, orders, recentlyViewedIds, { limit = 8 } = {}) {
  const profile = buildProfile(orders, recentlyViewedIds, products)
  if (Object.keys(profile.categoryScore).length === 0) return []
  return scoreProducts(products, profile).slice(0, limit).map((s) => s.product)
}

export function describeProfile(products, orders, recentlyViewedIds) {
  const profile = buildProfile(orders, recentlyViewedIds, products)
  const topCategories = Object.entries(profile.categoryScore)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat)

  const parts = []
  if (topCategories.length > 0) parts.push(`Intérêts principaux : ${topCategories.join(", ")}.`)
  if (profile.avgPrice) parts.push(`Budget moyen habituel : ~${formatPrice(profile.avgPrice)}.`)
  return parts.join(" ")
}
