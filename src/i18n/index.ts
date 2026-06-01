import { useLanguageStore } from '../store/languageStore'
import { en } from './en'
import { es } from './es'

export type TranslationKey = keyof typeof en
type TranslationParams = Record<string, string | number>

const dictionaries = { en, es }

const interpolate = (template: string, params?: TranslationParams): string => {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_match, name) =>
    name in params ? String(params[name]) : `{${name}}`
  )
}

/**
 * Translate a key for the current language. Use this outside React components
 * (stores, plain modules). Inside components prefer `useTranslation` so the UI
 * re-renders when the language changes.
 */
export const translate = (key: TranslationKey, params?: TranslationParams): string => {
  const { language } = useLanguageStore.getState()
  return interpolate(dictionaries[language][key], params)
}

/**
 * React hook that returns a `t` bound to the current language and re-renders
 * the component whenever the language changes.
 */
export const useTranslation = () => {
  const language = useLanguageStore((state) => state.language)

  const t = (key: TranslationKey, params?: TranslationParams): string =>
    interpolate(dictionaries[language][key], params)

  return { t, language }
}
