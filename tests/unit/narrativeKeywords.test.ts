import assert from 'node:assert/strict'
import { test } from 'node:test'
import { en } from '../../src/i18n/en.ts'
import { es } from '../../src/i18n/es.ts'

const openings = [
  ['narrative.keyword.forest', 'narrative.initialChoice.1'],
  ['narrative.keyword.tavern', 'narrative.initialChoice.2'],
  ['narrative.keyword.market', 'narrative.initialChoice.3'],
] as const

test('each static-scene keyword appears in that opening choice, in English and Spanish', () => {
  for (const dictionary of [en, es]) {
    for (const [keywordKey, choiceKey] of openings) {
      const keyword = dictionary[keywordKey].toLowerCase()
      assert.equal(dictionary[choiceKey].toLowerCase().includes(keyword), true)
    }
  }
})
