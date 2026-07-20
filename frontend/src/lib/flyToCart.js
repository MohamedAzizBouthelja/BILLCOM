export function flyToCart(originEl) {
  const target = document.getElementById("gz-cart-icon")
  if (!originEl || !target) return

  const originRect = originEl.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()

  const ghost = document.createElement("div")
  ghost.className = "gz-fly-dot"
  ghost.style.left = originRect.left + originRect.width / 2 + "px"
  ghost.style.top = originRect.top + originRect.height / 2 + "px"
  ghost.style.transform = "translate(-50%, -50%) scale(1)"
  document.body.appendChild(ghost)

  const dx = (targetRect.left + targetRect.width / 2) - (originRect.left + originRect.width / 2)
  const dy = (targetRect.top + targetRect.height / 2) - (originRect.top + originRect.height / 2)

  requestAnimationFrame(() => {
    ghost.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.25)`
    ghost.style.opacity = "0.15"
  })

  setTimeout(() => {
    ghost.remove()
    target.classList.add("gz-cart-bump")
    setTimeout(() => target.classList.remove("gz-cart-bump"), 350)
  }, 650)
}
