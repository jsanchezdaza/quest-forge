import type { CharacterClass } from '../../types'

interface CharacterClassOption {
  value: CharacterClass
  name: string
  description: string
  stats: string
}

interface CharacterClassSelectorProps {
  selectedClass: CharacterClass
  onClassSelect: (characterClass: CharacterClass) => void
}

const CHARACTER_CLASSES: CharacterClassOption[] = [
  {
    value: 'warrior',
    name: 'Warrior',
    description: 'A mighty fighter skilled in combat and weapons',
    stats: 'High Strength & Constitution'
  },
  {
    value: 'mage',
    name: 'Mage',
    description: 'A master of arcane magic and ancient knowledge',
    stats: 'High Intelligence'
  },
  {
    value: 'rogue',
    name: 'Rogue',
    description: 'A cunning thief skilled in stealth and daggers',
    stats: 'High Dexterity'
  },
  {
    value: 'cleric',
    name: 'Cleric',
    description: 'A divine healer blessed with holy powers',
    stats: 'High Wisdom'
  },
  {
    value: 'ranger',
    name: 'Ranger',
    description: 'A wilderness expert, master of bow and nature',
    stats: 'High Dexterity & Wisdom'
  },
  {
    value: 'paladin',
    name: 'Paladin',
    description: 'A holy warrior, champion of justice and light',
    stats: 'High Strength & Charisma'
  }
]

export default function CharacterClassSelector({ selectedClass, onClassSelect }: CharacterClassSelectorProps) {
  return (
    <div>
      <label className="font-fantasy-classic font-semibold text-lg text-medieval-gold uppercase tracking-wider drop-shadow-lg block mb-3">
        Choose Your Class
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CHARACTER_CLASSES.map((charClass) => (
          <label
            key={charClass.value}
            className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
              selectedClass === charClass.value
                ? 'border-medieval-gold bg-medieval-gold/10'
                : 'border-medieval-gold/30 hover:border-medieval-gold/60'
            }`}
          >
            <input
              type="radio"
              value={charClass.value}
              checked={selectedClass === charClass.value}
              onChange={(e) => onClassSelect(e.target.value as CharacterClass)}
              className="sr-only"
            />
            <div>
              <h3 className="font-fantasy-elegant font-medium text-lg text-gray-200 mb-1">
                {charClass.name}
              </h3>
              <p className="text-gray-300 text-sm mb-2">
                {charClass.description}
              </p>
              <p className="text-medieval-darkgold text-xs">
                {charClass.stats}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}