import { motion } from 'framer-motion'
import { Wrench, Database, Headphones, GraduationCap } from 'lucide-react'

const services = [
  {
    icon: Wrench,
    title: 'Consulting & Integration',
    description: 'We bring expertise and proven methodologies to telecom operators to efficiently design, implement and operate their CCBS systems. From architecture design to go-live, our certified consultants cover the full integration lifecycle.',
    color: '#1a56db',
    bg: 'rgba(26,86,219,0.08)',
  },
  {
    icon: Database,
    title: 'Data Migration',
    description: 'We migrate data from legacy BSS systems (Billing/CRM, Charging) to modern platforms such as BSCS iX and EBxx. Our proven migration framework ensures data integrity, zero service interruption and full traceability.',
    color: '#0891b2',
    bg: 'rgba(8,145,178,0.08)',
  },
  {
    icon: Headphones,
    title: 'Support & Maintenance',
    description: 'We provide 7/7, 24h/24 on-call professional support for live BSS systems. Our dedicated support team ensures business continuity with rapid incident response and SLA-backed escalation paths.',
    color: '#059669',
    bg: 'rgba(5,150,105,0.08)',
  },
  {
    icon: GraduationCap,
    title: 'Training & Transfer',
    description: 'We deliver tailored training sessions based on real international project experience. From BSCS administration to custom BSS platform operations, we transfer knowledge to empower your internal teams.',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.08)',
  },
]

export default function ServicesSection() {
  return (
    <section id="services" className="py-24 md:py-32 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          className="text-center mb-16"
        >
          <div className="text-xs font-bold text-[#1a56db] uppercase tracking-[0.22em] mb-4">Services</div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#060f1e] mb-4">
            Secure your IT transformation journey
          </h2>
          <p className="text-gray-500 text-base max-w-2xl mx-auto">
            From system integration consulting to 24/7 support — a single trusted partner for your entire telecom BSS lifecycle.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="group bg-white rounded-2xl border border-gray-100 p-8 transition-all duration-300 cursor-default"
              style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}
            >
              <div className="flex items-start gap-5">
                <div className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ background: s.bg }}>
                  <s.icon size={24} style={{ color: s.color }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#060f1e] mb-3 group-hover:text-[#1a56db] transition-colors duration-200">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.description}</p>
                </div>
              </div>

              {/* Bottom accent line */}
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 + 0.3 }}
                className="mt-6 h-0.5 origin-left rounded-full"
                style={{ background: `linear-gradient(90deg, ${s.color}, transparent)` }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
