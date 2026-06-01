import { useMemo } from 'react'

const EMBER_COUNT = 18
const EMBER_COLORS = ['#d4af37', '#b87333'] // medieval-gold, medieval-copper

interface Ember {
  left: number
  size: number
  duration: number
  delay: number
  drift: number
  color: string
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function createEmbers(): Ember[] {
  return Array.from({ length: EMBER_COUNT }, (_, index) => ({
    left: randomBetween(0, 100),
    size: randomBetween(3, 6),
    duration: randomBetween(9, 16),
    delay: -randomBetween(0, 16),
    drift: randomBetween(-30, 30),
    color: EMBER_COLORS[index % EMBER_COLORS.length],
  }))
}

/**
 * Subtle rising golden embers behind the auth form. Pure CSS animation
 * (transform + opacity only) so it stays on the compositor and runs smoothly.
 * Decorative: pointer-events-none and aria-hidden so it never blocks the form.
 */
export default function EmberParticles() {
  const embers = useMemo(createEmbers, [])

  return (
    <div className="ember-layer absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {embers.map((ember, index) => (
        <span
          key={index}
          className="ember pixelated"
          style={{
            left: `${ember.left}%`,
            width: `${ember.size}px`,
            height: `${ember.size}px`,
            backgroundColor: ember.color,
            boxShadow: `0 0 6px ${ember.color}`,
            animationDuration: `${ember.duration}s`,
            animationDelay: `${ember.delay}s`,
            '--ember-drift': `${ember.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
