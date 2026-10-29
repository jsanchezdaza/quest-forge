import assert from 'node:assert/strict'
import { test } from 'node:test'
import tailwindConfig from '../../tailwind.config.js'

const colors = tailwindConfig.theme.extend.colors
const ring = colors.medieval.gold

/**
 * WCAG relative luminance and contrast ratio.
 * The focus ring is non-text, so the floor is 3:1 (WCAG 1.4.11), not the 4.5:1
 * text rule axe already runs on /auth.
 */
function channel(value: number): number {
  const srgb = value / 255
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
}

function rgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function luminance(hex: string): number {
  const [red, green, blue] = rgb(hex)
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
}

function contrast(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background))
  const darker = Math.min(luminance(foreground), luminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

function blend(hex: string, over: string, alpha: number): string {
  const fg = rgb(hex)
  const bg = rgb(over)
  const mixed = fg.map((component, index) => Math.round(component * alpha + bg[index] * (1 - alpha)))
  return `#${mixed.map((component) => component.toString(16).padStart(2, '0')).join('')}`
}

test('medieval gold is the opaque focus-ring color', () => {
  assert.equal(ring, '#d4af37')
})

test('the golden focus ring contrasts at least 3:1 with auth surfaces', () => {
  // The ring is drawn outside the control, so a gold button is measured against
  // the surface behind it (the card), not against its own fill.
  const surfaces: Record<string, string> = {
    'input and language selector': colors.background.darker,
    'page background': colors.background.dark,
    'footer and card base': colors.background.card,
    'auth card (white at 20% over the page)': blend('#ffffff', colors.background.dark, 0.2),
    'footer (card at 30% over the page)': blend(colors.background.card, colors.background.dark, 0.3),
  }

  for (const [name, surface] of Object.entries(surfaces)) {
    const ratio = contrast(ring, surface)
    assert.ok(ratio >= 3, `${name}: ${ratio.toFixed(2)}:1 for ${ring} on ${surface}`)
  }
})

test('a 20% gold tint misses 3:1 on the input background', () => {
  const tint = blend(ring, colors.background.darker, 0.2)
  const ratio = contrast(tint, colors.background.darker)
  assert.ok(ratio < 3, `expected the translucent ring to fail, got ${ratio.toFixed(2)}:1`)
})
