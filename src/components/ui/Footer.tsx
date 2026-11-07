import { useTranslation } from '../../i18n'

interface FooterProps {
  /**
   * Sign-up only. At 1024px wide and at most 800px tall, the inner
   * container's vertical padding is 6px. Horizontal padding stays 16px.
   */
  compactOnShortDesktop?: boolean
}

export default function Footer({ compactOnShortDesktop = false }: FooterProps) {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-medieval-gold/20 bg-background-card/30 backdrop-blur-sm">
      <div className={[
        'max-w-6xl mx-auto px-4 py-4',
        compactOnShortDesktop ? '[@media(min-width:1024px)_and_(max-height:800px)]:py-[6px]' : '',
      ].filter(Boolean).join(' ')}>
        <div className="text-center space-y-2">
          <p className="text-gray-400 font-pixel-body text-sm">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <p className="text-gray-400 font-pixel-body text-sm">
            {t('footer.author')}<a href="https://www.javisan.dev" target="_blank" rel="noopener noreferrer" className="text-medieval-gold hover:text-medieval-darkgold transition-colors">www.javisan.dev</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
