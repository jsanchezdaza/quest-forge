import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { Button, Input } from '../ui'
import CharacterClassSelector from './CharacterClassSelector'
import type { CharacterClass } from '../../types'

interface CreateCharacterModalProps {
  onClose: () => void
}

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
    } catch (error) {
      setError((error as Error).message || 'Failed to create character')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Character Name"
        value={characterName}
        onChange={(e) => setCharacterName(e.target.value)}
        placeholder="Enter your character's name"
        required
      />

      <CharacterClassSelector
        selectedClass={selectedClass}
        onClassSelect={setSelectedClass}
      />

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