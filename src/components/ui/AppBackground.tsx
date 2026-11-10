import AuthVideoBackground from './AuthVideoBackground'
import EmberParticles from './EmberParticles'

interface AppBackgroundProps {
  children: React.ReactNode
  variant?: 'auth' | 'game'
  className?: string
  /**
   * Sign-up only. With a fine pointer, at 1024px wide and at most 800px
   * tall, vertical padding is 8px. Horizontal padding stays 16px.
   */
  compactOnShortDesktop?: boolean
}

export default function AppBackground({ 
  children, 
  variant = 'auth',
  className = '',
  compactOnShortDesktop = false,
}: AppBackgroundProps) {
  // The auth page is a min-h-screen column and gives this panel flex-1, leaving
  // the footer on screen. `relative` anchors the video to the panel. The content
  // slot is `w-full` so the card's max width is the cap, and the outer padding
  // sits outside that width.
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

      {/* z-10 without position, so an absolute language control anchors to this panel. */}
      <div className={variant === 'auth' ? 'z-10 w-full' : ''}>
        {children}
      </div>
    </div>
  )
}