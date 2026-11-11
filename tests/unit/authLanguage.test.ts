import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { languageMetadataUpdate, signUpMetadata } from '../../src/lib/authLanguage.ts'

test('sign-up metadata keeps the username and the ui language', () => {
  assert.deepEqual(signUpMetadata('hero', 'es'), { username: 'hero', language: 'es' })
  assert.deepEqual(signUpMetadata('hero', 'en'), { username: 'hero', language: 'en' })
})

test('a language change is stored only while someone is signed in', () => {
  assert.deepEqual(languageMetadataUpdate('es', true), { data: { language: 'es' } })
  assert.equal(languageMetadataUpdate('en', false), null)
})

test('sign-up and language changes go through those helpers', async () => {
  const authStore = await readFile(new URL('../../src/store/authStore.ts', import.meta.url), 'utf8')

  assert.match(authStore, /signUpMetadata\(\s*normalizedUsername/)
  assert.match(authStore, /useLanguageStore\.getState\(\)\.language/)
  assert.match(authStore, /languageMetadataUpdate/)
  assert.match(authStore, /supabase\.auth\.updateUser/)
  assert.match(authStore, /passwordRecoveryRedirectTo/)
  assert.match(authStore, /resetPasswordForEmail/)
})
