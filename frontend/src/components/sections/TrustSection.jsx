import { motion } from 'framer-motion'

const stats = [
  { value: '120', suffix: '+', label: 'Expert Consultants' },
  { value: '25', suffix: '+', label: 'Projects Delivered' },
  { value: '20', suffix: '', label: 'Years of Experience' },
  { value: '100', suffix: '%', label: 'Delivery Success Rate' },
]

export default function TrustSection() {
  return (
    <section className="py-16 md:py-20 bg-white border-y border-gray-50">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-14">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="font-display text-5xl sm:text-6xl font-bold text-gradient mb-2 tracking-tight">
                {stat.value}{stat.suffix}
              </div>
              <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
