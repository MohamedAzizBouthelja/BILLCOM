import { motion } from 'framer-motion'
import { cn } from '../../lib/utils.js'

export default function Card({ children, className, hover = true, ...props }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.04)' } : {}}
      transition={{ duration: 0.2 }}
      className={cn(
        'bg-white rounded-[16px] border border-gray-100 shadow-card',
        'transition-shadow duration-200',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
