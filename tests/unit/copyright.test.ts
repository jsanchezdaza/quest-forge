import assert from 'node:assert/strict'
import { test } from 'node:test'
import { en } from '../../src/i18n/en.ts'
import { es } from '../../src/i18n/es.ts'

const year = new Date().getFullYear()

test('copyright strings insert the current year in English and Spanish', () => {
  for (const template of [en['footer.copyright'], es['footer.copyright']]) {
    assert.match(template, /\{year\}/)
    assert.doesNotMatch(template, /\d{4}/)
    assert.match(template.replaceAll('{year}', String(year)), new RegExp(`© ${year}\\b`))
  }
})
