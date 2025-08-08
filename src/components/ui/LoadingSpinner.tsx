interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  text?: string
  showAvatar?: boolean
}

import WalkingAvatar from './WalkingAvatar'

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'border-medieval-gold',
  text,
  showAvatar = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3'
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div 
        className={`${sizeClasses[size]} ${color} border-t-transparent rounded-full animate-spin`}
      />
      {text && (
        <div className="flex items-center gap-4">
          {showAvatar && <WalkingAvatar />}
          <p className="text-gray-300 font-pixel-body text-sm uppercase tracking-wide animate-pulse">
            {text}
          </p>
          {showAvatar && <WalkingAvatar />}
        </div>
      )}
    </div>
  )
}