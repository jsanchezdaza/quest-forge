import { useState } from 'react'
import { User } from 'lucide-react'
import type { CharacterClass } from '../../types'

interface CharacterAvatarProps {
  characterClass: CharacterClass
  characterName: string
  className?: string
}

/**
 * Renders the per-class avatar image from /images/characters/{class}.png.
 * A silhouette fallback sits behind the image and shows through while the
 * class artwork is missing or fails to load.
 */
export default function CharacterAvatar({ characterClass, characterName, className = '' }: CharacterAvatarProps) {
  const [hasError, setHasError] = useState(false)

  return (
    <div
      className={`relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 border-medieval-gold/60 bg-background-darker ${className}`}
    >
      <div className="absolute inset-0 flex items-center justify-center text-medieval-gold/50">
        <User className="w-10 h-10" aria-hidden="true" />
      </div>
      <img
        src={`/images/characters/${characterClass}.png`}
        alt={characterName}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hasError ? 'opacity-0' : 'opacity-100'}`}
        onError={() => setHasError(true)}
      />
    </div>
  )
}
