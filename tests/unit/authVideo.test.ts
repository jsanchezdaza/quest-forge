import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

test('the desktop auth video plays between half speed and seven tenths', () => {
  const source = readFileSync(
    new URL('../../src/components/ui/AuthVideoBackground.tsx', import.meta.url),
    'utf8',
  )
  const match = source.match(/export const AUTH_VIDEO_PLAYBACK_RATE = ([0-9.]+)/)
  assert.ok(match)
  const rate = Number(match[1])
  assert.equal(rate, 0.6)
  assert.ok(rate >= 0.5)
  assert.ok(rate <= 0.7)
})
