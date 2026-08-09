import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

test('signup sends the normalized username as Supabase auth metadata', async () => {
  const authStore = await readFile(new URL('../../src/store/authStore.ts', import.meta.url), 'utf8')

  assert.match(authStore, /const normalizedUsername = username\.trim\(\)/)
  assert.match(authStore, /options:\s*\{\s*data:\s*\{\s*username:\s*normalizedUsername\s*\}/s)
})

test('authenticated sessions load and synchronize the persisted profile', async () => {
  const authStore = await readFile(new URL('../../src/store/authStore.ts', import.meta.url), 'utf8')

  assert.match(authStore, /loadAndSyncUserProfile/)
  assert.match(authStore, /from\(['"]user_profiles['"]\)/)
  assert.match(authStore, /onAuthStateChange\(\(_event, session\) =>/)
  assert.match(authStore, /setTimeout\(async/)
  assert.doesNotMatch(authStore, /onAuthStateChange\(async/)
})

test('new database installs persist auth metadata as the profile username', async () => {
  const schema = await readFile(new URL('../../supabase/schema.sql', import.meta.url), 'utf8')
  const migrations = await readFile(
    new URL('../../supabase/migrations/20260809_persist_profile_username.sql', import.meta.url),
    'utf8',
  )

  for (const sql of [schema, migrations]) {
    assert.match(sql, /raw_user_meta_data\s*->>\s*'username'/)
    assert.match(sql, /nullif\s*\(\s*trim/s)
  }
})
