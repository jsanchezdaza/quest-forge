import { Coins, Heart, MapPin, Sun } from 'lucide-react'
import { GAME_CONSTANTS } from '../../constants/game'
import { getHealthStatusKey } from '../../utils/status'
import { useTranslation } from '../../i18n'
import type { GameState } from '../../types'

interface StatusBarProps {
  gameState: GameState
}

/**
 * Bottom status bar with cosmetic adventure info. Status is derived from
 * health; location, day/time and gold are placeholders until real tracking
 * exists in game state.
 */
export default function StatusBar({ gameState }: StatusBarProps) {
  const { t } = useTranslation()
  const { health, maxHealth } = gameState

  const cells = [
    { icon: MapPin, label: t('game.location'), value: t('game.locationPlaceholder') },
    { icon: Sun, label: t('game.dayTime'), value: t('game.dayTimePlaceholder') },
    { icon: Coins, label: t('game.gold'), value: String(GAME_CONSTANTS.STARTING_GOLD) },
    { icon: Heart, label: t('game.status'), value: t(getHealthStatusKey(health, maxHealth)) }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 rounded-xl border-2 border-medieval-gold/40 bg-black/70 backdrop-blur-sm p-4 sm:p-5">
      {cells.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-3">
          <Icon className="w-5 h-5 shrink-0 text-medieval-gold" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-gray-400 text-xs uppercase tracking-wider font-pixel-body truncate">
              {label}
            </p>
            <p className="text-gray-100 text-sm font-medieval-narrative truncate">
              {value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
