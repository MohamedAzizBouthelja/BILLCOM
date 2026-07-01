import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'

// Approximate SVG coordinates for a simplified world map projection
const locations = [
  { name: 'Tunisia', country: 'TN', desc: 'Headquarters', x: '52%', y: '35%', highlight: true },
  { name: 'New Caledonia', country: 'NC', desc: 'Pacific Operator', x: '86%', y: '70%' },
  { name: 'Botswana', country: 'BW', desc: 'African Operator', x: '56%', y: '65%' },
  { name: 'Mongolia', country: 'MN', desc: 'Asian Operator', x: '74%', y: '25%' },
  { name: 'Djibouti', country: 'DJ', desc: 'East Africa Operator', x: '61%', y: '47%' },
  { name: 'Dubai', country: 'UAE', desc: 'Middle East Operator', x: '64%', y: '40%' },
  { name: 'France', country: 'FR', desc: 'European Partner', x: '48%', y: '27%' },
  { name: 'West Africa', country: 'WA', desc: 'West Africa Operator', x: '45%', y: '50%' },
]

// Simple SVG world outline paths (simplified continents)
const continents = [
  // Europe
  'M 470 90 L 490 85 L 510 88 L 520 95 L 515 110 L 500 115 L 480 110 L 465 100 Z',
  // Africa
  'M 470 130 L 500 125 L 530 130 L 545 150 L 550 185 L 540 215 L 520 230 L 495 228 L 475 215 L 460 190 L 455 160 L 460 140 Z',
  // Asia
  'M 530 80 L 600 70 L 680 75 L 720 85 L 740 100 L 730 120 L 700 130 L 650 128 L 600 125 L 555 115 L 535 100 Z',
  // Middle East
  'M 530 125 L 560 118 L 590 122 L 600 140 L 585 155 L 560 155 L 540 145 Z',
  // North America
  'M 120 80 L 200 70 L 250 90 L 260 120 L 240 150 L 200 160 L 160 155 L 130 140 L 110 110 Z',
  // South America
  'M 220 180 L 260 170 L 285 185 L 290 220 L 275 260 L 250 275 L 225 265 L 210 240 L 205 210 Z',
  // Oceania / New Caledonia area
  'M 820 220 L 860 215 L 875 228 L 865 242 L 840 245 L 820 235 Z',
  // Australia
  'M 770 230 L 830 215 L 850 225 L 845 255 L 820 268 L 790 265 L 770 250 Z',
]

export default function ReferencesSection() {
  return (
    <section id="references" className="py-24 md:py-32 overflow-hidden" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #fff 100%)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          className="text-center mb-14"
        >
          <div className="text-xs font-bold text-[#1a56db] uppercase tracking-[0.22em] mb-4">Project References</div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#060f1e] mb-4">
            Alongside our customers,{' '}
            <span style={{ color: '#1a56db' }}>wherever they are</span>
          </h2>
          <p className="text-gray-500 text-base max-w-2xl mx-auto">
            25+ projects delivered across 4 continents — from North Africa to the Pacific, serving mobile and fixed operators of all sizes.
          </p>
        </motion.div>

        {/* World map SVG */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl overflow-hidden border border-gray-100 shadow-xl mb-12"
          style={{ background: 'linear-gradient(135deg, #060f1e, #0a1628)' }}
        >
          <div className="relative w-full" style={{ paddingBottom: '50%' }}>
            <svg viewBox="0 0 960 480" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
              {/* Ocean background */}
              <rect width="960" height="480" fill="#0a1628" />

              {/* Grid lines */}
              {Array.from({ length: 8 }).map((_, i) => (
                <line key={`h${i}`} x1="0" y1={i * 60} x2="960" y2={i * 60} stroke="rgba(26,86,219,0.08)" strokeWidth="1" />
              ))}
              {Array.from({ length: 16 }).map((_, i) => (
                <line key={`v${i}`} x1={i * 60} y1="0" x2={i * 60} y2="480" stroke="rgba(26,86,219,0.08)" strokeWidth="1" />
              ))}

              {/* Continents */}
              {continents.map((d, i) => (
                <path key={i} d={d} fill="rgba(26,86,219,0.18)" stroke="rgba(26,86,219,0.3)" strokeWidth="1.5" />
              ))}

              {/* Connection lines from Tunisia to each project */}
              {locations.filter(l => !l.highlight).map((loc) => {
                const hq = locations[0]
                return (
                  <motion.line
                    key={loc.name}
                    x1={parseFloat(hq.x) * 9.6}
                    y1={parseFloat(hq.y) * 4.8}
                    x2={parseFloat(loc.x) * 9.6}
                    y2={parseFloat(loc.y) * 4.8}
                    stroke="rgba(0,198,255,0.2)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                  />
                )
              })}

              {/* Location pins */}
              {locations.map((loc, i) => (
                <motion.g
                  key={loc.name}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.12, type: 'spring', stiffness: 200 }}
                  style={{ transformOrigin: `${parseFloat(loc.x) * 9.6}px ${parseFloat(loc.y) * 4.8}px` }}
                >
                  {/* Pulse ring */}
                  <motion.circle
                    cx={parseFloat(loc.x) * 9.6}
                    cy={parseFloat(loc.y) * 4.8}
                    r={loc.highlight ? 16 : 12}
                    fill="none"
                    stroke={loc.highlight ? '#00c6ff' : '#1a56db'}
                    strokeWidth="1"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.3 }}
                  />
                  {/* Dot */}
                  <circle
                    cx={parseFloat(loc.x) * 9.6}
                    cy={parseFloat(loc.y) * 4.8}
                    r={loc.highlight ? 6 : 4}
                    fill={loc.highlight ? '#00c6ff' : '#1a56db'}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  {/* Label */}
                  <text
                    x={parseFloat(loc.x) * 9.6 + 8}
                    y={parseFloat(loc.y) * 4.8 - 6}
                    fill="white"
                    fontSize="9"
                    fontWeight="600"
                    fontFamily="Inter, sans-serif"
                    opacity="0.85"
                  >
                    {loc.name}
                  </text>
                </motion.g>
              ))}
            </svg>
          </div>
        </motion.div>

        {/* Location cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {locations.map((loc, i) => (
            <motion.div
              key={loc.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <MapPin size={16} style={{ color: loc.highlight ? '#00c6ff' : '#1a56db' }} className="shrink-0" />
              <div>
                <div className="text-sm font-bold text-gray-900">{loc.name}</div>
                <div className="text-xs text-gray-400">{loc.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
