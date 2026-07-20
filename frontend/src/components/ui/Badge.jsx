import { cn } from '../../lib/utils.js'

const variants = {
  default: 'bg-white/10 text-[var(--gz-text2)]',
  success: 'bg-[rgba(34,197,94,0.15)] text-[#4ade80]',
  warning: 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b]',
  danger: 'bg-[rgba(239,68,68,0.15)] text-[#f87171]',
  accent: 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b]',
  secondary: 'bg-[rgba(56,189,248,0.15)] text-[#38bdf8]',
}

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
