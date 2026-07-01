const USER_SERVICE_URL = ''
const PRODUCT_SERVICE_URL = ''
const ORDER_SERVICE_URL = ''

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchOrders(token) {
  const res = await fetch(`${ORDER_SERVICE_URL}/api/v1/orders`, {
    headers: { ...authHeaders(token) }
  })
  if (!res.ok) throw new Error('Failed to fetch orders')
  return res.json()
}

export async function fetchUserOrders(userId, token) {
  const res = await fetch(`${ORDER_SERVICE_URL}/api/v1/orders/${userId}`, {
    headers: { ...authHeaders(token) }
  })
  if (!res.ok) throw new Error('Failed to fetch user orders')
  return res.json()
}

export async function createOrder(productId, quantity, token) {
  const res = await fetch(`${ORDER_SERVICE_URL}/api/v1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token)
    },
    body: JSON.stringify({ product_id: productId, quantity })
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.detail || 'Order failed')
  }
  return res.json()
}

export async function fetchUsers(token) {
  const res = await fetch(`${USER_SERVICE_URL}/api/v1/users`, {
    headers: { ...authHeaders(token) }
  })
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export async function createProduct(product, token) {
  const res = await fetch(`${PRODUCT_SERVICE_URL}/api/v1/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token)
    },
    body: JSON.stringify(product)
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.detail || 'Failed to create product')
  }
  return res.json()
}
