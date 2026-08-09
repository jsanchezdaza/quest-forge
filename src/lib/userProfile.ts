import type { UserProfile } from '../types'

export interface AuthUserIdentity {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}

export interface UserProfileRepository {
  findById: (id: string) => Promise<UserProfile | null>
  upsertUsername: (id: string, username: string) => Promise<UserProfile>
}

function metadataUsername(user: AuthUserIdentity): string | null {
  const value = user.user_metadata?.username
  if (typeof value !== 'string') return null
  const username = value.trim()
  return username || null
}

export async function loadAndSyncUserProfile(
  user: AuthUserIdentity,
  repository: UserProfileRepository,
): Promise<UserProfile | null> {
  const profile = await repository.findById(user.id)
  const desiredUsername = metadataUsername(user)
  if (!desiredUsername) return profile

  const hasLegacyUsername = profile?.username === user.email
  if (!profile || hasLegacyUsername) {
    return repository.upsertUsername(user.id, desiredUsername)
  }

  return profile
}
