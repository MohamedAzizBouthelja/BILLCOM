import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

const points = [
  'Specialized in Customer Care & Billing Systems (CCBS) for telecom operators',
  'Expert team covering the full BSS lifecycle: design, implementation and operations',
  'International deployments across Africa, Middle East, Asia and Pacific',
  'Official partner of Ericsson — certified in BSCS iX and BSS transformation',
]

export default function AboutSection() {
  return (
    <section id="about" className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65 }}
          >
            <div className="text-xs font-bold text-[#1a56db] uppercase tracking-[0.22em] mb-5">About Us</div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#060f1e] leading-tight mb-6">
              Billcom Consulting :{' '}
              <span style={{ color: '#1a56db' }}>Your Partner for Telecom System Integration</span>
            </h2>
            <p className="text-gray-500 text-base leading-relaxed mb-5">
              Since 2007, <strong className="text-gray-700">Billcom Consulting</strong> is a leading system integrator
              specialized in Customer Care &amp; Billing solutions for telecom operators.
              We help mobile and fixed operators design, implement and operate their BSS systems
              with certified engineers and proven methodologies.
            </p>
            <p className="text-gray-500 text-base leading-relaxed mb-8">
              Our deep expertise in <strong className="text-gray-700">CCBS, data migration and 24/7 support</strong> makes us
              a trusted long-term partner for operators across multiple continents.
            </p>

            <ul className="space-y-3.5 mb-10">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: '#1a56db' }} />
                  <span className="text-gray-600 text-sm leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>

            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-7 py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #1a56db, #1e40af)', boxShadow: '0 4px 20px rgba(26,86,219,0.3)' }}
            >
              Our Services
            </motion.button>
          </motion.div>

          {/* Right — visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="relative"
          >
            {/* Main card */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(135deg, #060f1e, #0d1f3c)' }}>
              <div className="p-10">
                <div className="text-[#00c6ff] text-xs font-bold uppercase tracking-widest mb-6">Company Overview</div>

                {/* Timeline */}
                <div className="space-y-6">
                  {[
                    { year: '2007', label: 'Founded in Tunisia', desc: 'Established as a telecom BSS specialist' },
                    { year: '2010', label: 'First International Project', desc: 'Deployed CCBS for a major African operator' },
                    { year: '2015', label: 'Ericsson Partnership', desc: 'Certified BSCS integration partner' },
                    { year: '2024', label: '120+ Consultants', desc: '25+ successful projects across 4 continents' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.year}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <div className="shrink-0 w-14 text-right">
                        <span className="text-sm font-bold" style={{ color: '#00c6ff' }}>{item.year}</span>
                      </div>
                      <div className="w-px self-stretch bg-white/10 mx-1 relative">
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{ background: '#1a56db' }} />
                      </div>
                      <div>
                        <div className="text-white text-sm font-semibold">{item.label}</div>
                        <div className="text-gray-400 text-xs mt-0.5">{item.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-5 border border-gray-100"
            >
              <div className="text-3xl font-black text-[#1a56db]">20<span className="text-lg">+</span></div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mt-1">Years of expertise</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="absolute -top-5 -right-5 bg-white rounded-2xl shadow-xl p-5 border border-gray-100"
            >
              <div className="text-3xl font-black" style={{ color: '#1a56db' }}>4</div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mt-1">Continents</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
