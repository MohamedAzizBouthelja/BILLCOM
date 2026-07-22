import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import ChatBot from '../ChatBot.jsx'
import CustomCursor from '../CustomCursor.jsx'
import ScrollProgress from '../ScrollProgress.jsx'
import CartToast from '../CartToast.jsx'
import QuickViewModal from '../QuickViewModal.jsx'
import CartDrawer from '../ecommerce/CartDrawer.jsx'
import CommandPalette from '../CommandPalette.jsx'
import { useProductStore } from '../../lib/store.js'

const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeIn" } },
}

export default function Layout() {
  const { fetchProducts } = useProductStore()
  const location = useLocation()

  useEffect(() => {
    fetchProducts()
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--gz-bg)', color: 'var(--gz-text)', transition: 'background 0.3s ease, color 0.3s ease' }}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <ScrollProgress />
      <Header />
      <main id="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <ChatBot />
      <CustomCursor />
      <CartToast />
      <QuickViewModal />
      <CartDrawer />
      <CommandPalette />
    </div>
  )
}
