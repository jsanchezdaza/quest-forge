interface AppBackgroundProps {
  children: React.ReactNode
  variant?: 'auth' | 'game'
  className?: string
}

export default function AppBackground({ 
  children, 
  variant = 'auth',
  className = ''
}: AppBackgroundProps) {
  const baseClasses = 'min-h-screen app-background'
  const variantClasses = {
    auth: 'flex items-center justify-center p-4',
    game: ''
  }
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {variant === 'auth' && (
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-medieval-gold rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-medieval-copper rounded-full blur-2xl" />
        </div>
      )}
      
      <div className={variant === 'auth' ? 'relative z-10' : ''}>
        {children}
      </div>
    </div>
  )
}