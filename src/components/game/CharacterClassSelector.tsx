import type { CharacterClass } from '../../types'
import { useTranslation, type TranslationKey } from '../../i18n'

interface CharacterClassSelectorProps {
  selectedClass: CharacterClass
  onClassSelect: (characterClass: CharacterClass) => void
}

const CHARACTER_CLASSES: CharacterClass[] = [
  'warrior',
  'mage',
  'rogue',
  'cleric',
  'ranger',
  'paladin',
]

export default function CharacterClassSelector({ selectedClass, onClassSelect }: CharacterClassSelectorProps) {
  const { t } = useTranslation()

  return (
    <div>
      <label className="font-fantasy-classic font-semibold text-lg text-medieval-gold uppercase tracking-wider drop-shadow-lg block mb-3">
        {t('character.chooseClass')}
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CHARACTER_CLASSES.map((value) => (
          <label
            key={value}
            className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
              selectedClass === value
                ? 'border-medieval-gold bg-medieval-gold/10'
                : 'border-medieval-gold/30 hover:border-medieval-gold/60'
            }`}
          >
            <input
              type="radio"
              value={value}
              checked={selectedClass === value}
              onChange={(e) => onClassSelect(e.target.value as CharacterClass)}
              className="sr-only"
            />
            <div>
              <h3 className="font-fantasy-elegant font-medium text-lg text-gray-200 mb-1">
                {t(`class.${value}.name` as TranslationKey)}
              </h3>
              <p className="text-gray-300 text-sm mb-2">
                {t(`class.${value}.desc` as TranslationKey)}
              </p>
              <p className="text-medieval-darkgold text-xs">
                {t(`class.${value}.stats` as TranslationKey)}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
