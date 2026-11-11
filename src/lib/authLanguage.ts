import type { Language } from '../store/languageStore'

/** Auth metadata stored when an account is created. */
export function signUpMetadata(username: string, language: Language) {
  return { username, language }
}

/**
 * Metadata patch for a language change. Null when nobody is signed in, so a
 * signed-out player can still switch the UI without a request.
 * `updateUser({ data })` merges into the existing metadata.
 */
export function languageMetadataUpdate(language: Language, signedIn: boolean) {
  if (!signedIn) return null
  return { data: { language } }
}
