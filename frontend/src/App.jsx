import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import Layout from './components/layout/Layout.jsx'
import HomePage from './pages/HomePage.jsx'
import { useAuthStore } from './lib/store.js'

// HomePage stays eager (first paint for most visits). Everything else is
// code-split per route so the initial bundle only ships what's needed to
// render the landing page — the rest loads on navigation.
const ShopPage         = lazy(() => import('./pages/ShopPage.jsx'))
const ProductPage      = lazy(() => import('./pages/ProductPage.jsx'))
const CartPage         = lazy(() => import('./pages/CartPage.jsx'))
const WishlistPage     = lazy(() => import('./pages/WishlistPage.jsx'))
const CheckoutPage     = lazy(() => import('./pages/CheckoutPage.jsx'))
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage.jsx'))
const MyAccountPage    = lazy(() => import('./pages/MyAccountPage.jsx'))
const LoginPage        = lazy(() => import('./pages/LoginPage.jsx'))
const RegisterPage     = lazy(() => import('./pages/RegisterPage.jsx'))
const AdminPage        = lazy(() => import('./pages/AdminPage.jsx'))
const DashboardPage    = lazy(() => import('./pages/DashboardPage.jsx'))
const NotFoundPage     = lazy(() => import('./pages/NotFoundPage.jsx'))

function RequireAdmin({ children }) {
  const { isLoggedIn, isAdmin } = useAuthStore()
  if (!isLoggedIn()) return <Navigate to="/login" replace />
  if (!isAdmin())    return <Navigate to="/" replace />
  return children
}

function RouteFallback() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={32} color="#f59e0b" style={{ animation: "spin 1s linear infinite" }} />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/account" element={<MyAccountPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
          <Route path="/dashboard" element={<RequireAdmin><DashboardPage /></RequireAdmin>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
