import assert from 'node:assert/strict'
import { test } from 'node:test'
import { GAME_CONSTANTS } from '../../src/constants/game.ts'
import { getHealthStatusKey } from '../../src/utils/status.ts'

test('health status is the percent of max health at the status-bar thresholds', () => {
  const { HEALTH_HEALTHY_THRESHOLD, HEALTH_WOUNDED_THRESHOLD } = GAME_CONSTANTS
  assert.equal(getHealthStatusKey(0, 100), 'game.statusUnconscious')
  assert.equal(getHealthStatusKey(HEALTH_WOUNDED_THRESHOLD, 100), 'game.statusBadlyWounded')
  assert.equal(getHealthStatusKey(HEALTH_WOUNDED_THRESHOLD + 1, 100), 'game.statusWounded')
  assert.equal(getHealthStatusKey(HEALTH_HEALTHY_THRESHOLD, 100), 'game.statusWounded')
  assert.equal(getHealthStatusKey(HEALTH_HEALTHY_THRESHOLD + 1, 100), 'game.statusHealthy')
})
