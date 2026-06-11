import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'game'
  ornate?: boolean
}

// Decorative gold L-shaped brackets, one per corner.
const cornerBaseClasses = 'pointer-events-none absolute w-4 h-4 border-medieval-gold/70'
const cornerClasses = [
  'top-1.5 left-1.5 border-t-2 border-l-2 rounded-tl',
  'top-1.5 right-1.5 border-t-2 border-r-2 rounded-tr',
  'bottom-1.5 left-1.5 border-b-2 border-l-2 rounded-bl',
  'bottom-1.5 right-1.5 border-b-2 border-r-2 rounded-br'
]

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'md',
  variant = 'default',
  ornate = false
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }

  const hoverClasses = hover 
    ? 'hover:shadow-xl hover:shadow-medieval-gold/10 hover:border-medieval-gold/40 transition-all duration-300 cursor-pointer' 
    : ''

  const variantClasses = {
    default: 'relative border-2 border-medieval-gold/40 rounded-xl bg-white/10 backdrop-blur-sm shadow-2xl shadow-black/50',
    game: 'relative border-2 border-medieval-gold/60 rounded-xl bg-black/70 backdrop-blur-sm shadow-2xl shadow-black/60'
  }
  
  return (
    <div className={`${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`}>
      {ornate && cornerClasses.map((corner) => (
        <span key={corner} className={`${cornerBaseClasses} ${corner}`} aria-hidden="true" />
      ))}
      {children}
    </div>
  )
}