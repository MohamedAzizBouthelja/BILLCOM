import { create } from "zustand"
import { persist } from "zustand/middleware"

const USER_SERVICE    = ""
const PRODUCT_SERVICE = ""
const ORDER_SERVICE   = ""

export const SAMPLE_PRODUCTS = [
  { id:1,  category:"smartphones", category_name:"Smartphones", name:"iPhone 15 Pro Max",        slug:"iphone-15-pro-max",        description:"Apple flagship with A17 Pro chip, titanium build, and 48MP camera system.",  price:149999, old_price:164999, image_url:"https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80", badge:"HOT",  stock:45, featured:true,  rating:4.9, reviews:312 },
  { id:2,  category:"smartphones", category_name:"Smartphones", name:"Samsung Galaxy S24 Ultra", slug:"galaxy-s24-ultra",         description:"Snapdragon 8 Gen 3, 200MP camera, built-in S Pen, 12GB RAM.",                price:134999, old_price:149999, image_url:"https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=600&q=80", badge:"NEW",  stock:30, featured:true,  rating:4.8, reviews:198 },
  { id:3,  category:"smartphones", category_name:"Smartphones", name:"Google Pixel 8 Pro",       slug:"google-pixel-8-pro",       description:"Pure Android experience with AI-enhanced Tensor G3 chip and 50MP camera.",   price:89999,  old_price:null,   image_url:"https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80", badge:"",     stock:60, featured:false, rating:4.7, reviews:145 },
  { id:4,  category:"laptops",     category_name:"Laptops",     name:"MacBook Air M3",           slug:"macbook-air-m3",           description:"Fanless design, up to 18hr battery, stunning Liquid Retina display.",         price:139999, old_price:154999, image_url:"https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80", badge:"SALE", stock:20, featured:true,  rating:4.9, reviews:423 },
  { id:5,  category:"laptops",     category_name:"Laptops",     name:"Dell XPS 15",              slug:"dell-xps-15",              description:"OLED touch display, Intel Core i9, 32GB DDR5, RTX 4060 GPU.",               price:189999, old_price:null,   image_url:"https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80", badge:"NEW",  stock:15, featured:true,  rating:4.8, reviews:267 },
  { id:6,  category:"laptops",     category_name:"Laptops",     name:"ASUS ROG Zephyrus G14",    slug:"asus-rog-zephyrus-g14",    description:"AMD Ryzen 9, RTX 4090, 165Hz QHD panel - the ultimate gaming laptop.",      price:179999, old_price:189999, image_url:"https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&q=80", badge:"SALE", stock:10, featured:false, rating:4.9, reviews:189 },
  { id:7,  category:"audio",       category_name:"Audio",       name:"Sony WH-1000XM5",          slug:"sony-wh-1000xm5",          description:"Industry-leading noise cancellation with 30hr battery and multipoint.",        price:34999,  old_price:39999,  image_url:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80", badge:"HOT",  stock:80, featured:true,  rating:4.9, reviews:876 },
  { id:8,  category:"audio",       category_name:"Audio",       name:"Apple AirPods Pro 2",      slug:"airpods-pro-2",            description:"Adaptive Transparency, Personalized Spatial Audio, USB-C charging case.",    price:29999,  old_price:null,   image_url:"https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&q=80", badge:"",     stock:100,featured:false, rating:4.7, reviews:654 },
  { id:9,  category:"audio",       category_name:"Audio",       name:"JBL Charge 5 Speaker",     slug:"jbl-charge-5",             description:"IP67 waterproof portable speaker with 20hr playtime and power bank.",         price:9999,   old_price:12999,  image_url:"https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80", badge:"SALE", stock:50, featured:false, rating:4.6, reviews:321 },
  { id:10, category:"cameras",     category_name:"Cameras",     name:"Sony A7 IV Mirrorless",    slug:"sony-a7-iv",               description:"33MP full-frame sensor, 4K 60fps video, advanced autofocus system.",          price:249999, old_price:null,   image_url:"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80", badge:"NEW",  stock:8,  featured:true,  rating:4.9, reviews:143 },
  { id:11, category:"cameras",     category_name:"Cameras",     name:"Canon EOS R6 Mark II",     slug:"canon-eos-r6-mark-ii",     description:"40fps burst, in-body stabilisation, dual card slots, 4K HQ video.",          price:219999, old_price:234999, image_url:"https://images.unsplash.com/photo-1502920917128-1aa500764bed?w=600&q=80", badge:"",     stock:12, featured:false, rating:4.8, reviews:97  },
  { id:12, category:"wearables",   category_name:"Wearables",   name:"Apple Watch Ultra 2",      slug:"apple-watch-ultra-2",      description:"Titanium case, 60hr battery, dual-frequency GPS, ocean band.",                price:89999,  old_price:null,   image_url:"https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80", badge:"HOT",  stock:35, featured:true,  rating:4.9, reviews:512 },
  { id:13, category:"wearables",   category_name:"Wearables",   name:"Samsung Galaxy Watch 6",   slug:"samsung-galaxy-watch-6",   description:"Advanced health tracking, sapphire glass, BioActive sensor, Wear OS.",       price:29999,  old_price:34999,  image_url:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80", badge:"SALE", stock:55, featured:false, rating:4.7, reviews:234 },
  { id:14, category:"accessories", category_name:"Accessories", name:"Anker 140W GaN Charger",   slug:"anker-140w-gan-charger",   description:"Three ports, PowerIQ 4.0, charges MacBook + iPhone + iPad simultaneously.", price:4999,   old_price:6499,   image_url:"https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=600&q=80", badge:"NEW",  stock:200,featured:false, rating:4.8, reviews:445 },
  { id:15, category:"accessories", category_name:"Accessories", name:"Samsung 45W USB-C Cable",  slug:"samsung-45w-usb-c-cable",  description:"Premium braided 2m cable with 45W fast charging and 10Gbps data.",          price:999,    old_price:null,   image_url:"https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80", badge:"",     stock:500,featured:false, rating:4.5, reviews:189 },
].map((p) => ({
  ...p,
  // No secondary product photography available yet — these are alternate crops of the
  // same source photo (wide shot / tight square / top-focused), not real extra angles.
  images: [
    p.image_url,
    p.image_url.split("?")[0] + "?w=600&h=600&fit=crop&crop=entropy&q=80",
    p.image_url.split("?")[0] + "?w=600&h=600&fit=crop&crop=top&q=80",
  ],
}))

export const CATEGORIES = [
  { slug:"smartphones", name:"Smartphones", image:"/icons/smartphone.gif"   },
  { slug:"laptops",     name:"Laptops",     image:"/icons/laptops.gif"      },
  { slug:"audio",       name:"Audio",       image:"/icons/audio.gif"        },
  { slug:"cameras",     name:"Cameras",     image:"/icons/camera.gif"       },
  { slug:"wearables",   name:"Wearables",   image:"/icons/wearables.png"    },
  { slug:"accessories", name:"Accessories", image:"/icons/accessories.png"  },
]

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: "",
      user: null,
      loading: false,
      error: "",

      login: async (email, password) => {
        set({ loading: true, error: "" })
        try {
          const res = await fetch(USER_SERVICE + "/api/v1/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: email, password }),
          })
          const data = await res.json()
          if (res.ok) {
            set({ token: data.access_token })
            await get().fetchProfile()
            return { ok: true }
          }
          const msg = data.detail || "Invalid email or password"
          set({ error: msg })
          return { ok: false, error: msg }
        } catch {
          set({ error: "Cannot reach server" })
          return { ok: false, error: "Cannot reach server" }
        } finally {
          set({ loading: false })
        }
      },

      register: async (firstName, lastName, email, password) => {
        set({ loading: true, error: "" })
        try {
          const res = await fetch(USER_SERVICE + "/api/v1/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: firstName + " " + lastName, email, password, role: "user" }),
          })
          const data = await res.json()
          if (res.ok) return { ok: true }
          const msg = data.detail || "Registration failed"
          set({ error: msg })
          return { ok: false, error: msg }
        } catch {
          set({ error: "Cannot reach server" })
          return { ok: false, error: "Cannot reach server" }
        } finally {
          set({ loading: false })
        }
      },

      fetchProfile: async () => {
        const { token } = get()
        if (!token) return
        try {
          const res = await fetch(USER_SERVICE + "/api/v1/users/me", {
            headers: { Authorization: "Bearer " + token },
          })
          if (res.ok) set({ user: await res.json() })
          else get().logout()
        } catch {
          // ignore network errors, keep existing session state
        }
      },

      logout: () => set({ token: "", user: null }),
      isLoggedIn: () => !!get().token,
      isAdmin: () => ["admin", "super_admin"].includes(get().user && get().user.role),
    }),
    { name: "gz-auth", partialize: (s) => ({ token: s.token }) }
  )
)

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, qty) => {
        qty = qty || 1
        const items = get().items
        const existing = items.find((i) => i.id === product.id)
        if (existing) {
          set({ items: items.map((i) => i.id === product.id ? Object.assign({}, i, { quantity: Math.min(i.quantity + qty, product.stock || 99) }) : i) })
        } else {
          set({ items: [...items, Object.assign({}, product, { quantity: qty })] })
        }
      },

      updateQty: (id, qty) => {
        if (qty <= 0) { get().removeItem(id); return }
        set({ items: get().items.map((i) => i.id === id ? Object.assign({}, i, { quantity: qty }) : i) })
      },

      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      shipping: () => get().subtotal() >= 5000 ? 0 : 150,
      total: () => get().subtotal() + get().shipping(),
    }),
    { name: "gz-cart" }
  )
)

