import { motion } from 'framer-motion'
import { Smartphone, Phone, Radio, Wifi, Building2, Globe2 } from 'lucide-react'

const industries = [
  { name: 'Mobile Operators', icon: Smartphone, color: 'from-blue-500 to-blue-600', desc: 'GSM/4G/5G operators with complex BSS needs.' },
  { name: 'Fixed Line Operators', icon: Phone, color: 'from-violet-500 to-violet-600', desc: 'PSTN and fiber operators with legacy migrations.' },
  { name: 'MVNOs', icon: Radio, color: 'from-emerald-500 to-emerald-600', desc: 'Virtual network operators launching new brands.' },
  { name: 'Internet Service Providers', icon: Wifi, color: 'from-amber-500 to-amber-600', desc: 'ISPs needing converged billing platforms.' },
  { name: 'Enterprise Telecoms', icon: Building2, color: 'from-rose-500 to-rose-600', desc: 'Large enterprises managing private telecom infra.' },
  { name: 'International Operators', icon: Globe2, color: 'from-cyan-500 to-cyan-600', desc: 'Multi-country operators with cross-border BSS.' },
]

export default function IndustriesSection() {
  return (
    <section id="industries" className="py-20 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          className="text-center mb-14"
        >
          <div className="text-xs font-semibold text-secondary uppercase tracking-[0.2em] mb-4">Industries</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary mb-3">
            Alongside our customers, wherever they are
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            We work with mobile, fixed, and virtual operators across multiple countries — adapting our BSS expertise to each context.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {industries.map((industry, i) => (
            <motion.div
              key={industry.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="group bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-premium p-8 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${industry.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-soft`}>
                <industry.icon size={22} className="text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{industry.name}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{industry.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
