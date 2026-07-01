import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Layers3, Loader2, ShoppingBag, User } from 'lucide-react'
import { useAuthStore } from '../lib/store.js'
import { fetchOrders } from '../lib/api.js'
import Badge from '../components/ui/Badge.jsx'
import { formatCurrency } from '../lib/utils.js'

export default function DashboardPage() {
  const { token, user } = useAuthStore()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchOrders(token)
        setOrders(data)
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [token])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="pt-24 pb-16 min-h-screen"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs font-semibold text-secondary uppercase tracking-widest mb-1">Dashboard</div>
            <h1 className="font-display text-3xl font-bold text-primary">My Orders</h1>
          </div>
          {user && (
            <div className="flex items-center gap-2 px-3 py-2 bg-surface rounded-xl">
              <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                <User size={14} className="text-secondary" />
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">{user.username}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Layers3 size={28} className="text-gray-300" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No orders yet</h3>
            <p className="text-sm text-gray-500">Once you checkout, order history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-card"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                    <ShoppingBag size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Order #{order.id}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Product #{order.product_id} · Qty: {order.quantity}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-primary">{formatCurrency(order.total_price)}</div>
                  <Badge variant="success" className="mt-1">Completed</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
