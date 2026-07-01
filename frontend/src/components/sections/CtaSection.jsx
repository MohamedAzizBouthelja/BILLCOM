import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, PhoneCall } from 'lucide-react'
import Button from '../ui/Button.jsx'

const highlights = [
  '120+ certified BSS consultants',
  'Ericsson BSCS specialization',
  '24/7 on-call support coverage',
  'Proven data migration methodology',
]

export default function CtaSection() {
  const navigate = useNavigate()

  return (
    <section className="relative py-24 md:py-32 bg-primary overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-secondary/12 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-400/8 rounded-full blur-[100px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
          >
            <div className="text-xs font-semibold text-accent uppercase tracking-[0.2em] mb-5">
              Ready to Transform Your Telecom BSS?
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
              Start your BSS transformation with a trusted partner.
            </h2>
            <p className="text-gray-400 text-base leading-relaxed mb-8">
              From CCBS consulting to full system integration and 24/7 support — Billcom Consulting has been the go-to partner for telecom operators since 2007.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                size="lg"
                className="bg-white text-primary hover:bg-gray-50 shadow-premium"
                icon={<ArrowRight size={16} />}
                onClick={() => navigate('/register')}
              >
                Request a Consultation
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10"
                icon={<PhoneCall size={15} />}
                onClick={() => navigate('/catalog')}
              >
                Explore Products
              </Button>
            </div>
          </motion.div>

          {/* Right — highlights */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: 0.15 }}
            className="flex flex-col gap-4"
          >
            {highlights.map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex items-center gap-4 bg-white/6 border border-white/10 rounded-xl px-5 py-4"
              >
                <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
                <span className="text-sm font-medium text-gray-200">{item}</span>
              </motion.div>
            ))}

            <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="text-white/50 text-xs mb-3 uppercase tracking-widest font-semibold">Our partners include</div>
              <div className="flex flex-wrap gap-3">
                {['Ericsson', 'Inetum', 'Orange', 'Ooredoo', 'Cap Gemini'].map((p) => (
                  <span key={p} className="text-sm font-semibold text-white/70 bg-white/8 px-3 py-1.5 rounded-lg border border-white/10">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
