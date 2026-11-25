import type { Language } from '../store/languageStore'

export function signUpMetadata(username: string, language: Language) {
  return { username, language }
}

export function languageMetadataUpdate(language: Language, signedIn: boolean) {
  if (!signedIn) return null
  return { data: { language } }
}
