import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { Button, Input } from '../ui'
import type { CharacterClass } from '../../types'

interface CreateCharacterModalProps {
  onClose: () => void
}

const characterClasses: { value: CharacterClass; name: string; description: string; stats: string }[] = [
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

export default function CreateCharacterModal({ onClose }: CreateCharacterModalProps) {
  const [characterName, setCharacterName] = useState('')
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('warrior')
  const [error, setError] = useState('')
  
  const { createSession, loading } = useGameStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!characterName.trim()) {
      setError('Character name is required')
      return
    }

    try {
      await createSession(characterName.trim(), selectedClass)
      onClose()
    } catch (error: any) {
      setError(error.message || 'Failed to create character')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Input
          label="Character Name"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
          placeholder="Enter your character's name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Choose Your Class
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {characterClasses.map((charClass) => (
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
                onChange={(e) => setSelectedClass(e.target.value as CharacterClass)}
                className="sr-only"
              />
              <div>
                <h3 className="font-medieval text-lg text-medieval-gold mb-1">
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

      {error && (
        <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={loading}
          className="flex-1"
        >
          Create Character
        </Button>
      </div>
    </form>
  )
}