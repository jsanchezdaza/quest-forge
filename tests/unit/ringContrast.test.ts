import assert from 'node:assert/strict'
import { test } from 'node:test'
import { minimumRingContrast, type Rgb } from '../e2e/pixelContrast.ts'

/**
 * Contrast of a link is the worst gold-vs-background pixel in the ring
 * 1–3px outside the glyphs. The dark core under the letter does not count.
 */

const GOLD: Rgb = [240, 210, 122]
const LIGHT: Rgb = [200, 196, 184]
const DARK: Rgb = [12, 12, 12]
const WEAK: Rgb = [140, 137, 129]

function fill(width: number, height: number, color: Rgb): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(width * height * 4)
  for (let index = 0; index < width * height; index += 1) {
    pixels[index * 4] = color[0]
    pixels[index * 4 + 1] = color[1]
    pixels[index * 4 + 2] = color[2]
    pixels[index * 4 + 3] = 255
  }
  return pixels
}

function paint(pixels: Uint8ClampedArray, width: number, x0: number, y0: number, x1: number, y1: number, color: Rgb) {
  const height = pixels.length / 4 / width
  for (let y = Math.max(0, y0); y < Math.min(height, y1); y += 1) {
    for (let x = Math.max(0, x0); x < Math.min(width, x1); x += 1) {
      const offset = (y * width + x) * 4
      pixels[offset] = color[0]
      pixels[offset + 1] = color[1]
      pixels[offset + 2] = color[2]
    }
  }
}

/** Paint `color` on pixels whose distance to the glyph rect is in (0, radius]. */
function paintRing(
  pixels: Uint8ClampedArray,
  width: number,
  glyph: { x0: number; y0: number; x1: number; y1: number },
  radius: number,
  color: Rgb,
) {
  const height = pixels.length / 4 / width
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = x < glyph.x0 ? glyph.x0 - x : x >= glyph.x1 ? x - (glyph.x1 - 1) : 0
      const dy = y < glyph.y0 ? glyph.y0 - y : y >= glyph.y1 ? y - (glyph.y1 - 1) : 0
      const distance = Math.hypot(dx, dy)
      if (distance > 0 && distance <= radius) {
        const offset = (y * width + x) * 4
        pixels[offset] = color[0]
        pixels[offset + 1] = color[1]
        pixels[offset + 2] = color[2]
      }
    }
  }
}

const GLYPH = { x0: 20, y0: 16, x1: 70, y1: 24 }

function scene(width = 100, height = 48) {
  const gold = fill(width, height, LIGHT)
  const clear = fill(width, height, LIGHT)
  paint(gold, width, GLYPH.x0, GLYPH.y0, GLYPH.x1, GLYPH.y1, GOLD)
  return { gold, clear, width, height }
}

test('a ring with no shadow fails 4.5:1', () => {
  const { gold, clear, width, height } = scene()
  const measured = minimumRingContrast({
    real: gold,
    gold,
    clear,
    width,
    height,
    foreground: GOLD,
  })
  assert.ok(measured.samples > 80, `samples ${measured.samples}`)
  assert.ok(measured.ratio < 4.5, `no shadow measured ${measured.ratio.toFixed(2)}:1`)
})

test('a weak 2px shadow fails 4.5:1', () => {
  const { gold, clear, width, height } = scene()
  const real = gold.slice()
  paintRing(real, width, GLYPH, 2, WEAK)
  const measured = minimumRingContrast({
    real,
    gold,
    clear,
    width,
    height,
    foreground: GOLD,
  })
  assert.ok(measured.samples > 80, `samples ${measured.samples}`)
  assert.ok(measured.ratio < 4.5, `weak shadow measured ${measured.ratio.toFixed(2)}:1`)
})

test('black paint under the glyph does not count as the background', () => {
  const { gold, clear, width, height } = scene()
  const real = gold.slice()
  paint(real, width, GLYPH.x0, GLYPH.y0, GLYPH.x1, GLYPH.y1, DARK)
  const measured = minimumRingContrast({
    real,
    gold,
    clear,
    width,
    height,
    foreground: GOLD,
  })
  assert.ok(measured.ratio < 4.5, `glyph core measured ${measured.ratio.toFixed(2)}:1`)
})

test('a shadow that covers the whole 1–3px ring clears 4.5:1', () => {
  const { gold, clear, width, height } = scene()
  const real = gold.slice()
  paintRing(real, width, GLYPH, 3, DARK)
  const measured = minimumRingContrast({
    real,
    gold,
    clear,
    width,
    height,
    foreground: GOLD,
  })
  assert.ok(measured.samples > 80, `samples ${measured.samples}`)
  assert.ok(measured.ratio >= 4.5, `covered ring measured ${measured.ratio.toFixed(2)}:1`)
})

test('the ring is 1–3 CSS pixels, so a 1px device halo on a 2x shot still fails', () => {
  const width = 200
  const height = 96
  const glyph = { x0: 40, y0: 32, x1: 140, y1: 48 }
  const gold = fill(width, height, LIGHT)
  const clear = fill(width, height, LIGHT)
  paint(gold, width, glyph.x0, glyph.y0, glyph.x1, glyph.y1, GOLD)
  const real = gold.slice()
  paintRing(real, width, glyph, 2, DARK)
  const measured = minimumRingContrast({
    real,
    gold,
    clear,
    width,
    height,
    elementWidth: width / 2,
    elementHeight: height / 2,
    foreground: GOLD,
  })
  assert.ok(measured.samples > 80, `samples ${measured.samples}`)
  assert.ok(measured.ratio < 4.5, `device halo measured ${measured.ratio.toFixed(2)}:1`)
})
