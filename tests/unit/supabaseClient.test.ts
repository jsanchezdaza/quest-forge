import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

test('the auth client leaves a recovery code in the URL so the update-password page can retry it', () => {
  const source = readFileSync(new URL('../../src/lib/supabase.ts', import.meta.url), 'utf8')
  assert.match(source, /detectSessionInUrl:\s*false/)
})
