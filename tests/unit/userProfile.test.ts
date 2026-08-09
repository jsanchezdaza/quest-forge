import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { UserProfile } from '../../src/types/index.ts'
import { loadAndSyncUserProfile, type UserProfileRepository } from '../../src/lib/userProfile.ts'

const existingProfile: UserProfile = {
  id: 'user-1',
  username: 'hero@example.com',
  created_at: '2026-01-01T00:00:00.000Z',
}

const user = (username?: unknown) => ({
  id: 'user-1',
  email: 'hero@example.com',
  user_metadata: username === undefined ? {} : { username },
})

function repository(profile: UserProfile | null) {
  const writes: Array<{ id: string; username: string }> = []
  const repo: UserProfileRepository = {
    findById: async () => profile,
    upsertUsername: async (id, username) => {
      writes.push({ id, username })
      return {
        id,
        username,
        created_at: profile?.created_at ?? '2026-01-02T00:00:00.000Z',
      }
    },
  }
  return { repo, writes }
}

test('replaces the legacy email username with the username from auth metadata', async () => {
  const { repo, writes } = repository(existingProfile)

  const profile = await loadAndSyncUserProfile(user('  TestHero  '), repo)

  assert.equal(profile?.username, 'TestHero')
  assert.deepEqual(writes, [{ id: 'user-1', username: 'TestHero' }])
})

test('creates a missing profile from auth metadata', async () => {
  const { repo, writes } = repository(null)

  const profile = await loadAndSyncUserProfile(user('TestHero'), repo)

  assert.equal(profile?.username, 'TestHero')
  assert.deepEqual(writes, [{ id: 'user-1', username: 'TestHero' }])
})

test('does not overwrite a username that the user has already customized', async () => {
  const customProfile = { ...existingProfile, username: 'ExistingHero' }
  const { repo, writes } = repository(customProfile)

  const profile = await loadAndSyncUserProfile(user('DifferentHero'), repo)

  assert.equal(profile, customProfile)
  assert.deepEqual(writes, [])
})

test('returns the stored profile when auth metadata has no usable username', async () => {
  const { repo, writes } = repository(existingProfile)

  const profile = await loadAndSyncUserProfile(user('   '), repo)

  assert.equal(profile, existingProfile)
  assert.deepEqual(writes, [])
})
