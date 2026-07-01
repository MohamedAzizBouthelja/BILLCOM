import { cn } from '../../lib/utils.js'

export default function Input({ className, icon, ...props }) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input
        className={cn(
          'w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-text',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary',
          'transition-all duration-200',
          icon && 'pl-10',
          className
        )}
        {...props}
      />
    </div>
  )
}
