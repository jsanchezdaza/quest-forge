import { create } from 'zustand'

export type Language = 'en' | 'es'

const STORAGE_KEY = 'questforge.language'

const readInitialLanguage = (): Language => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'es') return stored

  return navigator.language.startsWith('es') ? 'es' : 'en'
}

const writeDocumentLanguage = (language: Language) => {
  if (typeof document === 'undefined') return
  document.documentElement.lang = language
}

interface LanguageState {
  language: Language
  setLanguage: (language: Language) => void
}

export const useLanguageStore = create<LanguageState>((set) => {
  const initial = readInitialLanguage()
  writeDocumentLanguage(initial)

  return {
    language: initial,

    setLanguage: (language) => {
      localStorage.setItem(STORAGE_KEY, language)
      writeDocumentLanguage(language)
      set({ language })
    },
  }
})
