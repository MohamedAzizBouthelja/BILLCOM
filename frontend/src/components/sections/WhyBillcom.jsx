import { motion } from 'framer-motion'
import { Award, Users2, Clock, Database, MapPin, Globe2 } from 'lucide-react'

const items = [
  {
    icon: Award,
    title: 'Ericsson BSCS Certified',
    description: 'Deep specialization in Ericsson BSCS billing systems — one of few certified integrators in the region.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Users2,
    title: '120+ Expert Consultants',
    description: 'A multidisciplinary team of BSS engineers, architects, and consultants with international credentials.',
    color: 'from-violet-500 to-violet-600',
  },
  {
    icon: Clock,
    title: '24/7 On-Call Support',
    description: 'Continuous support coverage to protect live billing operations with rapid escalation SLAs.',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: Database,
    title: 'Proven Data Migration',
    description: 'Battle-tested methodology for migrating from legacy BSS/CRM systems with zero data loss.',
    color: 'from-amber-500 to-amber-600',
  },
  {
    icon: MapPin,
    title: 'Tunisia Headquarters',
    description: 'Local expertise with deep knowledge of North African telecom regulations and market dynamics.',
    color: 'from-rose-500 to-rose-600',
  },
  {
    icon: Globe2,
    title: 'International Projects',
    description: '25+ projects with operators across Europe, Africa and the Middle East — Orange, Ooredoo and more.',
    color: 'from-cyan-500 to-cyan-600',
  },
]

export default function WhyBillcom() {
  return (
    <section className="py-20 md:py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          className="text-center mb-14"
        >
          <div className="text-xs font-semibold text-secondary uppercase tracking-[0.2em] mb-4">Why Billcom Consulting</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary mb-3">
            Enterprise confidence with 20 years of BSS expertise
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            We don't just integrate systems — we become a long-term partner in your telecom transformation journey.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="group bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-elevated p-8 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-soft`}>
                <item.icon size={22} className="text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
