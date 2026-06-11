import { Gem } from 'lucide-react'
import { useTranslation, type TranslationKey } from '../../i18n'

interface StatsListProps {
  stats: Record<string, number>
  title?: string
}

export default function StatsList({ stats, title }: StatsListProps) {
  const { t } = useTranslation()

  return (
    <div>
      <h3 className="flex items-center gap-2 font-medieval-decorative font-semibold text-lg text-medieval-gold uppercase tracking-wider drop-shadow-lg mb-4">
        <Gem className="w-5 h-5 shrink-0" aria-hidden="true" />
        {title ?? t('game.attributes')}
      </h3>
      <div className="space-y-3">
        {Object.entries(stats).map(([stat, value]) => (
          <div key={stat} className="flex justify-between">
            <span className="text-gray-100 capitalize text-sm font-medieval-narrative font-medium">
              {t(`stat.${stat}` as TranslationKey)}
            </span>
            <span className="text-medieval-gold font-semibold text-sm font-medieval-options">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