export const useProductStore = create((set, get) => ({
  products: SAMPLE_PRODUCTS,
  loading: false,

  fetchProducts: async (params = {}) => {
    set({ loading: true })
    try {
      const qs = new URLSearchParams()
      if (params.q)         qs.set("q", params.q)
      if (params.category)  qs.set("category", params.category)
      if (params.min_price) qs.set("min_price", params.min_price)
      if (params.max_price) qs.set("max_price", params.max_price)
      if (params.badge)     qs.set("badge", params.badge)
      if (params.in_stock)  qs.set("in_stock", params.in_stock)
      if (params.featured)  qs.set("featured", params.featured)
      if (params.sort)      qs.set("sort", params.sort)
      if (params.page)      qs.set("page", params.page)
      if (params.per_page)  qs.set("per_page", params.per_page || 100)

      const url = PRODUCT_SERVICE + "/api/v1/products?" + qs.toString()
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        const items = data.items || data
        if (Array.isArray(items) && items.length > 0) set({ products: items })
      }
    } catch {
      // ignore, keep previously loaded products
    } finally {
      set({ loading: false })
    }
  },

  getBySlug: (slug) => get().products.find((p) => p.slug === slug),
  getFeatured: () => get().products.filter((p) => p.featured).slice(0, 6),
  getNewArrivals: () => get().products.slice(-4).reverse(),
  getDeal: () => get().products.find((p) => p.badge === "HOT") || get().products[0],
}))

