import { GAME_CONSTANTS } from '../constants/game'
import type { TranslationKey } from '../i18n'

/**
 * Derives a cosmetic health status label key from the current/max health.
 * The status bar uses this until real status tracking exists in game state.
 */
export function getHealthStatusKey(health: number, maxHealth: number): TranslationKey {
  if (health <= 0) return 'game.statusUnconscious'

  const percentage = (health / maxHealth) * 100

  if (percentage > GAME_CONSTANTS.HEALTH_HEALTHY_THRESHOLD) return 'game.statusHealthy'
  if (percentage > GAME_CONSTANTS.HEALTH_WOUNDED_THRESHOLD) return 'game.statusWounded'
  return 'game.statusBadlyWounded'
}
