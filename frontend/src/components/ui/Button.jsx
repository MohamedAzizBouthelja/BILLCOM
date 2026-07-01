import { motion } from 'framer-motion'
import { cn } from '../../lib/utils.js'

const variants = {
  primary: 'bg-secondary text-white hover:bg-secondary/90 shadow-soft hover:shadow-elevated',
  secondary: 'bg-primary text-white hover:bg-primary/90 shadow-soft hover:shadow-elevated',
  ghost: 'bg-transparent text-text hover:bg-surface border border-transparent hover:border-gray-200',
  outline: 'bg-transparent border border-secondary text-secondary hover:bg-secondary hover:text-white',
  danger: 'bg-red-500 text-white hover:bg-red-600',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  icon,
  ...props
}) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-secondary/40',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </motion.button>
  )
}
