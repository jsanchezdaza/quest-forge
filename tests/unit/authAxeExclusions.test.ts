import assert from 'node:assert/strict'
import { test } from 'node:test'
import { authAxeExclusions, unexpectedViolations } from '../e2e/authAxeExclusions.ts'

const welcome =
  '<p class="font-pixel-body text-xs sm:text-sm text-gray-400 uppercase tracking-wide">WELCOME BACK, ADVENTURER</p>'
const author =
  '<p class="text-gray-500 font-pixel-body text-xs uppercase tracking-wide">Author: <a href="https://www.javisan.dev">www.javisan.dev</a></p>'
const copyright =
  '<p class="text-gray-400 font-pixel-body text-xs uppercase tracking-wide">© 2025 Quest Forge. All rights reserved.</p>'
const label =
  '<label for="email" class="block text-xs font-pixel-body text-gray-300 mb-2 uppercase tracking-wide">EMAIL</label>'

test('points every exclusion at the story that will fix it', () => {
  assert.deepEqual(
    authAxeExclusions.map((entry) => entry.issue),
    [30, 30]
  )
})

test('allows the known mobile contrast failures on the welcome line and the footer author line', () => {
  const unexpected = unexpectedViolations([
    {
      id: 'color-contrast',
      help: 'Elements must meet minimum color contrast ratio thresholds',
      nodes: [
        { html: welcome, target: ['.sm\\:text-sm'] },
        { html: author, target: ['.text-gray-500'] },
      ],
    },
  ])

  assert.deepEqual(unexpected, [])
})

test('still reports contrast failures on neighbouring text', () => {
  const unexpected = unexpectedViolations([
    {
      id: 'color-contrast',
      help: 'Elements must meet minimum color contrast ratio thresholds',
      nodes: [
        { html: copyright, target: ['p'] },
        { html: label, target: ['label'] },
      ],
    },
  ])

  assert.deepEqual(unexpected.map((node) => node.html), [copyright, label])
})

test('does not let a contrast exclusion hide an ARIA failure on the same element', () => {
  const unexpected = unexpectedViolations([
    {
      id: 'button-name',
      help: 'Buttons must have discernible text',
      nodes: [{ html: author, target: ['p'] }],
    },
  ])

  assert.equal(unexpected.length, 1)
  assert.equal(unexpected[0].ruleId, 'button-name')
})
