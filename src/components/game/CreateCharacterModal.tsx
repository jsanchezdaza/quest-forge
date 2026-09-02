import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { Button, Input, Textarea, ErrorMessage } from '../ui'
import CharacterClassSelector from './CharacterClassSelector'
import { generateBackstoryWithAI, isOpenRouterConfigured } from '../../lib/openrouter'
import { useTranslation } from '../../i18n'
import type { CharacterClass } from '../../types'

interface CreateCharacterModalProps {
  onClose: () => void
}

const getInitialStats = (characterClass: CharacterClass) => ({
  strength: ['warrior', 'paladin'].includes(characterClass) ? 15 : 10,
  dexterity: ['rogue', 'ranger'].includes(characterClass) ? 15 : 10,
  intelligence: characterClass === 'mage' ? 15 : 10,
  wisdom: ['cleric', 'ranger'].includes(characterClass) ? 15 : 10,
  constitution: ['warrior', 'paladin'].includes(characterClass) ? 14 : 10,
  charisma: characterClass === 'paladin' ? 15 : 10,
})

export default function CreateCharacterModal({ onClose }: CreateCharacterModalProps) {
  const [characterName, setCharacterName] = useState('')
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('warrior')
  const [backstory, setBackstory] = useState('')
  const [isGeneratingBackstory, setIsGeneratingBackstory] = useState(false)
  const [error, setError] = useState('')

  const { createSession, loading } = useGameStore()
  const { t } = useTranslation()
  const aiConfigured = isOpenRouterConfigured()

  const handleGenerateBackstory = async () => {
    if (!characterName.trim()) {
      setError(t('character.nameRequiredGenerate'))
      return
    }

    setError('')
    setIsGeneratingBackstory(true)
    setBackstory('')

    let generatedBackstory = ''

    await generateBackstoryWithAI(
      characterName.trim(),
      selectedClass,
      getInitialStats(selectedClass),
      (chunk: string) => {
        generatedBackstory += chunk
        setBackstory(generatedBackstory)
      },
      () => setIsGeneratingBackstory(false),
      (error: Error) => {
        setError(t('character.backstoryFailed', { error: error.message }))
        setIsGeneratingBackstory(false)
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!characterName.trim()) {
      setError(t('character.nameRequiredSubmit'))
      return
    }

    try {
      await createSession(
        characterName.trim(),
        selectedClass,
        backstory.trim() || undefined
      )
      onClose()
    } catch (error) {
      setError((error as Error).message || t('character.creationFailed'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label={t('form.characterNameLabel')}
        value={characterName}
        onChange={(e) => setCharacterName(e.target.value)}
        placeholder={t('form.characterNamePlaceholder')}
        required
      />

      <CharacterClassSelector
        selectedClass={selectedClass}
        onClassSelect={setSelectedClass}
      />

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-300">
            {t('form.backstoryLabel')}
          </label>
          {aiConfigured && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleGenerateBackstory}
              isLoading={isGeneratingBackstory}
              disabled={isGeneratingBackstory || loading}
              className="text-xs py-1 px-3"
            >
              {isGeneratingBackstory ? t('character.generating') : t('character.generateWithAI')}
            </Button>
          )}
        </div>
        <Textarea
          value={backstory}
          onChange={(e) => setBackstory(e.target.value)}
          placeholder={t('form.backstoryPlaceholder')}
          disabled={isGeneratingBackstory}
          rows={4}
          className="min-h-[120px]"
        />
        {!aiConfigured && (
          <p className="mt-1 text-xs text-gray-500">
            {t('character.configureAI')}
          </p>
        )}
      </div>

      <ErrorMessage message={error} />

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="flex-1"
        >
          {t('ui.cancel')}
        </Button>
        <Button
          type="submit"
          isLoading={loading}
          disabled={isGeneratingBackstory}
          className="flex-1"
        >
          {t('game.createCharacter')}
        </Button>
      </div>
    </form>
  )
}