import { create } from 'zustand'

export type Language = 'en' | 'es'

const STORAGE_KEY = 'questforge.language'

const readInitialLanguage = (): Language => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'es') return stored

  return navigator.language.startsWith('es') ? 'es' : 'en'
}

interface LanguageState {
  language: Language
  setLanguage: (language: Language) => void
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: readInitialLanguage(),

  setLanguage: (language) => {
    localStorage.setItem(STORAGE_KEY, language)
    set({ language })
  },
}))
