import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

function useCountUp(target, duration = 2200) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const end = parseInt(target)
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return [ref, count]
}

const figures = [
  { value: '120', label: 'Consultants', desc: 'Certified BSS engineers and architects' },
  { value: '25', label: 'Projects', desc: 'Successful deployments for global operators' },
  { value: '20', label: 'Years', desc: 'Of telecom system integration expertise' },
]

function Figure({ value, label, desc, delay }) {
  const [ref, count] = useCountUp(value)
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay }}
      className="text-center group"
    >
      <div className="relative inline-block mb-4">
        <div className="font-display text-7xl sm:text-8xl font-black text-white leading-none">
          {count}
          <span style={{ color: '#00c6ff' }}>+</span>
        </div>
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: delay + 0.3 }}
          className="absolute -bottom-2 left-0 right-0 h-0.5 origin-left"
          style={{ background: 'linear-gradient(90deg, #1a56db, #00c6ff)' }}
        />
      </div>
      <div className="text-lg font-bold text-white uppercase tracking-widest mt-5 mb-2">{label}</div>
      <div className="text-gray-400 text-sm">{desc}</div>
    </motion.div>
  )
}

export default function KeyFigures() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #060f1e 0%, #0a1628 50%, #060f1e 100%)' }}>
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(rgba(26,86,219,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(26,86,219,.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Glow spots */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] opacity-20" style={{ background: '#1a56db' }} />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] opacity-15" style={{ background: '#00c6ff' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          className="text-center mb-16"
        >
          <div className="text-xs font-bold uppercase tracking-[0.22em] mb-4" style={{ color: '#00c6ff' }}>Key Figures</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
            20 years of results that speak for themselves
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6">
          {figures.map((f, i) => (
            <Figure key={f.label} {...f} delay={i * 0.15} />
          ))}
        </div>

        {/* Bottom divider line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-20 h-px origin-center"
          style={{ background: 'linear-gradient(90deg, transparent, #1a56db, #00c6ff, #1a56db, transparent)' }}
        />
      </div>
    </section>
  )
}
