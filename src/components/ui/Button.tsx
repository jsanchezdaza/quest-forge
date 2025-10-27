import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: ReactNode
}

export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  isLoading = false,
  className = '',
  children, 
  ...props 
}: ButtonProps) {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
  
  const variantClasses = {
    primary: 'bg-medieval-gold hover:bg-medieval-darkgold text-medieval-inkblack font-pixel-body font-medium uppercase tracking-wide shadow-lg hover:shadow-medieval-gold/25',
    secondary: 'bg-background-card hover:bg-background-modal text-gray-100 border border-medieval-gold/30 hover:border-medieval-gold font-pixel-body font-medium uppercase tracking-wide',
    danger: 'bg-red-600 hover:bg-red-700 text-white border border-red-600 hover:border-red-700 font-pixel-body font-medium uppercase tracking-wide'
  }
  
  const sizeClasses = {
    sm: 'px-4 py-2.5 text-sm min-h-[44px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[52px]'
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
}