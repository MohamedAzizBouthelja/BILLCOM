export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function formatPrice(price) {
  return Number(price || 0).toFixed(2)
}

export function formatCurrency(price) {
  return `${formatPrice(price)} €`
}
