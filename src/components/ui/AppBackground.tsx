import AuthVideoBackground from './AuthVideoBackground'
import EmberParticles from './EmberParticles'

interface AppBackgroundProps {
  children: React.ReactNode
  variant?: 'auth' | 'game'
  className?: string
  compactOnShortDesktop?: boolean
}

export default function AppBackground({ 
  children, 
  variant = 'auth',
  className = '',
  compactOnShortDesktop = false,
}: AppBackgroundProps) {
  const baseClasses = variant === 'auth' ? 'relative app-background overflow-hidden' : 'min-h-screen app-background'
  const variantClasses = {
    auth: 'flex items-center justify-center p-4 [@media(max-height:450px)]:items-start [@media(max-height:450px)]:pt-2',
    game: 'game-background'
  }
  
  return (
    <div className={[
      baseClasses,
      variantClasses[variant],
      compactOnShortDesktop ? '[@media(pointer:fine)_and_(min-width:1024px)_and_(max-height:800px)]:py-2' : '',
      className,
    ].filter(Boolean).join(' ')}>
      {variant === 'auth' && (
        <>
          <AuthVideoBackground />
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-medieval-gold rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-medieval-copper rounded-full blur-2xl" />
          </div>
          <EmberParticles />
        </>
      )}

      <div className={variant === 'auth' ? 'z-10 w-full' : ''}>
        {children}
      </div>
    </div>
  )
}