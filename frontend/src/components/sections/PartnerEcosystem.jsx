import { motion } from 'framer-motion'

const partners = [
  { name: 'Ericsson', role: 'BSCS Technology Partner', tier: 'strategic' },
  { name: 'Inetum', role: 'System Integration Partner', tier: 'strategic' },
  { name: 'Orange', role: 'Telecom Operator Client', tier: 'client' },
  { name: 'Ooredoo', role: 'Telecom Operator Client', tier: 'client' },
  { name: 'Cap Gemini', role: 'Technology Partner', tier: 'partner' },
]

const tierColors = {
  strategic: 'border-secondary/30 bg-secondary/5 text-secondary',
  client: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  partner: 'border-violet-200 bg-violet-50 text-violet-700',
}

const tierLabels = {
  strategic: 'Strategic Partner',
  client: 'Operator Client',
  partner: 'Technology Partner',
}

export default function PartnerEcosystem() {
  return (
    <section id="partners" className="py-20 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          className="text-center mb-14"
        >
          <div className="text-xs font-semibold text-secondary uppercase tracking-[0.2em] mb-4">Partner Ecosystem</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary mb-3">
            Trusted by technology leaders and operators
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            20 years of partnerships with the world's leading telecom technology vendors and operators.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-5">
          {partners.map((partner, i) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              whileHover={{ y: -4, scale: 1.03 }}
              className="flex flex-col items-center gap-2.5 px-8 py-5 bg-white border border-gray-100 rounded-2xl shadow-card hover:shadow-elevated transition-all duration-300 min-w-[180px]"
            >
              <div className="font-display text-xl font-bold text-primary">{partner.name}</div>
              <div className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${tierColors[partner.tier]}`}>
                {tierLabels[partner.tier]}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-400 max-w-lg mx-auto">
            "Billcom has been a reliable partner for over 20 years, deploying and implementing complex BSCS Billing projects with excellence."
          </p>
          <div className="mt-3 text-xs font-semibold text-gray-500">Jean Paul Rubio — Inetum</div>
        </motion.div>
      </div>
    </section>
  )
}
