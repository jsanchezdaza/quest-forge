import { GAME_CONSTANTS } from '../constants/game.ts'
import type { TranslationKey } from '../i18n'

export function getHealthStatusKey(health: number, maxHealth: number): TranslationKey {
  if (health <= 0) return 'game.statusUnconscious'

  const percentage = (health / maxHealth) * 100

  if (percentage > GAME_CONSTANTS.HEALTH_HEALTHY_THRESHOLD) return 'game.statusHealthy'
  if (percentage > GAME_CONSTANTS.HEALTH_WOUNDED_THRESHOLD) return 'game.statusWounded'
  return 'game.statusBadlyWounded'
}
