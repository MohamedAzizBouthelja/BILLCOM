import { useRef, useEffect } from 'react'
import { useScroll, useTransform, motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '../lib/store'
import useFrameLoader from '../hooks/useFrameLoader'
import { usePerformance } from '../hooks/usePerformance'

const PRODUCTS = {
  iphone: {
    id: 1,
    name: 'iPhone 15 Pro Max',
    price: 149999,
    oldPrice: 164999,
    badge: 'HOT',
    background: '#0a0a0a',
    category: 'Smartphones',
    stock: 45,
    totalFrames: 101,
    ext: 'png',
  },
  airpods: {
    id: 2,
    name: 'AirPods Pro 2',
    price: 34999,
    oldPrice: 39999,
    badge: 'NEW',
    background: '#e8e8e8',
    category: 'Audio',
    stock: 100,
    totalFrames: 101,
    ext: 'jpg',
  },
}

function ScrollOverlay({ scrollYProgress, fadeIn, fadeOut, children, className }) {
  const opacity = useTransform(scrollYProgress, [fadeIn[0], fadeIn[1], fadeOut[0], fadeOut[1]], [0, 1, 1, 0])
  const y       = useTransform(scrollYProgress, [fadeIn[0], fadeIn[1], fadeOut[0], fadeOut[1]], [20, 0, 0, -20])
  return (
    <motion.div style={{ opacity, y }} className={`absolute pointer-events-none ${className}`}>
      {children}
    </motion.div>
  )
}

export default function ScrollProductCanvas() {
  const { shouldReduceMotion } = usePerformance()
  const containerRef = useRef(null)
  const canvasRef    = useRef(null)
  const { addItem }  = useCartStore()

  const iphone  = useFrameLoader('iphone',  PRODUCTS.iphone.totalFrames,  PRODUCTS.iphone.ext)
  const airpods = useFrameLoader('airpods', PRODUCTS.airpods.totalFrames, PRODUCTS.airpods.ext)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Smooth background color: dark for iPhone half, light for AirPods half
  const bgColor = useTransform(
    scrollYProgress,
    [0, 0.44, 0.56, 1],
    ['#0a0a0a', '#0a0a0a', '#e8e8e8', '#e8e8e8']
  )

  // Draw the correct product frame based on scroll position
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const draw = (v) => {
      let frames, localV
      if (v <= 0.5) {
        frames = iphone.frames
        localV = v / 0.5
      } else {
        frames = airpods.frames
        localV = (v - 0.5) / 0.5
      }

      if (!frames || frames.length === 0) return
      const idx = Math.min(Math.floor(localV * (frames.length - 1)), frames.length - 1)
      const img = frames[idx]
      if (!img || !img.complete || img.naturalWidth === 0) return

      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight

      const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight)
      const w = img.naturalWidth  * scale
      const h = img.naturalHeight * scale
      const x = (canvas.width  - w) / 2
      const y = (canvas.height - h) / 2

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, x, y, w, h)
    }

    draw(scrollYProgress.get())
    const unsub = scrollYProgress.on('change', draw)
    return unsub
  }, [iphone.frames, airpods.frames, scrollYProgress])

  // Show loader until at least iPhone frames are ready
  const ready    = iphone.ready
  const progress = Math.round((iphone.progress + airpods.progress) / 2)

  if (shouldReduceMotion) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#f59e0b', fontSize: '1rem' }}>
      Animations désactivées pour économiser les ressources sur cet appareil.
    </div>
  )

  return (
    <section ref={containerRef} className="relative h-[700vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* Background transitions from dark → light as you scroll past iPhone into AirPods */}
        <motion.div className="absolute inset-0" style={{ backgroundColor: bgColor }} />

        {/* Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Loading overlay */}
        <AnimatePresence>
          {!ready && (
            <motion.div
              key="loading"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50"
            >
              <p className="text-white/60 text-sm mb-4">Loading experience...</p>
              <div className="w-48 h-1 bg-white/10 rounded overflow-hidden">
                <div
                  className="h-full bg-gz-accent rounded transition-all duration-200"
                  style={{ width: progress + '%' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── iPhone overlays  (scroll 0 → 0.5) ───────────────────────────── */}
        {iphone.ready && (
          <>
            <ScrollOverlay
              scrollYProgress={scrollYProgress}
              fadeIn={[0.12, 0.17]} fadeOut={[0.21, 0.25]}
              className="left-12 bottom-1/3"
            >
              <h2 className="text-white text-4xl font-bold tracking-tight">Precision. Redefined.</h2>
              <p className="text-white/60 text-lg mt-2">Every component engineered to perfection.</p>
            </ScrollOverlay>

            <ScrollOverlay
              scrollYProgress={scrollYProgress}
              fadeIn={[0.27, 0.32]} fadeOut={[0.37, 0.41]}
              className="right-12 bottom-1/3 text-right"
            >
              <h2 className="text-white text-4xl font-bold tracking-tight">Look inside.</h2>
              <p className="text-white/60 text-lg mt-2">The technology that powers tomorrow.</p>
            </ScrollOverlay>

            <ScrollOverlay
              scrollYProgress={scrollYProgress}
              fadeIn={[0.42, 0.46]} fadeOut={[0.48, 0.50]}
              className="inset-x-0 bottom-1/4 flex flex-col items-center text-center pointer-events-auto"
            >
              <h2 className="text-gz-accent text-5xl font-bold tracking-tight">iPhone 15 Pro Max</h2>
              <p className="text-white/60 text-lg mt-2">Free delivery. 2-year warranty. In stock today.</p>
              <button
                onClick={() => addItem(PRODUCTS.iphone)}
                className="bg-gz-accent text-black font-bold px-8 py-3 rounded-full mt-6 hover:bg-amber-400 transition-colors"
              >
                Add to Cart
              </button>
            </ScrollOverlay>
          </>
        )}

        {/* ── AirPods overlays  (scroll 0.5 → 1.0) ────────────────────────── */}
        {airpods.ready && (
          <>
            <ScrollOverlay
              scrollYProgress={scrollYProgress}
              fadeIn={[0.57, 0.62]} fadeOut={[0.70, 0.74]}
              className="left-12 bottom-1/3"
            >
              <h2 className="text-gray-800 text-4xl font-bold tracking-tight">Sound. Reimagined.</h2>
              <p className="text-gray-500 text-lg mt-2">Crystal-clear audio, zero distractions.</p>
            </ScrollOverlay>

            <ScrollOverlay
              scrollYProgress={scrollYProgress}
              fadeIn={[0.76, 0.81]} fadeOut={[0.87, 0.91]}
              className="right-12 bottom-1/3 text-right"
            >
              <h2 className="text-gray-800 text-4xl font-bold tracking-tight">Immersive ANC.</h2>
              <p className="text-gray-500 text-lg mt-2">Silence the world. Hear what matters.</p>
            </ScrollOverlay>

            <ScrollOverlay
              scrollYProgress={scrollYProgress}
              fadeIn={[0.92, 0.95]} fadeOut={[0.97, 0.99]}
              className="inset-x-0 bottom-1/4 flex flex-col items-center text-center pointer-events-auto"
            >
              <h2 className="text-gz-accent text-5xl font-bold tracking-tight">AirPods Pro 2</h2>
              <p className="text-gray-600 text-lg mt-2">Free delivery. 2-year warranty. In stock today.</p>
              <button
                onClick={() => addItem(PRODUCTS.airpods)}
                className="bg-gz-accent text-black font-bold px-8 py-3 rounded-full mt-6 hover:bg-amber-400 transition-colors"
              >
                Add to Cart
              </button>
            </ScrollOverlay>
          </>
        )}
      </div>
    </section>
  )
}
