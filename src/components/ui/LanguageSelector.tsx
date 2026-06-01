import { useLanguageStore, type Language } from '../../store/languageStore'
import { useTranslation } from '../../i18n'

const LANGUAGES: Language[] = ['en', 'es']

export default function LanguageSelector() {
  const { t, language } = useTranslation()
  const setLanguage = useLanguageStore((state) => state.setLanguage)

  return (
    <div
      role="group"
      aria-label="Language"
      className="flex items-center gap-1 rounded-lg border border-medieval-gold/40 bg-background-darker/80 backdrop-blur-sm p-1"
    >
      {LANGUAGES.map((option) => {
        const isActive = language === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => setLanguage(option)}
            aria-pressed={isActive}
            className={`min-h-[44px] px-3 rounded-md font-pixel-body text-xs uppercase tracking-wide transition-colors ${
              isActive
                ? 'bg-medieval-gold/10 text-medieval-gold'
                : 'text-gray-400 hover:text-medieval-gold'
            }`}
          >
            {t(option === 'en' ? 'language.en' : 'language.es')}
          </button>
        )
      })}
    </div>
  )
}
