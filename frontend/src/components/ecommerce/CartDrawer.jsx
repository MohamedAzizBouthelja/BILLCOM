import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, Trash2, Minus, Plus, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCartStore, useAuthStore } from '../../lib/store.js'
import { formatCurrency } from '../../lib/utils.js'
import { createOrder } from '../../lib/api.js'
import Button from '../ui/Button.jsx'
import { useState } from 'react'

export default function CartDrawer() {
  const { items, showCart, closeCart, removeItem, updateQuantity, clearCart } = useCartStore()
  const { token } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const total = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)

  const handleCheckout = async () => {
    if (!token) {
      closeCart()
      navigate('/login')
      return
    }
    setLoading(true)
    try {
      for (const item of items) {
        await createOrder(item.id, item.quantity, token)
      }
      clearCart()
      closeCart()
      navigate('/dashboard')
    } catch {
      alert('Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {showCart && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 shadow-premium"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <div className="text-xs font-medium text-secondary uppercase tracking-wider">Shopping Cart</div>
                  <h2 className="text-lg font-semibold text-primary mt-0.5">Your B2B Basket</h2>
                </div>
                <button onClick={closeCart} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                      <ShoppingBag size={28} className="text-gray-300" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Your cart is empty</h3>
                    <p className="text-sm text-gray-500 max-w-[200px]">
                      Explore the catalog and add products to your procurement basket.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex gap-4 p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(item.price)} each</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(Number(item.price) * item.quantity)}
                          </p>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="mt-2 text-xs text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t border-gray-100 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleCheckout}
                    disabled={loading}
                    icon={!token ? <LogIn size={16} /> : null}
                  >
                    {loading ? 'Processing...' : token ? 'Secure Checkout' : 'Login to Checkout'}
                  </Button>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