export const useOrderStore = create((set) => ({
  orders: [],
  loading: false,

  placeOrder: async (orderData) => {
    set({ loading: true })
    try {
      const { token } = useAuthStore.getState()
      const orderNum = "GZ-" + Date.now()
      const headers = { "Content-Type": "application/json" }
      if (token) headers.Authorization = "Bearer " + token

      const res = await fetch(ORDER_SERVICE + "/api/v1/orders", {
        method: "POST",
        headers,
        body: JSON.stringify({
          order_number: orderNum,
          product_id: (orderData.items[0] || {}).id || null,
          quantity: orderData.items.reduce((s, i) => s + i.quantity, 0),
          items: orderData.items,
          total_price: orderData.total,
          payment_method: orderData.payment_method,
          shipping_address: orderData.shipping_address,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return { ok: false, error: data.detail || "Order failed" }
      }

      const data = await res.json()
      return { ok: true, order_number: data.order_number }
    } catch {
      return { ok: false, error: "Cannot reach server" }
    } finally {
      set({ loading: false })
    }
  },

  fetchOrders: async () => {
    const { token } = useAuthStore.getState()
    if (!token) return
    set({ loading: true })
    try {
      const res = await fetch(ORDER_SERVICE + "/api/v1/orders/me", {
        headers: { Authorization: "Bearer " + token },
      })
      if (res.ok) {
        const data = await res.json()
        set({
          orders: data.map((o) => ({
            id: o.id,
            order_number: o.order_number,
            items: o.items_json ? JSON.parse(o.items_json) : [],
            total_amount: o.total_price,
            status: o.status,
            payment_method: o.payment_method,
            shipping_address: o.shipping_address,
            created_at: o.created_at,
          })),
        })
      }
    } catch {
      // ignore, keep previously loaded orders
    } finally {
      set({ loading: false })
    }
  },
}))

export const formatPrice = (price) => String.fromCharCode(2547) + Number(price).toLocaleString()
