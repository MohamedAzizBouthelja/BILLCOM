import { motion } from 'framer-motion'
import { LayoutGrid, Database, ShoppingCart, Banknote, Smartphone, Settings2, Gift, HeadphonesIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const categories = [
  { name: 'CCBS Systems', icon: LayoutGrid, color: 'from-blue-500 to-blue-600', desc: 'Customer Care & Billing' },
  { name: 'Data Migration', icon: Database, color: 'from-violet-500 to-violet-600', desc: 'Legacy BSS to Modern BSS' },
  { name: 'Order Care', icon: ShoppingCart, color: 'from-cyan-500 to-cyan-600', desc: 'Service Order Management' },
  { name: 'Cash Management', icon: Banknote, color: 'from-emerald-500 to-emerald-600', desc: 'Billing & Payments' },
  { name: 'MNP Solutions', icon: Smartphone, color: 'from-sky-500 to-sky-600', desc: 'Mobile Number Portability' },
  { name: 'Provisioning', icon: Settings2, color: 'from-amber-500 to-amber-600', desc: 'Service Activation' },
  { name: 'Offer Management', icon: Gift, color: 'from-rose-500 to-rose-600', desc: 'AOM & Bundle Pricing' },
  { name: 'Support Services', icon: HeadphonesIcon, color: 'from-indigo-500 to-indigo-600', desc: '24/7 On-Call Support' },
]

export default function ProductCategories() {
  const navigate = useNavigate()

  return (
    <section id="solutions" className="py-20 md:py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          className="text-center mb-14"
        >
          <div className="text-xs font-semibold text-secondary uppercase tracking-[0.2em] mb-4">Solutions</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary mb-3">
            BSS solution categories for telecom operators
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            From billing system integration to data migration and real-time provisioning — every layer of your telecom stack.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/catalog?category=${encodeURIComponent(cat.name)}`)}
              className="relative group bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-premium p-7 text-center overflow-hidden transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-soft`}>
                <cat.icon size={22} className="text-white" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors mb-1">
                {cat.name}
              </h3>
              <p className="text-[11px] text-gray-400">{cat.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}
