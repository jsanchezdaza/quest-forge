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

  const cardClass = variant === 'game' ? 'card-game' : 'card'
  
  return (
    <div className={`${cardClass} ${paddingClasses[padding]} ${hoverClasses} ${className}`}>
      {children}
    </div>
  )
}