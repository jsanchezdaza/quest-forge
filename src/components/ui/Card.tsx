import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'game'
}

export default function Card({ 
  children, 
  className = '', 
  hover = false,
  padding = 'md',
  variant = 'default'
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
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
      {children}
    </div>
  )
}