import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export default function Card({ 
  children, 
  className = '', 
  hover = false,
  padding = 'md'
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

  return (
    <div className={`card ${paddingClasses[padding]} ${hoverClasses} ${className}`}>
      {children}
    </div>
  )
}